import React, { useState, useRef, useEffect, useMemo } from "react";
import { 
  Send, 
  Bot, 
  User, 
  HelpCircle, 
  Loader2, 
  HardHat, 
  FileSpreadsheet, 
  Building,
  Sparkles,
  Info
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

export default function AiAssistantTab() {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "Halo rekan Kontraktor! Saya adalah **Gemini AI Konstruksi Specialist**. \n\nSaya diformulasikan khusus untuk membantu anda menyusun estimasi pekerjaan, Rencana Anggaran Biaya (RAB) kasar beton, saran pengerjaan metode sipil, draf klausul penawaran tender, atau menyadur regulasi K-3 SNI terkait. Apa rincian kendala teknik yang sedang ingin Anda selesaikan di lapangan hari ini?",
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest chats
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Quick Suggestion Queries
  const SUGGESTIONS = [
    { title: "Metode Bor Pile", query: "Tuliskan draf metode kerja pengeboran tiang bored pile pada tanah lempung basah dekat sungai." },
    { title: "Klausul Tender", query: "Buatkan draf klausul kesepakatan jaminan kualitas pengerjaan aspal AC-WC di dalam proposal tender kontraktor sipil." },
    { title: "Estimasi RAB Kasar", query: "Hitungkan estimasi volume semen, pasir, dan split kasar untuk pengecoran jalan beton ukuran 100m x 4m ketebalan 20cm dengan mutu K-300." },
    { title: "Checklist Safety K3", query: "Rancang checklist keselamatan K3 harian khusus untuk pekerjaan galian gantung berisiko longsor setinggi 4 meter." }
  ];

  const handleSendMessage = async (customQuery?: string) => {
    const textToSend = customQuery || inputVal;
    if (!textToSend.trim() || loading) return;

    // Register User Message
    const userMsg: Message = {
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    };

    // Construct request payload with history context
    const chatHistory = [
      ...messages.map((m) => ({
        role: m.sender === "bot" ? "assistant" : "user",
        text: m.text
      })),
      {
        role: "user",
        text: textToSend
      }
    ];

    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setLoading(true);

    try {
      const response = await fetch("/api/gemini/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory })
      });
      const data = await response.json();
      
      if (response.ok) {
        setMessages((prev) => [
          ...prev, 
          {
            sender: "bot",
            text: data.text || data.reply || "",
            timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev, 
          {
            sender: "bot",
            text: `Terjadi galat respons sistem: ${data.error || "Gagal menghubungi server Gemini AI."}`,
            timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
          }
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev, 
        {
          sender: "bot",
          text: `Kesalahan Jaringan: ${err.message}. Pastikan key GEMINI_API_KEY telah diatur di panel Secrets.`,
          timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="ai-assistant-tab-container">
      
      {/* Side Guidance panel (Left) */}
      <div className="lg:col-span-4 bg-white border border-slate-205 shadow-sm rounded-xl p-4 flex flex-col justify-between h-[calc(100vh-140px)]" id="ai-guidance-sidebar">
        
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#002147]/5 rounded-full border border-[#002147]/15 text-[#002147] text-[10px] font-mono uppercase tracking-widest font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> Gemini Enterprise Model
          </div>

          <div className="space-y-1.5">
            <h3 className="text-sm font-black uppercase font-mono tracking-wider text-[#002147] flex items-center gap-1.5">
              Asisten Estimator &amp; Teknik Sipil
            </h3>
            <p className="text-xs text-slate-650 leading-relaxed font-sans">
              Model dilatih menggunakan draf Rencana Kerja &amp; Syarat-Syarat (RKS), referensi SNI konstruksi beton, panduan K3 umum kementerian PUPR, dan standar pengadaan BUMN Indonesia.
            </p>
          </div>

          {/* Quick Query suggest card deck */}
          <div className="space-y-2.5 pt-4 border-t border-slate-100">
            <span className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider block">
              Pilih Rujukan Kueri Cepat:
            </span>

            {SUGGESTIONS.map((item, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(item.query)}
                className="w-full text-left p-3 rounded-lg bg-slate-50 hover:bg-white border border-slate-200 hover:border-[#D4AF37]/50 transition group select-none cursor-pointer"
              >
                <div className="text-xs font-bold font-mono text-[#002147] group-hover:text-[#D4AF37] transition flex items-center gap-1">
                  <Bot className="w-3.5 h-3.5 flex-shrink-0" />
                  {item.title}
                </div>
                <p className="text-[10.5px] text-slate-500 group-hover:text-slate-700 mt-1 line-clamp-2">
                  {item.query}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Security / Quality badge */}
        <div className="p-3 bg-slate-105 border border-slate-200 rounded-lg text-[10px] text-slate-500 flex items-start gap-2 leading-snug font-mono mt-4">
          <Info className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
          <span>Setiap output model bersifat rekomendasi teknis asisten. Harap lakukan verifikasi uji laboratorium beton di lapangan!</span>
        </div>

      </div>

      {/* Primary Chat Box Console (Right) */}
      <div className="lg:col-span-8 bg-white border border-slate-205 shadow-sm rounded-xl p-4 flex flex-col h-[calc(100vh-140px)] justify-between" id="ai-chat-console">
        
        {/* Chats Messages Log Area */}
        <div className="flex-grow overflow-y-auto space-y-4 pr-1 p-2" id="ai-chat-log-scrollable">
          {messages.map((m, idx) => {
            const isBot = m.sender === "bot";
            return (
              <div 
                key={idx} 
                className={`flex gap-3 items-start select-none ${isBot ? "justify-start" : "justify-end"}`}
              >
                {/* Avatar */}
                {isBot && (
                  <div className="p-2 bg-[#002147]/5 text-[#002147] rounded-lg border border-[#002147]/10 flex-shrink-0">
                    <HardHat className="w-4.5 h-4.5" />
                  </div>
                )}

                <div className="space-y-1 max-w-[85%]">
                  <div className={`p-3 rounded-2xl border text-xs leading-relaxed font-sans ${
                    isBot 
                    ? "bg-slate-50 border-slate-200 text-slate-850 shadow-xs" 
                    : "bg-[#002147] text-white border-transparent shadow-xs"
                  }`}>
                    {isBot ? (
                      <div className="prose prose-slate prose-xs text-slate-700 font-sans leading-relaxed">
                        <ReactMarkdown>{m.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap font-sans text-white font-medium">{m.text}</p>
                    )}
                  </div>
                  <div className={`text-[10px] font-mono text-slate-400 px-1.5 ${
                    isBot ? "text-left" : "text-right"
                  }`}>
                    {isBot ? "Gemini AI" : "Anda"} &bull; {m.timestamp}
                  </div>
                </div>

                {/* User avatar */}
                {!isBot && (
                  <div className="p-2 bg-[#D4AF37]/15 text-[#002147] rounded-xl border border-[#D4AF37]/25 flex-shrink-0">
                    <User className="w-4.5 h-4.5" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="p-2 bg-[#002147]/5 text-[#002147] rounded-lg animate-spin">
                <Loader2 className="w-4.5 h-4.5" />
              </div>
              <span className="text-[11px] text-[#002147] font-mono">Gemini AI sedang menghitung estimasi parameter konstruksi...</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input box form */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="mt-4 pt-3 border-t border-slate-100 flex gap-2"
        >
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={loading}
            placeholder="Tanyakan estimasi volume, perizinan SIPB, draf SOP, atau klausul tender..."
            className="flex-grow bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#D4AF37] focus:bg-white transition font-mono"
            id="chat-user-input-field"
          />
          <button
            type="submit"
            disabled={loading || !inputVal.trim()}
            className="p-3 bg-[#002147] hover:bg-[#001733] text-white rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1 shadow-sm disabled:opacity-40 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>

    </div>
  );
}
