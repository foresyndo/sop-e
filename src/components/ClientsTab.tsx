import React, { useState, useMemo } from "react";
import { Building2, Search, Mail, Phone, Trash2, Award, UserCheck } from "lucide-react";
import { Client, Project } from "../types";

interface ClientsTabProps {
  clients: Client[];
  projects: Project[];
  onAddClient: (clientData: Omit<Client, "id" | "createdAt">) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
  userRole: string;
}

export default function ClientsTab({
  clients,
  projects,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  userRole
}: ClientsTabProps) {

  const [searchQuery, setSearchQuery] = useState("");
  const [activeClientId, setActiveClientId] = useState<string | null>(clients[0]?.id || null);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"Lead" | "Tender" | "Kontrak Aktif" | "Selesai">("Lead");
  const [notes, setNotes] = useState("");

  const canModify = ["Super Admin", "Direktur", "Admin", "Project Manager"].includes(userRole);

  const formatIDR = (value: number) => {
    if (value >= 1000000000) {
      return `Rp ${(value / 1000000000).toFixed(2)} Miliar`;
    }
    if (value >= 1000000) {
      return `Rp ${(value / 1000000).toFixed(0)} Juta`;
    }
    return `Rp ${value.toLocaleString("id-ID")}`;
  };

  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery))
    );
  }, [clients, searchQuery]);

  const activeClient = useMemo(() => {
    return clients.find(c => c.id === activeClientId) || clients[0] || null;
  }, [clients, activeClientId]);

  const clientProjects = useMemo(() => {
    if (!activeClient) return [];
    return projects.filter(p => p.client.toLowerCase() === activeClient.company.toLowerCase());
  }, [projects, activeClient]);

  const handleOpenAddForm = () => {
    setCompany("");
    setName("");
    setEmail("");
    setPhone("");
    setStatus("Lead");
    setNotes("");
    setIsCreating(true);
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !name.trim()) return;

    onAddClient({
      company,
      name,
      email,
      phone,
      status,
      notes,
      contact: phone || email || "",
      projectHistory: "[]"
    });

    setIsCreating(false);
    // Auto active latest client if available
    setTimeout(() => {
      if (clients.length > 0) {
        setActiveClientId(clients[clients.length - 1].id);
      }
    }, 400);
  };

  const handleUpdateStatus = (newVal: string) => {
    if (!activeClient) return;
    onUpdateClient({
      ...activeClient,
      status: newVal as any
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="clients-tab-container">
      
      {/* Client List (Left) */}
      <div className="lg:col-span-4 bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex flex-col h-[calc(100vh-140px)]" id="clients-sidebar">
        
        <div className="space-y-3 pb-3 border-b border-slate-100">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-[#002147] uppercase font-mono tracking-wider flex items-center gap-1">
              <Building2 className="w-4 h-4 text-[#D4AF37]" />
              Direktori Klien &amp; Mitra
            </h3>
            
            <button
              onClick={handleOpenAddForm}
              disabled={!canModify}
              className="p-1 px-2 rounded bg-[#002147] hover:bg-[#001733] text-white font-mono text-[10px] font-bold uppercase tracking-wider disabled:opacity-40 cursor-pointer"
            >
              + Klien Baru
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari instansi / penanggung jawab..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded py-2 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#D4AF37]"
            />
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-grow overflow-y-auto space-y-2 mt-4 pr-1 scrollbar-thin">
          {filteredClients.map((cli) => {
            const isActive = activeClientId === cli.id;
            return (
              <button
                key={cli.id}
                onClick={() => {
                  setActiveClientId(cli.id);
                  setIsCreating(false);
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition cursor-pointer text-slate-800 ${
                  isActive 
                  ? "bg-[#002147]/5 border-[#002147] shadow-sm" 
                  : "bg-white border-slate-200/80 hover:bg-slate-50"
                }`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="text-xs font-black text-[#002147] leading-snug">
                    {cli.company}
                  </h4>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-bold uppercase leading-none border ${
                    cli.status === "Kontrak Aktif" 
                    ? "bg-green-50 border-green-200 text-green-700" 
                    : cli.status === "Selesai" 
                    ? "bg-blue-50 border-blue-200 text-blue-700" 
                    : "bg-amber-50 border-amber-200 text-amber-700"
                  }`}>
                    {cli.status}
                  </span>
                </div>

                <div className="text-[10px] text-slate-550 font-mono mt-2 flex justify-between items-center">
                  <span>PIC: {cli.name}</span>
                  <span>{cli.phone}</span>
                </div>
              </button>
            );
          })}
        </div>

      </div>

      {/* Client Detail Workplace (Right) */}
      <div className="lg:col-span-8 bg-white border border-slate-205 shadow-sm rounded-xl p-5 md:p-6 min-h-[calc(100vh-140px)] flex flex-col justify-between" id="clients-work-area">

        {/* 1. STATE: ADD CLIENT FORM */}
        {isCreating && (
          <form onSubmit={handleCreateClient} className="space-y-4 font-sans" id="client-create-form">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black uppercase font-mono tracking-wider text-[#002147]">
                Registrasi Mitra Klien Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-mono cursor-pointer"
              >
                Kembali
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Nama Lembaga / Perusahaan Mitra:</label>
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Contoh: Dinas Pekerjaan Umum Kabupaten"
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#D4AF37]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Nama Penanggung Jawab Kantor (PIC):</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Bpk. H. Ahmad Fauzi"
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Alamat Email:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="klien@dinaspu.go.id"
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#D4AF37]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Telepon / WhatsApp Aktif:</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#D4AF37] font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Status Hubungan Proyek (Pipeline):</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 w-full focus:outline-none focus:bg-white focus:border-[#D4AF37]"
              >
                <option value="Lead">Lead / Negosiasi Draf</option>
                <option value="Tender">Proses Sanggah Tender</option>
                <option value="Kontrak Aktif">Kontrak Kerja Aktif (SPK)</option>
                <option value="Selesai">Proyek Rampung (FHO/PCO)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Catatan Khusus Klien:</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Preferensi standar beton k3, target penyelesaian, dokumen lampiran..."
                className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#D4AF37]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded text-xs font-mono font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="bg-[#002147] hover:bg-[#001733] text-white px-5 py-2 rounded text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
              >
                Daftarkan Mitra
              </button>
            </div>
          </form>
        )}

        {/* 2. STATE: DETAILS & CRM PROJECT ASSOCIATION */}
        {!isCreating && activeClient && (
          <div className="space-y-6 flex-grow flex flex-col justify-between" id="client-detail-view">
            
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] border border-[#002147]/20 bg-[#002147]/5 text-[#002147] py-0.5 px-2.5 rounded-full font-mono font-bold uppercase">
                  ID Mitra: #CLI-0{activeClient.id}
                </span>
                
                <h2 className="text-md sm:text-lg md:text-xl font-black text-[#002147] mt-1">
                  {activeClient.company}
                </h2>
                
                <p className="text-xs text-slate-500 font-mono">
                  PIC Penanggung Jawab: <strong className="text-slate-700 font-bold">{activeClient.name}</strong>
                </p>
              </div>

              <div className="flex gap-2">
                <select
                  value={activeClient.status}
                  onChange={(e) => handleUpdateStatus(e.target.value)}
                  disabled={!canModify}
                  className="bg-slate-50 border border-slate-200 text-slate-750 rounded p-1.5 text-xs font-mono focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="Lead">Lead</option>
                  <option value="Tender">Proses Tender</option>
                  <option value="Kontrak Aktif">Kontrak Kerja Aktif</option>
                  <option value="Selesai">Proyek Selesai</option>
                </select>

                {userRole === "Super Admin" && (
                  <button
                    onClick={() => {
                      if (confirm("Hapus rekam CRM klien ini dari database perusahaan?")) {
                        onDeleteClient(activeClient.id);
                      }
                    }}
                    className="p-1.5 px-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded transition cursor-pointer"
                    title="Hapus Klien"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* CRM Contact channels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-3.5">
                <div className="p-2.5 rounded-lg bg-[#D4AF37]/10 text-[#002147]">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-mono uppercase block">WhatsApp / Kontak Utama</span>
                  <a href={`tel:${activeClient.phone}`} className="text-xs text-[#002147] font-bold font-mono hover:underline">
                    {activeClient.phone || "Tidak tercatat"}
                  </a>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-3.5">
                <div className="p-2.5 rounded-lg bg-blue-50 text-blue-700">
                  <Mail className="w-5 h-5 pointer-events-none" />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-mono uppercase block">Korespondensi Surat Resmi</span>
                  <a href={`mailto:${activeClient.email}`} className="text-xs text-[#002147] font-bold font-mono hover:underline">
                    {activeClient.email || "Surat menyurat kosong"}
                  </a>
                </div>
              </div>
            </div>

            {/* Client Notes */}
            {activeClient.notes && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 font-mono uppercase block">Preferensi Finansial &amp; Logistik Klien:</span>
                <p className="text-xs text-slate-750 leading-relaxed font-sans">{activeClient.notes}</p>
              </div>
            )}

            {/* Associated Active Projects from database */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#002147] font-mono uppercase tracking-wider border-b border-slate-200 pb-2 mb-3 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#D4AF37]" /> PROYEK KELOLAAN TERKAIT ({clientProjects.length})
                </h4>

                <div className="space-y-2.5 overflow-y-auto max-h-[175px] pr-1">
                  {clientProjects.length > 0 ? (
                    clientProjects.map((proj, idx) => (
                      <div key={idx} className="bg-white p-3 rounded border border-slate-200 flex justify-between items-center text-xs shadow-xs hover:border-[#D4AF37]/30 transition duration-150">
                        <div className="space-y-0.5">
                          <strong className="text-[#002147] font-bold block">{proj.name}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">{proj.location}</span>
                        </div>
                        
                        <div className="text-right text-[11px] font-mono">
                          <div className="text-[#D4AF37] font-extrabold">{proj.physicalProgress}% Fisik</div>
                          <div className="text-slate-500">{formatIDR(proj.contractValue)}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-slate-400 font-mono text-xs">
                      Tidak ada ikatan kontrak aktif terbit atas nama klien ini saat ini.
                    </div>
                  )}
                </div>
              </div>

              <div className="text-[11px] text-slate-400 font-mono text-center pt-2 border-t border-slate-100 mt-2">
                Hanya mitra terkualifikasi berhak atas lampiran S-Curve periodik harian.
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
