import React, { useState, useMemo } from "react";
import { 
  FileText, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Play, 
  Download, 
  GitBranch, 
  CheckCircle, 
  ChevronRight, 
  Wand2, 
  Cpu, 
  Info, 
  Loader2, 
  User, 
  BookmarkCheck, 
  FileCheck2,
  CalendarDays
} from "lucide-react";
import { Sop, UserRole } from "../types";
import ReactMarkdown from "react-markdown";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface SopsTabProps {
  sops: Sop[];
  onAddSop: (sop: Omit<Sop, "id" | "createdAt">) => Promise<void>;
  onUpdateSop: (id: string, updates: Partial<Sop>) => Promise<void>;
  onDeleteSop: (id: string) => Promise<void>;
  userRole: UserRole;
  userDisplayName: string;
}

const CATEGORIES = [
  "SOP Pengelolaan Proyek",
  "SOP Keuangan",
  "SOP Pengadaan Material",
  "SOP SDM",
  "SOP K3",
  "SOP Tender",
  "SOP Quality Control",
  "SOP Serah Terima Proyek",
  "SOP Pelayanan Klien"
];

export default function SopsTab({ 
  sops, 
  onAddSop, 
  onUpdateSop, 
  onDeleteSop, 
  userRole, 
  userDisplayName
}: SopsTabProps) {
  
  // States
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua Kategori");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSopId, setActiveSopId] = useState<string | null>(sops[0]?.id || null);
  
  // Modals / Form States
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Manual SOP Form fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [purpose, setPurpose] = useState("");
  const [scope, setScope] = useState("");
  const [responsibility, setResponsibility] = useState("");
  const [procedure, setProcedure] = useState("");
  const [checklist, setChecklist] = useState("");
  const [supportForms, setSupportForms] = useState("");
  const [status, setStatus] = useState<"Draft" | "Reviewing" | "Approved">("Draft");
  
  // Revision Note fields
  const [revisionSummary, setRevisionSummary] = useState("");

  // AI SOP Generator states
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [generatedSopText, setGeneratedSopText] = useState("");
  const [generatedCategory, setGeneratedCategory] = useState(CATEGORIES[0]);

  // Current selected SOP object
  const activeSop = useMemo(() => {
    return sops.find(s => s.id === activeSopId) || sops[0] || null;
  }, [sops, activeSopId]);

  // Filter & Search Logic
  const filteredSops = useMemo(() => {
    return sops.filter(s => {
      const matchCat = selectedCategory === "Semua Kategori" || s.category === selectedCategory;
      const matchSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.contentPurpose.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [sops, selectedCategory, searchQuery]);

  // Role Permissions
  const canModify = useMemo(() => {
    return ["Super Admin", "Direktur", "Project Manager", "Admin"].includes(userRole);
  }, [userRole]);

  const canApprove = useMemo(() => {
    return ["Super Admin", "Direktur", "Project Manager"].includes(userRole);
  }, [userRole]);

  // Handlers
  const handleOpenCreateForm = () => {
    setTitle("");
    setCategory(CATEGORIES[0]);
    setPurpose("");
    setScope("");
    setResponsibility("");
    setProcedure("");
    setChecklist("");
    setSupportForms("");
    setStatus("Draft");
    setIsCreating(true);
    setIsEditing(false);
    setIsGenerating(false);
  };

  const handleOpenEditForm = () => {
    if (!activeSop) return;
    setTitle(activeSop.title);
    setCategory(activeSop.category);
    setPurpose(activeSop.contentPurpose);
    setScope(activeSop.contentScope);
    setResponsibility(activeSop.contentResponsibility);
    setProcedure(activeSop.contentProcedure);
    setChecklist(activeSop.contentChecklist);
    setSupportForms(activeSop.contentSupportForms);
    setStatus(activeSop.status);
    setRevisionSummary("");
    setIsEditing(true);
    setIsCreating(false);
    setIsGenerating(false);
  };

  const handleOpenGenerator = () => {
    setAiPrompt("");
    setGeneratedSopText("");
    setGeneratedCategory(CATEGORIES[0]);
    setIsGenerating(true);
    setIsCreating(false);
    setIsEditing(false);
  };

  const handleSaveSopManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !purpose.trim()) return;

    try {
      if (isCreating) {
        await onAddSop({
          title,
          category,
          contentPurpose: purpose,
          contentScope: scope,
          contentResponsibility: responsibility,
          contentProcedure: procedure,
          contentChecklist: checklist,
          contentSupportForms: supportForms,
          author: userDisplayName,
          authorId: "user-id",
          status,
          isTemplate: false,
          revisionHistory: JSON.stringify([{
            revisionNo: 1,
            updatedBy: userDisplayName,
            updatedAt: new Date().toISOString(),
            changeSummary: "Draf Awal SOP Dibuat"
          }])
        });
      } else if (isEditing && activeSop) {
        const historyList = activeSop.revisionHistory ? JSON.parse(activeSop.revisionHistory) : [];
        const nextRevNo = historyList.length + 1;
        const nextHistory = [
          ...historyList,
          {
            revisionNo: nextRevNo,
            updatedBy: userDisplayName,
            updatedAt: new Date().toISOString(),
            changeSummary: revisionSummary.trim() || "Pembaruan metadata SOP lapangan"
          }
        ];

        await onUpdateSop(activeSop.id, {
          title,
          category,
          contentPurpose: purpose,
          contentScope: scope,
          contentResponsibility: responsibility,
          contentProcedure: procedure,
          contentChecklist: checklist,
          contentSupportForms: supportForms,
          status,
          revisionHistory: JSON.stringify(nextHistory)
        });
      }
      setIsCreating(false);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (nextStatus: "Reviewing" | "Approved") => {
    if (!activeSop) return;
    try {
      const historyList = activeSop.revisionHistory ? JSON.parse(activeSop.revisionHistory) : [];
      const nextRevNo = historyList.length + 1;
      const nextHistory = [
        ...historyList,
        {
          revisionNo: nextRevNo,
          updatedBy: userDisplayName,
          updatedAt: new Date().toISOString(),
          changeSummary: `Status disetujui menjadi: ${nextStatus}`
        }
      ];

      await onUpdateSop(activeSop.id, {
        status: nextStatus,
        revisionHistory: JSON.stringify(nextHistory)
      });
    } catch (err) {
      console.error(err);
    }
  };

  // AI SOP Generation call
  const generateSopWithAi = async () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    setGeneratedSopText("");

    try {
      const response = await fetch("/api/gemini/generate-sop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      const data = await response.json();
      if (response.ok) {
        setGeneratedSopText(data.text);
      } else {
        setGeneratedSopText(`Gagal menghasilkan SOP: ${data.error || "Terjadi galat."}`);
      }
    } catch (err: any) {
      setGeneratedSopText(`Kesalahan jaringan: ${err.message}`);
    } finally {
      setAiGenerating(false);
    }
  };

  // Save AI SOP to database in parsed fields
  const handleSaveAiGeneratedSop = async () => {
    if (!generatedSopText) return;
    
    // Extract a realistic title & variables from markdown
    const lines = generatedSopText.split("\n");
    let extractedTitle = aiPrompt;
    for (const l of lines) {
      if (l.startsWith("# SOP:")) {
        extractedTitle = l.replace("# SOP:", "").trim();
        break;
      } else if (l.startsWith("# ")) {
        extractedTitle = l.replace("# ", "").trim();
        break;
      }
    }

    try {
      await onAddSop({
        title: extractedTitle,
        category: generatedCategory,
        contentPurpose: "Berdasarkan doktrin AI: Memelihara standar kualitas tinggi secara berkesinambungan.",
        contentScope: "Meliputi wilayah kerja konstruksi teknik umum.",
        contentResponsibility: "Project Manager, Supervisor, HSE K3.",
        contentProcedure: generatedSopText, // Store the raw Markdown in procedure so we can render it beautifully
        contentChecklist: "- Lakukan verifikasi lapangan lengkap\n- Kenakan rompi K3\n- Laporkan kendala kemajuan harian",
        contentSupportForms: "- Form Laporan Harian Konstruksi AI\n- Inspeksi Keselamatan",
        status: "Draft",
        author: `AI Engine (Disetujui ${userDisplayName})`,
        authorId: "ai-system",
        isTemplate: false,
        revisionHistory: JSON.stringify([{
          revisionNo: 1,
          updatedBy: `AI Generator`,
          updatedAt: new Date().toISOString(),
          changeSummary: "Dokumen dikonstruksikan sepenuhnya via Gemini-3.5-Flash"
        }])
      });

      // Navigate to newest or close
      setIsGenerating(false);
      alert("SOP sukses disimpan ke registrasi daftar SOP perusahaan!");
    } catch (err) {
      console.error(err);
    }
  };

  const exportSopsListPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(0, 33, 71); // #002147
    doc.rect(0, 0, 210, 32, "F");
    doc.setFillColor(212, 175, 55); // #D4AF37
    doc.rect(0, 32, 210, 2, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("SOP KONTRAKTOR PRO", 15, 14);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);
    doc.text("Sistem Informasi Standardisasi SOP & ERP Sipil Konstruksi", 15, 20);
    
    doc.setTextColor(212, 175, 55);
    doc.setFont("helvetica", "bold");
    doc.text("DAFTAR INDEKS REGISTRASI STANDAR OPERASIONAL PROSEDUR", 15, 26);
    
    // Doc Info
    doc.setTextColor(80, 80, 80);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(`Dicetak pada: ${new Date().toLocaleString("id-ID")}`, 145, 42);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 33, 71);
    doc.text("TABEL REGISTRASI SOP PERUSAHAAN", 15, 45);
    
    const tableData = filteredSops.map((s) => [
      s.id.toUpperCase().slice(0, 8),
      s.category,
      s.title,
      s.author,
      s.status
    ]);

    autoTable(doc, {
      startY: 49,
      head: [["ID SOP", "Kategori Dokumen", "Judul Standardisasi Operasional (SOP)", "Koordinator Pengarang", "Status"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [0, 33, 71],
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: "bold",
        halign: "center"
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 3,
        valign: "middle"
      },
      columnStyles: {
        0: { halign: "center", fontStyle: "bold" },
        1: { halign: "left" },
        2: { halign: "left", fontStyle: "bold" },
        4: { halign: "center", fontStyle: "bold" }
      }
    });

    doc.save("Indeks_Daftar_SOP_Kontraktor.pdf");
  };

  const exportActiveSopPDF = () => {
    if (!activeSop) return;
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(0, 33, 71); // #002147
    doc.rect(0, 0, 210, 32, "F");
    doc.setFillColor(212, 175, 55); // #D4AF37
    doc.rect(0, 32, 210, 2, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("SOP KONTRAKTOR PRO", 15, 14);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);
    doc.text("Sistem Informasi Standardisasi SOP & ERP Sipil Konstruksi", 15, 20);
    
    doc.setTextColor(212, 175, 55);
    doc.setFont("helvetica", "bold");
    doc.text("STANDAR OPERASIONAL PROSEDUR (SOP) RESMI", 15, 26);
    
    // Doc Meta Info Block
    doc.setFillColor(248, 250, 252);
    doc.rect(15, 42, 180, 40, "F");
    
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 33, 71);
    doc.text("IDENTITAS REGISTRASI DOKUMEN", 18, 48);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text(`Judul SOP      : ${activeSop.title}`, 18, 54);
    doc.text(`Kategori       : ${activeSop.category}`, 18, 60);
    doc.text(`Nomor Dokumen  : SOP-KTR-0${activeSop.id.slice(0, 8).toUpperCase()}`, 18, 66);
    doc.text(`Kreator & PM   : ${activeSop.author}  |  Status Regulasi: ${activeSop.status}  |  Rilis: ${new Date(activeSop.createdAt).toLocaleDateString("id-ID")}`, 18, 72);
    doc.text(`Keterangan     : Khusus Kalangan Internal Kontraktor Pro ERP`, 18, 78);

    // Render contents as styled text sections
    let currentY = 92;

    const printSection = (titleText: string, contentText: string) => {
      // Check height bounds
      if (currentY > 260) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(0, 33, 71);
      doc.text(titleText, 15, currentY);
      
      doc.setFillColor(0, 33, 71);
      doc.rect(15, currentY + 1.5, 180, 0.4, "F"); // Divider
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(65, 65, 65);
      
      const splitText = doc.splitTextToSize(contentText || "N/A", 176);
      doc.text(splitText, 17, currentY + 6);
      
      currentY += 10 + splitText.length * 4;
    };

    printSection("1. TUJUAN UTAMA", activeSop.contentPurpose);
    printSection("2. RUANG LINGKUP PENGERJAAN LINGKUNGAN", activeSop.contentScope);
    printSection("3. PERAN, WEWENANG & TANGGUNG JAWAB", activeSop.contentResponsibility);
    
    // For procedure, check if we need to split onto a new page if the procedure is long
    if (currentY > 165) {
      doc.addPage();
      currentY = 20;
    }
    
    printSection("4. DETAIL PROSEDUR KERJA LAPANGAN", activeSop.contentProcedure);
    printSection("5. LEMBAR CHECKLIST QUALITY CONTROL (QC) & K3", activeSop.contentChecklist);
    printSection("6. FORMULIR PENDUKUNG & ARSIP HARIAN", activeSop.contentSupportForms);

    // Sign off Block
    if (currentY > 240) {
      doc.addPage();
      currentY = 25;
    } else {
      currentY += 8;
    }
    
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 33, 71);
    doc.text("Disiapkan oleh:", 17, currentY);
    doc.text(activeSop.author, 17, currentY + 16);
    doc.setFont("helvetica", "normal");
    doc.text("___________________", 17, currentY + 17);
    
    doc.setFont("helvetica", "bold");
    doc.text("Disetujui oleh,", 135, currentY);
    doc.text("Direktur Konstruksi & K3", 135, currentY + 16);
    doc.setFont("helvetica", "normal");
    doc.text("___________________", 135, currentY + 17);

    doc.save(`SOP_${activeSop.title.replace(/ /g, "_")}.pdf`);
  };

  // Action: Download SOP as Simulated Text
  const triggerDownloadCopy = (format: "PDF" | "DOCX") => {
    if (!activeSop) return;
    if (format === "PDF") {
      exportActiveSopPDF();
      return;
    }
    
    const separator = "=".repeat(60);
    const content = `${separator}\nSOP KONTRAKTOR PRO - DOKUMEN PERUSAHAAN CONSTR ERP\n${separator}\nJudul SOP    : ${activeSop.title}\nKategori     : ${activeSop.category}\nNo. Dokumen  : SOP-KTR-${activeSop.id}\nTertulis Oleh: ${activeSop.author}\nStatus       : ${activeSop.status}\n\n1. TUJUAN\n${activeSop.contentPurpose}\n\n2. RUANG LINGKUP\n${activeSop.contentScope}\n\n3. TANGGUNG JAWAB & WEWENANG\n${activeSop.contentResponsibility}\n\n4. PROSEDUR KERJA\n${activeSop.contentProcedure}\n\n5. CHECKLIST QUALITY CONTROL\n${activeSop.contentChecklist}\n\n6. FORM PENDUKUNG\n${activeSop.contentSupportForms}\n${separator}`;
    
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${activeSop.title.toLowerCase().replace(/ /g, "_")}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="sops-tab-container">
      
      {/* Category List & Sidebar Catalogue (Left) */}
      <div className="lg:col-span-4 bg-white border border-slate-202 shadow-sm rounded-xl p-4 flex flex-col h-[calc(100vh-140px)]" id="sops-sidebar">
        
        {/* Top actions */}
        <div className="space-y-3 pb-4 border-b border-slate-100">
          
          <div className="flex gap-2">
            <button
              onClick={handleOpenCreateForm}
              disabled={!canModify}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 transition border border-slate-200 text-slate-700 text-xs font-mono font-semibold uppercase tracking-wider disabled:opacity-40 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tambah SOP
            </button>
            
            <button
              onClick={handleOpenGenerator}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#002147] hover:bg-[#001733] text-white text-xs font-mono font-black uppercase tracking-wider transition cursor-pointer"
            >
              <Cpu className="w-4 h-4 text-[#D4AF37]" /> AI Generator
            </button>
          </div>

          <button
            onClick={exportSopsListPDF}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition border border-slate-200 text-[#002147] text-xs font-mono font-bold uppercase tracking-wider cursor-pointer font-sans"
            title="Export saring indeks standar operasional prosedur ke PDF"
          >
            <Download className="w-4 h-4 text-[#D4AF37]" /> Export Indeks SOP (PDF)
          </button>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari SOP / Dokumen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#D4AF37] transition font-mono"
            />
          </div>

          {/* Category Dropdown Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-50 border border-slate-203 rounded-lg py-2 px-3 text-xs text-slate-750 font-mono focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="Semua Kategori">Semua Kategori ({sops.length})</option>
            {CATEGORIES.map((cat, idx) => (
              <option key={idx} value={cat}>
                {cat}
              </option>
            ))}
          </select>

        </div>

        {/* Scrollable list of SOP titles */}
        <div className="flex-1 overflow-y-auto space-y-2 mt-4 pr-1 scrollbar-thin" id="sops-catalogue-sidebar-list">
          {filteredSops.length > 0 ? (
            filteredSops.map((sop) => {
              const isActive = activeSopId === sop.id;
              return (
                <button
                  key={sop.id}
                  onClick={() => {
                    setActiveSopId(sop.id);
                    setIsCreating(false);
                    setIsEditing(false);
                    setIsGenerating(false);
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition cursor-pointer text-slate-850 ${
                    isActive 
                    ? "bg-[#002147]/5 border-[#002147] shadow-sm" 
                    : "bg-white border-slate-202 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-xs font-mono text-slate-400 leading-none">
                      {sop.id.toUpperCase()}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold font-mono border ${
                      sop.status === "Approved" 
                      ? "bg-green-50 border-green-200 text-green-700" 
                      : sop.status === "Reviewing" 
                      ? "bg-blue-50 border-blue-200 text-blue-700" 
                      : "bg-slate-100 border-slate-200 text-slate-600"
                    }`}>
                      {sop.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-black mt-1.5 leading-snug break-words text-[#002147]">
                    {sop.title}
                  </h4>
                  <p className="text-[10px] text-[#D4AF37] font-mono mt-1 truncate">
                    {sop.category}
                  </p>
                </button>
              );
            })
          ) : (
            <div className="text-center py-8 text-slate-600 font-mono text-xs">
              SOP tidak diketemukan.
            </div>
          )}
        </div>

      </div>

      {/* Main Container Work Area (Right) */}
      <div className="lg:col-span-8 bg-white border border-slate-205 shadow-sm rounded-xl p-5 md:p-6 min-h-[calc(100vh-140px)] flex flex-col justify-between" id="sops-work-area">

        {/* 1. STATE: AI SOP GENERATOR MODULE */}
        {isGenerating && (
          <div className="space-y-6" id="ai-generator-panel">
            <div className="flex items-center gap-3 border-b border-slate-150 pb-4">
              <div className="p-2.5 rounded-lg bg-[#002147]/5 text-[#002147] border border-[#002147]/10">
                <Cpu className="w-5.5 h-5.5" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase font-mono tracking-wider text-[#002147] flex items-center gap-2">
                  Gemini AI SOP Generator Pro <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded font-mono font-normal">MODEL: FLASH-3.5</span>
                </h3>
                <p className="text-xs text-slate-500">Instruksikan mesin model untuk memproduksi kerangka SOP teknik sipil instan.</p>
              </div>
            </div>

            {/* Input area */}
            <div className="space-y-4 font-sans">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 font-mono">Topik / Deskripsi Pekerjaan Lapangan:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Contoh: Buat SOP pemasangan paving block, pembangunan jalan beton, galian parit, dsb."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#D4AF37] transition duration-150"
                  />
                  <button
                    onClick={generateSopWithAi}
                    disabled={aiGenerating || !aiPrompt.trim()}
                    className="bg-[#002147] hover:bg-[#001733] active:scale-[0.98] transition text-white py-3 px-6 rounded-lg text-xs font-mono font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
                  >
                    {aiGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Menghitung...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 text-[#D4AF37]" /> Generasi
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Suggestions box */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[10px] text-slate-400 font-mono uppercase">Contoh Saran:</span>
                {[
                  "Pekerjaan Drainase U-Ditch",
                  "Pondasi Bored Pile Jembatan",
                  "Pengecoran Sloof Kolom Rumah",
                  "Pemasangan Keramik Homogeneous"
                ].map((s, i) => (
                  <button 
                    key={i} 
                    onClick={() => setAiPrompt(s)}
                    className="text-[10px] bg-slate-50 hover:bg-slate-100 border border-slate-205 text-slate-600 py-1 px-2.5 rounded transition cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>

              {aiGenerating && (
                <div className="p-8 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center space-y-3.5 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#002147]" />
                  <div className="space-y-1">
                    <p className="text-xs text-[#002147] font-mono font-bold">Gemini AI sedang menyusun spesifikasi teknik sipil...</p>
                    <p className="text-[10px] text-slate-500">Mencakup standardisasi SNI, checklist K3 lapangan, tanggug jawab, dan form pengawasan.</p>
                  </div>
                </div>
              )}

              {/* Result Area */}
              {generatedSopText && !aiGenerating && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Langkah Terakhir</span>
                      <h4 className="text-xs font-black text-[#002147]">Draf SOP Berhasil Direkonstruksi AI!</h4>
                      <p className="text-[10px] text-slate-500">Pilih berkas klasifikasi kategori sebelum menyimpan SOP ini ke daftar utama.</p>
                    </div>

                    <div className="flex gap-2.5 items-end justify-start">
                      <select
                        value={generatedCategory}
                        onChange={(e) => setGeneratedCategory(e.target.value)}
                        className="bg-white border border-slate-250 rounded-lg p-2 text-xs text-slate-800 font-mono focus:outline-none focus:border-[#D4AF37]"
                      >
                        {CATEGORIES.map((cat, idx) => (
                          <option key={idx} value={cat}>{cat}</option>
                        ))}
                      </select>

                      <button
                        onClick={handleSaveAiGeneratedSop}
                        className="bg-green-700 hover:bg-green-800 active:scale-[0.98] transition text-white py-2 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider cursor-pointer font-sans"
                      >
                        Simpan SOP
                      </button>
                    </div>
                  </div>

                  {/* Rendered Markdown Response */}
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 max-h-[460px] overflow-y-auto prose prose-slate prose-xs text-slate-700 font-sans" id="ai-generated-rendered-markdown font-sans">
                    <ReactMarkdown>{generatedSopText}</ReactMarkdown>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* 2. STATE: MANUAL SOP FORM (CREATE  / EDIT) */}
        {(isCreating || isEditing) && (
          <form onSubmit={handleSaveSopManual} className="space-y-4" id="sop-edit-create-form">
            <div className="flex justify-between items-center border-b border-slate-150 pb-3 font-sans">
              <h3 className="text-sm font-black uppercase font-mono tracking-wider text-[#002147] flex items-center gap-1">
                <FileCheck2 className="w-5 h-5 text-[#D4AF37]" />
                {isCreating ? "Registrasi SOP Baru" : `Ubah SOP: ${activeSop?.title}`}
              </h3>
              
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setIsEditing(false);
                }}
                className="text-xs text-slate-400 hover:text-slate-600 font-mono cursor-pointer"
              >
                Batalkan
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Judul Prosedur Kerja (SOP):</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Pekerjaan Pengecoran Kolom"
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#D4AF37]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Kategori SOP Konstruksi:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-[#D4AF37]"
                >
                  {CATEGORIES.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3 font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">1. Tujuan:</label>
                  <textarea
                    rows={2}
                    required
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Deskripsikan tujuan SOP..."
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#D4AF37]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">2. Ruang Lingkup:</label>
                  <textarea
                    rows={2}
                    value={scope}
                    onChange={(e) => setScope(e.target.value)}
                    placeholder="Batasan pengerjaan..."
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">3. Tanggung Jawab &amp; Wewenang:</label>
                <input
                  type="text"
                  value={responsibility}
                  onChange={(e) => setResponsibility(e.target.value)}
                  placeholder="Misal: Project Manager, HSE Officer, Pelaksana Lapangan"
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#D4AF37]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">4. Prosedur Kerja Utama (Dapat Menggunakan Markdown / Steps):</label>
                <textarea
                  rows={5}
                  value={procedure}
                  onChange={(e) => setProcedure(e.target.value)}
                  placeholder="1. Posisikan alat utama di titik galian&#10;2. Pasang jaring pelindung K3&#10;3. Mulai proses pengecoran perlahan..."
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">5. Checklist QC / Inspeksi Kualitas:</label>
                  <textarea
                    rows={2.5}
                    value={checklist}
                    onChange={(e) => setChecklist(e.target.value)}
                    placeholder="- Cek kerataan aspal&#10;- Ukur slump test beton"
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#D4AF37]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">6. Form Pendukung:</label>
                  <textarea
                    rows={2.5}
                    value={supportForms}
                    onChange={(e) => setSupportForms(e.target.value)}
                    placeholder="- Form LHP&#10;- Surat Jalan"
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {isEditing && (
                <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Catatan Revisi / Tujuan Pembaruan:</label>
                  <input
                    type="text"
                    required
                    value={revisionSummary}
                    onChange={(e) => setRevisionSummary(e.target.value)}
                    placeholder="Contoh: Mengubah poin safety pengoperasian boiler atau regulasi SNI terbaru..."
                    className="w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-slate-150 font-sans">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setIsEditing(false);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 border border-slate-200 rounded text-xs font-mono font-bold cursor-pointer"
              >
                Batal
              </button>
              
              <button
                type="submit"
                className="bg-[#002147] hover:bg-[#001733] text-white px-5 py-2 rounded text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
              >
                Selesai &amp; Simpan
              </button>
            </div>
          </form>
        )}

        {/* 3. STATE: DUAL-READ / DETAIL SOP DISPLAY */}
        {!isCreating && !isEditing && !isGenerating && activeSop && (
          <div className="space-y-6 flex-1 flex flex-col justify-between" id="sop-detail-view-container">
            
            {/* Header Meta */}
            <div className="border-b border-slate-100 pb-4 space-y-3.5 font-sans">
              
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-slate-50 border border-slate-200 px-2 py-0.5 rounded font-mono text-slate-550">
                      ID: #{activeSop.id.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono bg-[#002147]/5 text-[#002147] py-0.5 px-2 rounded-full border border-[#002147]/10 font-bold">
                      {activeSop.category}
                    </span>
                  </div>
                  <h2 className="text-md sm:text-lg md:text-xl font-black text-[#002147] mt-1">
                    {activeSop.title}
                  </h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => triggerDownloadCopy("PDF")}
                    className="p-1.5 rounded bg-slate-50 hover:bg-slate-100 text-[#002147] border border-slate-200 hover:border-[#D4AF37] transition text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                    title="Download draft PDF"
                  >
                    <Download className="w-3.5 h-3.5 text-[#D4AF37]" /> PDF
                  </button>
                  <button
                    onClick={() => triggerDownloadCopy("DOCX")}
                    className="p-1.5 rounded bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 hover:border-[#D4AF37] transition text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                    title="Download DOCX"
                  >
                    <Download className="w-3.5 h-3.5 text-[#D4AF37]" /> DOCX
                  </button>

                  {canModify && (
                    <button
                      onClick={handleOpenEditForm}
                      className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  )}

                  {canModify && (
                    <button
                      onClick={() => {
                        if (confirm("Hapus dokumen SOP ini dari registrasi perusahaan?")) {
                          onDeleteSop(activeSop.id);
                        }
                      }}
                      className="p-1.5 rounded bg-red-50 hover:bg-red-105 border border-red-200 text-red-650 transition cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Approval status badge controller */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex gap-4 items-center text-[11px] text-slate-500 font-mono">
                  <span className="flex items-center gap-1 text-slate-300">
                    <User className="w-3.5 h-3.5 text-amber-500" /> Pengarang: <strong className="text-slate-100 font-semibold">{activeSop.author}</strong>
                  </span>
                  <span>
                    No. Dokumen: <strong className="text-slate-100 font-semibold">SOP-KTR-0{activeSop.id}</strong>
                  </span>
                </div>

                {/* Status approval workflow */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-mono uppercase">Status Regulasi:</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold border ${
                    activeSop.status === "Approved" 
                    ? "bg-green-500/10 border-green-500/20 text-green-400" 
                    : activeSop.status === "Reviewing" 
                    ? "bg-blue-500/10 border-blue-500/20 text-blue-400" 
                    : "bg-slate-800 border-slate-700 text-slate-300"
                  }`}>
                    {activeSop.status}
                  </span>

                  {canApprove && activeSop.status !== "Approved" && (
                    <button
                      onClick={() => handleUpdateStatus("Approved")}
                      className="inline-flex items-center gap-1 text-[10px] tracking-wider py-1 px-2.5 bg-green-600 hover:bg-green-700 font-bold font-mono uppercase text-white rounded transition"
                    >
                      <CheckCircle className="w-3 h-3" /> Setujui SOP
                    </button>
                  )}

                  {canApprove && activeSop.status === "Draft" && (
                    <button
                      onClick={() => handleUpdateStatus("Reviewing")}
                      className="inline-flex items-center gap-1 text-[10px] tracking-wider py-1 px-2.5 bg-blue-600 hover:bg-blue-700 font-bold font-mono uppercase text-white rounded transition"
                    >
                      <GitBranch className="w-3 h-3" /> Ajukan Review
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* SOP Content Body */}
            <div className="flex-1 mt-5 space-y-5 overflow-y-auto max-h-[500px]" id="sop-detail-scrollable-body">
              
              {/* If procedure contains raw markdown (AI generated), render that markdown entirely */}
              {activeSop.contentProcedure.includes("# SOP:") || activeSop.contentProcedure.includes("## 1. TUJUAN") ? (
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 prose prose-slate prose-xs text-slate-750 font-sans leading-relaxed">
                  <ReactMarkdown>{activeSop.contentProcedure}</ReactMarkdown>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 font-sans">
                  <div className="md:col-span-8 space-y-4">
                    
                    {/* Tujuan Box */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-xs">
                      <h4 className="text-xs font-black font-mono text-[#002147] uppercase tracking-widest border-b border-slate-200 pb-2 mb-2">
                        1. TUJUAN SOP
                      </h4>
                      <p className="text-xs text-slate-650 leading-relaxed font-sans">{activeSop.contentPurpose}</p>
                    </div>

                    {/* Ruang Lingkup Box */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-xs">
                      <h4 className="text-xs font-black font-mono text-[#002147] uppercase tracking-widest border-b border-slate-200 pb-2 mb-2">
                        2. RUANG LINGKUP
                      </h4>
                      <p className="text-xs text-slate-655 leading-relaxed font-sans">{activeSop.contentScope}</p>
                    </div>

                    {/* Tanggung Jawab */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-xs">
                      <h4 className="text-xs font-black font-mono text-[#002147] uppercase tracking-widest border-b border-slate-200 pb-2 mb-2">
                        3. TANGGUNG JAWAB & WEWENANG
                      </h4>
                      <p className="text-xs text-slate-655 leading-relaxed font-sans font-medium">{activeSop.contentResponsibility}</p>
                    </div>

                    {/* Prosedur Kerja Pip */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-xs">
                      <h4 className="text-xs font-black font-mono text-[#002147] uppercase tracking-widest border-b border-slate-200 pb-2 mb-2">
                        4. PROSEDUR KERJA TEKNIS KRONOLOGIS
                      </h4>
                      <div className="text-xs text-slate-705 leading-relaxed font-mono whitespace-pre-wrap">{activeSop.contentProcedure}</div>
                    </div>

                  </div>

                  <div className="md:col-span-4 space-y-4">
                    
                    {/* Checklist */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-xs">
                      <h4 className="text-xs font-black font-mono text-[#002147] uppercase tracking-widest border-b border-slate-200 pb-2 mb-2">
                        5. CHECKLIST PENGAWASAN (QC)
                      </h4>
                      <div className="text-xs text-slate-655 space-y-1 font-sans leading-relaxed whitespace-pre-wrap">
                        {activeSop.contentChecklist}
                      </div>
                    </div>

                    {/* Forms */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-xs">
                      <h4 className="text-xs font-black font-mono text-[#002147] uppercase tracking-widest border-b border-slate-200 pb-2 mb-2">
                        6. FORM PENGERJAAN & ARSIP
                      </h4>
                      <div className="text-xs text-slate-655 space-y-1 font-mono whitespace-pre-wrap">
                        {activeSop.contentSupportForms}
                      </div>
                    </div>

                    {/* Revision History Log */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-[11px]">
                      <h4 className="text-[10px] font-black font-mono text-[#002147] uppercase tracking-wider pb-1.5 border-b border-slate-200 mb-2 flex items-center gap-1">
                        <GitBranch className="w-3.5 h-3.5 text-[#D4AF37]" /> RIWAYAT REVISI SOP
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {activeSop.revisionHistory ? (
                          (() => {
                            try {
                              const history = JSON.parse(activeSop.revisionHistory);
                              return (history as any[]).map((rev, i) => (
                                <div key={i} className="border-l border-slate-205 pl-2 pb-2 last:pb-0">
                                  <div className="flex justify-between font-mono text-[9px] text-slate-450">
                                    <span>REV #{rev.revisionNo} &bull; {rev.updatedBy}</span>
                                    <span>{new Date(rev.updatedAt).toLocaleDateString("id-ID")}</span>
                                  </div>
                                  <p className="text-slate-600 text-[10px] mt-0.5">{rev.changeSummary}</p>
                                </div>
                              ));
                            } catch (e) {
                              return <p className="text-slate-500 font-mono">Ada draf riwayat kustom.</p>;
                            }
                          })()
                        ) : (
                          <p className="text-slate-600 font-mono">Draf Orisinil.</p>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>

            {/* Bottom metadata */}
            <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500 font-mono flex flex-col sm:flex-row sm:justify-between sm:items-center">
              <span>SOP diaktualisasi pada: <strong className="text-slate-400">{new Date(activeSop.createdAt).toLocaleDateString("id-ID")}</strong></span>
              <span>Dokumen ini bersifat rahasia bagi kalangan internal perusahaan</span>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
