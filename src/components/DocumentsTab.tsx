import React, { useState, useMemo } from "react";
import { 
  FolderOpen, 
  Search, 
  Upload, 
  Trash2, 
  Bookmark, 
  FileText, 
  ExternalLink, 
  Download,
  FolderClosed,
  CheckCircle2,
  QrCode
} from "lucide-react";
import { Document, Project } from "../types";

interface DocumentsTabProps {
  documents: Document[];
  projects: Project[];
  onUploadDocument: (docData: Omit<Document, "id" | "uploadedAt">) => void;
  onDeleteDocument: (docId: string) => void;
  userRole: string;
  userDisplayName: string;
}

const DOCUMENT_CATEGORIES = [
  "Rencana Anggaran Biaya (RAB)",
  "SOP Perusahaan Konstruksi",
  "Gambar Kerja (CAD / DED)",
  "Kontrak & SPK Kerja",
  "Bukti Pembayaran / Invoice",
  "Foto Lapangan / Dokumentasi"
];

export default function DocumentsTab({
  documents,
  projects,
  onUploadDocument,
  onDeleteDocument,
  userRole,
  userDisplayName
}: DocumentsTabProps) {

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFolder, setActiveFolder] = useState<string>("Semua Kategori");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedQrDoc, setSelectedQrDoc] = useState<Document | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState(DOCUMENT_CATEGORIES[0]);
  const [fileType, setFileType] = useState("PDF");
  const [fileUrl, setFileUrl] = useState("");
  const [associatedProject, setAssociatedProject] = useState("Umum (Non-Proyek)");

  const canModify = ["Super Admin", "Direktur", "Admin", "Project Manager"].includes(userRole);

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            doc.associatedProjectName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFolder = activeFolder === "Semua Kategori" || doc.category === activeFolder;
      return matchesSearch && matchesFolder;
    });
  }, [documents, searchQuery, activeFolder]);

  const handleOpenUpload = () => {
    setName("");
    setCategory(DOCUMENT_CATEGORIES[0]);
    setFileType("PDF");
    setFileUrl("");
    setAssociatedProject("Umum (Non-Proyek)");
    setIsUploading(true);
  };

  const handleUploadDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onUploadDocument({
      name: name.includes(".") ? name : `${name}.${fileType.toLowerCase()}`,
      category,
      fileType,
      fileSize: `${(1.2 + Math.random() * 8).toFixed(1)} MB`,
      fileUrl: fileUrl.trim() || "https://example.com/mock-construction-asset.pdf",
      project: associatedProject,
      uploadedBy: userDisplayName,
      associatedProjectName: associatedProject,
      uploader: userDisplayName
    });

    setIsUploading(false);
  };

  const handleTriggerMockUpload = (e: React.DragEvent) => {
    e.preventDefault();
    setName("Simulasi_Arsip_Gambar_Kerja_Lintas.dwg");
    setFileType("DWG");
    setCategory("Gambar Kerja (CAD / DED)");
    setIsUploading(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="documents-tab-view">
      
      {/* File Cabinet Directories (Left) */}
      <div className="lg:col-span-4 bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex flex-col h-[calc(100vh-140px)]" id="documents-folders-panel">
        
        <div className="space-y-3 pb-3 border-b border-slate-100">
          <button
            onClick={handleOpenUpload}
            disabled={!canModify}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-[#002147] hover:bg-[#001733] transition text-white text-xs font-mono font-black uppercase tracking-wider disabled:opacity-40 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-[#D4AF37]" /> Unggah Dokumen Resmi
          </button>

          {/* Quick search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari file / No. SPK..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-[#002147] rounded py-2 pl-8 pr-3 text-xs placeholder-slate-400 focus:outline-none focus:border-[#D4AF37] focus:bg-white transition"
            />
          </div>
        </div>

        {/* Directory Cabinets list */}
        <div className="flex-grow overflow-y-auto space-y-1.5 mt-4 text-xs font-mono text-slate-700 pr-1 scrollbar-thin">
          
          <button
            onClick={() => {
              setActiveFolder("Semua Kategori");
              setIsUploading(false);
            }}
            className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition text-left cursor-pointer ${
              activeFolder === "Semua Kategori" 
              ? "bg-[#002147]/5 border-[#002147] text-[#002147] font-bold" 
              : "border-transparent hover:bg-slate-50"
            }`}
          >
            <span className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-[#D4AF37]" />
              Semua Berkas Kabinet
            </span>
            <span className="text-[10px] text-slate-450 font-bold bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
              {documents.length}
            </span>
          </button>

          {DOCUMENT_CATEGORIES.map((cat, i) => {
            const count = documents.filter(doc => doc.category === cat).length;
            const isSelected = activeFolder === cat;
            return (
              <button
                key={i}
                onClick={() => {
                  setActiveFolder(cat);
                  setIsUploading(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition text-left cursor-pointer ${
                  isSelected 
                  ? "bg-[#002147]/5 border-[#002147] text-[#002147] font-bold" 
                  : "border-transparent hover:bg-slate-50 text-slate-600 hover:text-[#002147]"
                }`}
              >
                <span className="flex items-center gap-2 truncate pr-1">
                  <Bookmark className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="truncate">{cat}</span>
                </span>
                <span className="text-[10px] text-slate-450 font-bold bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded flex-shrink-0">
                  {count}
                </span>
              </button>
            );
          })}

        </div>

      </div>

      {/* Grid view and details work area (Right) */}
      <div className="lg:col-span-8 bg-white border border-slate-205 shadow-sm rounded-xl p-5 md:p-6 min-h-[calc(100vh-140px)] flex flex-col justify-between" id="documents-cabinet-workspace">

        {/* 1. STATE: UPLOAD RESMI FORM */}
        {isUploading && (
          <form onSubmit={handleUploadDocument} className="space-y-4 font-sans" id="document-upload-form">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black uppercase font-mono tracking-wider text-[#002147]">
                Lengkapi Atribut Dokumen Konstruksi
              </h3>
              <button
                type="button"
                onClick={() => setIsUploading(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-mono cursor-pointer"
              >
                Kembali
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Nama Dokumen / Arsip Berkas:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Lampiran_BA_Serah_Terima_02"
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-850 focus:outline-none focus:bg-white focus:border-[#D4AF37]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Klasifikasi Kategori Dokumen:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none"
                >
                  {DOCUMENT_CATEGORIES.map((cat, i) => (
                    <option key={i} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Jenis Format File:</label>
                <select
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-850 focus:outline-none font-mono"
                >
                  <option value="PDF">PDF (Portable Document File)</option>
                  <option value="DWG">DWG (AutoCAD Drawing CAD)</option>
                  <option value="XLSX">XLSX (Microsoft Excel Sheets)</option>
                  <option value="DOCX">DOCX (Microsoft Word)</option>
                  <option value="ZIP">ZIP / RAR (Compressed)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Kaitkan Ke Kontrak Proyek:</label>
                <select
                  value={associatedProject}
                  onChange={(e) => setAssociatedProject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none"
                >
                  <option value="Umum (Non-Proyek)">Umum (Arsip Non-Proyek)</option>
                  {projects.map((p, idx) => (
                    <option key={idx} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Tautkan URL File Cadangan (Atau Kosongkan):</label>
              <input
                type="text"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://gdrive.google.com/share/..."
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none font-mono focus:border-[#D4AF37]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 font-mono">
              <button
                type="button"
                onClick={() => setIsUploading(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="bg-[#002147] hover:bg-[#001733] text-white px-5 py-2 rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Arsip Sekarang
              </button>
            </div>
          </form>
        )}

        {/* 2. STATE: LIST OF ARCHIVED ELEMENTS & DRAG & DROP AREA */}
        {!isUploading && (
          <div className="space-y-5 flex-grow flex flex-col justify-between" id="documents-main-workspace-view">
            
            {/* Header filters */}
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-xs text-[#002147] font-bold font-mono uppercase flex items-center gap-1.5">
                <FolderOpen className="w-4 h-4 text-[#D4AF37]" />
                Folder Aktif: <span className="text-[#002147] font-black underline decoration-[#D4AF37] decoration-2">{activeFolder}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono bg-white border border-slate-200 px-2.5 py-0.5 rounded text-right">
                Jumlah Terfilter: {filteredDocs.length} berkas
              </span>
            </div>

            {/* Grid of files matching criteria */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto max-h-[340px] pr-1">
              {filteredDocs.length > 0 ? (
                filteredDocs.map((doc, idx) => (
                  <div key={idx} className="bg-slate-50 hover:bg-white rounded-xl border border-slate-200/80 p-3.5 space-y-3 hover:border-[#D4AF37]/50 hover:shadow-sm transition relative flex flex-col justify-between duration-150">
                    
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] bg-[#002147] px-2 py-0.5 rounded font-mono font-extrabold text-[#D4AF37]">
                          {doc.fileType.toUpperCase()}
                        </span>
                        
                        {userRole === "Super Admin" && (
                          <button
                            onClick={() => {
                              if (confirm("Hapus dokumen ini dari kabinet digital?")) {
                                onDeleteDocument(doc.id);
                              }
                            }}
                            className="text-red-500 hover:text-red-700 transition cursor-pointer"
                            title="Hapus Dokumen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <h4 className="text-xs font-black text-[#002147] line-clamp-2 leading-tight break-all" title={doc.name}>
                        {doc.name}
                      </h4>

                      <div className="space-y-0.5 text-[9.5px] font-mono text-slate-500 leading-none">
                        <div className="truncate">Proyek: <strong className="text-slate-800 font-semibold">{doc.associatedProjectName}</strong></div>
                        <div className="pt-1.5 text-slate-400">Oleh: {doc.uploader}</div>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setSelectedQrDoc(doc)}
                        className="p-1 px-2 rounded bg-[#002147]/5 border border-[#002147]/10 text-[#002147] font-mono text-[9px] flex items-center gap-1 hover:bg-[#002147]/10 transition duration-150 cursor-pointer"
                        title="Tampilkan Kode QR"
                      >
                        <QrCode className="w-3 h-3 text-[#D4AF37]" /> QR Code
                      </button>

                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 px-2 rounded bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-mono text-[9px] flex items-center gap-1 hover:text-[#002147] hover:border-[#D4AF37]/50 transition duration-150"
                      >
                        <ExternalLink className="w-3 h-3 text-slate-400" /> Buka
                      </a>

                      <a
                        href={doc.fileUrl}
                        download={`${doc.name}.${doc.fileType.toLowerCase()}`}
                        className="p-1 px-2 rounded bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-mono text-[9px] flex items-center gap-1 hover:text-[#002147] hover:border-[#D4AF37]/50 transition duration-150"
                      >
                        <Download className="w-3 h-3 text-slate-400" /> Unduh
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-12 text-slate-400 font-mono text-xs flex flex-col justify-center items-center gap-2">
                  <FileText className="w-8 h-8 text-slate-300" />
                  Belum ada dokumen digital dalam folder klasifikasi ini.
                </div>
              )}
            </div>

            {/* Simulative Drag and Drop Zone */}
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleTriggerMockUpload}
              className="mt-4 p-5 bg-slate-50 border-2 border-dashed border-slate-250 rounded-xl hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition duration-150 hover:shadow-xs cursor-pointer flex flex-col justify-center items-center text-center space-y-1.5"
              onClick={handleOpenUpload}
            >
              <Upload className="w-6 h-6 text-[#D4AF37] animate-pulse" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-[#002147]">Klik atau seret (Drag &amp; Drop) berkas kemari</p>
                <p className="text-[10px] text-slate-500 font-mono leading-tight">Mendukung Gambar Kerja .DWG, Rencana Anggaran .XLSX, Dokumen Bukti Bayar .PDF up to 25MB.</p>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* QR Code Scannable Viewer Modal */}
      {selectedQrDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="qr-modal-overlay">
          <div className="bg-white border-2 border-[#002147] rounded-xl shadow-2xl p-5 max-w-sm w-full space-y-4 animate-scale-up" id="qr-modal-content">
            <div className="flex justify-between items-start border-b border-slate-100 pb-2">
              <div>
                <span className="text-[9px] bg-[#002147] font-extrabold text-[#D4AF37] px-2 py-0.5 rounded font-mono uppercase">
                  {selectedQrDoc.fileType.toUpperCase()} ARCHIVE
                </span>
                <h4 className="text-xs font-black text-[#002147] mt-1 break-all line-clamp-2">
                  {selectedQrDoc.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQrDoc(null)}
                className="p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer font-mono font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* QR Code Presentation Frame */}
            <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-200/85 rounded-xl p-5 space-y-3.5 shadow-inner">
              <div className="bg-white p-3.5 rounded-xl shadow-xs border border-slate-200">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=002147&data=${encodeURIComponent(selectedQrDoc.fileUrl)}`}
                  alt="QR Code Berkas"
                  className="w-40 h-40 object-contain selection:bg-transparent"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback to standard render if the server fails
                    (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent("https://example.com/asset.pdf")}`;
                  }}
                />
              </div>

              <div className="text-center space-y-1 font-sans">
                <p className="text-[10px] font-bold text-[#002147] font-mono uppercase tracking-wider">
                  Pindai Dari Lapangan (Scan Me)
                </p>
                <p className="text-[9.5px] text-slate-500 leading-snug max-w-[240px] mx-auto">
                  Site Supervisor dapat memindai kode di atas langsung dari gawai pintar / tablet untuk meninjau berkas spesifikasi teknis di site area.
                </p>
              </div>
            </div>

            <div className="flex gap-2 font-mono">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 bg-slate-100 hover:bg-slate-202 text-slate-700 py-2 rounded text-[10px] font-black uppercase tracking-wider transition cursor-pointer border border-slate-200 text-center"
              >
                Cetak QR
              </button>
              <button
                type="button"
                onClick={() => setSelectedQrDoc(null)}
                className="flex-1 bg-[#002147] hover:bg-[#001733] text-white py-2 rounded text-[10px] font-black uppercase tracking-wider transition cursor-pointer text-center"
              >
                Tutup Sesi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
