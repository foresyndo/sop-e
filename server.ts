import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize the Gemini SDK safely
  const apiKey = process.env.GEMINI_API_KEY || "MY_GEMINI_API_KEY";
  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Helper function to handle high-demand Google GenAI API errors with a robust waterfall/retry mechanism
  async function generateContentWithRetryAndFallback(params: any) {
    const candidateModels = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
    
    // Ensure the requested model is at the front of our list if it's not already there.
    let modelsToTry = [params.model];
    for (const m of candidateModels) {
      if (!modelsToTry.includes(m)) {
        modelsToTry.push(m);
      }
    }

    let lastError: any = null;

    for (let i = 0; i < modelsToTry.length; i++) {
      const currentModel = modelsToTry[i];
      const maxRetriesPerModel = 2; // Try up to 2 times for each model before giving up and going to the next
      
      for (let attempt = 1; attempt <= maxRetriesPerModel; attempt++) {
        const currentParams = { ...params, model: currentModel };
        
        try {
          console.log(`[AI Request] Memulai panggilan ke model: ${currentModel} (Upaya ${attempt}/${maxRetriesPerModel})`);
          const response = await ai.models.generateContent(currentParams);
          console.log(`[AI Request] Berhasil menggunakan model: ${currentModel}`);
          return response;
        } catch (error: any) {
          lastError = error;
          const errMessage = error?.message || "";
          const errStatus = error?.status || error?.statusCode || 0;
          
          console.warn(`[AI Warning] Panggilan ke model "${currentModel}" gagal pada upaya ${attempt} (Status: ${errStatus}). Detail: ${errMessage}`);
          
          // If model is busy (503) or out of quota (429), immediately switch to alternative models instead of waiting
          const isOverloadedOrUnavailable = errStatus === 503 || errStatus === 429 || 
            errMessage.includes("503") || errMessage.includes("UNAVAILABLE") || 
            errMessage.includes("high demand") || errMessage.includes("exhausted");
            
          if (isOverloadedOrUnavailable) {
            console.log(`[AI Fast Failover] Model "${currentModel}" sibuk atau tidak tersedia. Beralih ke alternatif model selanjutnya tanpa jeda.`);
            break; // Break active attempts for this model, and move to the next candidate model
          }
          
          // If this is not the last attempt for current model, back off and retry
          if (attempt < maxRetriesPerModel) {
            const delayMs = attempt * 1200; // 1.2s delay for the first retry
            console.log(`[AI Backoff] Mencoba kembali model "${currentModel}" setelah jeda aman sebesar ${delayMs}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        }
      }
      
      console.warn(`[AI Failover] Model "${currentModel}" habis kuota/sibuk setelah ${maxRetriesPerModel} upaya. Menyiapkan beralih ke model berikutnya secepatnya.`);
    }

    throw lastError || new Error("Gagal memproses permintaan AI pada seluruh alternatif model.");
  }

  // SOP Generation Engine
  app.post("/api/gemini/generate-sop", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Topik SOP diperlukan" });
      }

      console.log(`Menghasilkan SOP dengan topik: "${prompt}"`);

      const response = await generateContentWithRetryAndFallback({
        model: "gemini-3.5-flash",
        contents: `Buatlah dokumen Standar Operasional Prosedur (SOP) formal konstruksi dalam Bahasa Indonesia untuk topik: "${prompt}".

SOP ini harus sangat profesional, dapat langsung digunakan di lapangan, dan mencakup elemen-elemen berikut secara lengkap dalam format Markdown:

# SOP: ${prompt.toUpperCase()}

**Kategori**: [Tentukan kategori dari SOP ini, misal: SOP Pengelolaan Proyek / SOP Keuangan / SOP Pengadaan Material / SOP SDM / SOP K3 / SOP Tender / SOP Quality Control / SOP Serah Terima Proyek]
**No. Dokumen**: SOP-KTR-${Math.floor(100 + Math.random() * 900)}
**Tanggal Efektif**: 5 Juni 2026
**Status**: Draf Terverifikasi (AI)

---

## 1. TUJUAN
[Tuliskan tujuan spesifik dan terperinci mengapa prosedur ini diperlukan dalam kegiatan konstruksi/properti]

## 2. RUANG LINGKUP
[Tuliskan batasan-batasan di mana prosedur ini diterapkan dan pihak-pihak yang terlibat]

## 3. TANGGUNG JAWAB & WEWENANG
- **Project Manager**: [Tugas & Tanggung jawab terkait]
- **Site Supervisor / Pelaksana Lapangan**: [Tugas & Tanggung jawab terkait]
- **Petugas K3**: [Tugas & Tanggung jawab terkait]
- **Tim Lapangan / Tenaga Kerja**: [Tugas & Tanggung jawab terkait]

## 4. PROSEDUR KERJA
[Sediakan prosedur langkah-demi-langkah yang logis, aman, dan berstandar teknis sipil tinggi. Tuliskan dalam bentuk rincian nomor bertingkat.]

## 5. CHECKLIST PENGAWASAN (QUALITY CONTROL)
[Berikan minimal 5 poin checklist praktis untuk melakukan inspeksi kualitas atau keselamatan di lapangan sebelum, saat, dan sesudah pengerjaan ini]

## 6. FORM PENDUKUNG & ARSIP
- Form Pengawasan Harian Kerja
- Laporan Absensi & Catatan K3 Harian
- Form Berita Acara Inspeksi Pekerjaan

---
*Dokumen ini digenerasi secara otomatis melalui modul SOP Kontraktor Pro AI Engine.*`,
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini SOP Generator Error:", error);
      res.status(500).json({ error: error.message || "Gagal menghasilkan konten SOP" });
    }
  });

  // Constructor-focused AI Chat Assistant
  app.post("/api/gemini/assistant", async (req, res) => {
    try {
      let chatHistory = req.body.messages;
      
      if (!chatHistory || !Array.isArray(chatHistory)) {
        // Fallback to single message
        const singleMsg = req.body.message || req.body.text || req.body.prompt;
        if (singleMsg) {
          chatHistory = [
            { role: "user", text: singleMsg }
          ];
        } else {
          return res.status(400).json({ error: "Daftar percakapan (messages) atau parameter 'message' diperlukan" });
        }
      }

      console.log(`Memproses percakapan asisten konstruksi. Jumlah pesan: ${chatHistory.length}`);

      // Map communication history to content blocks
      const contents = chatHistory.map((m: any) => ({
        role: m.role === "assistant" || m.role === "model" ? "model" : "user",
        parts: [{ text: m.text || m.content || "" }]
      }));

      const response = await generateContentWithRetryAndFallback({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: `Anda adalah "Asisten Konstruksi AI Pro" dari platform "SOP Kontraktor Pro".
Tugas Anda adalah melayani dan membantu para kontraktor, developer perumahan, konsultan teknik, dan perusahaan infrastruktur dalam menyelesaikan persoalan teknis dan administratif.

Karakteristik Jawaban Anda:
1. Selalu berikan jawaban terperinci, akurat secara metode konstruksi, bersikap sopan, berwibawa, dan sangat teknis/praktis.
2. Jika ditanyakan tentang RAB (Rencana Anggaran Biaya), buatlah estimasi terperinci dalam format tabel markdown yang rapi dengan perkiraan harga logis di Indonesia.
3. Jika ditanyakan tentang surat penawaran, surat perjanjian, atau dokumen administrasi lainnya, buatkan draf surat formal lengkap yang siap disalin oleh pengguna.
4. Jika ditanyakan tentang masalah teknik lapangan (drainase, pemadatan tanah, aspal, beton, instalasi listrik, struktur besi, dsb.), jelaskan langkah-langkah kerja berstandar SNI (Standar Nasional Indonesia).
5. Bahasa: Selalu gunakan Bahasa Indonesia yang profesional dan formal. gunakan simbol pendukung yang rapi.`,
        }
      });

      res.json({ text: response.text, reply: response.text });
    } catch (error: any) {
      console.error("Gemini Assistant Error:", error);
      res.status(500).json({ error: error.message || "Gagal memproses penjelasan AI" });
    }
  });

  // Serve Vite / production assets
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server 'SOP Kontraktor Pro' running on network http://0.0.0.0:${PORT}`);
  });
}

startServer();
