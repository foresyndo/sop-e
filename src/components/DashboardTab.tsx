import React, { useMemo } from "react";
import { 
  Building, 
  FileText, 
  Users, 
  Briefcase, 
  DollarSign, 
  ShieldAlert, 
  TrendingUp, 
  Layers, 
  Calendar,
  CheckCircle2, 
  Clock, 
  MapPin,
  ArrowRight
} from "lucide-react";
import { Sop, Project, Employee, Client, Document } from "../types";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

interface DashboardTabProps {
  sops: Sop[];
  projects: Project[];
  employees: Employee[];
  clients: Client[];
  documents: Document[];
  onNavigateToTab: (tabId: string) => void;
  userRole: string;
}

export default function DashboardTab({ 
  sops, 
  projects, 
  employees, 
  clients, 
  documents, 
  onNavigateToTab,
  userRole
}: DashboardTabProps) {

  // Computed Stats
  const totalContractValue = useMemo(() => {
    return projects.reduce((sum, p) => sum + (p.contractValue || 0), 0);
  }, [projects]);

  const activeProjectsCount = useMemo(() => {
    return projects.length;
  }, [projects]);

  const totalEmployeesCount = useMemo(() => {
    return employees.length;
  }, [employees]);

  const totalClientsCount = useMemo(() => {
    return clients.length;
  }, [clients]);

  const activeSopsCount = useMemo(() => {
    return sops.filter(s => s.status === "Approved").length;
  }, [sops]);

  // Currency Formatter (IDR)
  const formatIDR = (value: number) => {
    if (value >= 1000000000) {
      return `Rp ${(value / 1000000000).toFixed(2)} Miliar`;
    }
    if (value >= 1000000) {
      return `Rp ${(value / 1000000).toFixed(0)} Juta`;
    }
    return `Rp ${value.toLocaleString("id-ID")}`;
  };

  // S-Curve Overall Aggregation / Chart Data
  const chartData = useMemo(() => {
    if (projects.length === 0) return [];
    
    // Aggregating actual and planned progress for top 5 projects
    return projects.slice(0, 5).map(p => ({
      name: p.name.length > 15 ? p.name.substring(0, 15) + "..." : p.name,
      "Progress Fisik (%)": p.physicalProgress,
      "Progress Finansial (%)": p.financialProgress
    }));
  }, [projects]);

  // Filter last 5 documents
  const recentDocs = useMemo(() => {
    return [...documents]
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .slice(0, 5);
  }, [documents]);

  return (
    <div className="space-y-6" id="dashboard-tab-view">
      
      {/* Top Banner section */}
      <div className="bg-[#002147] border border-[#D4AF37]/20 rounded-xl p-6 relative overflow-hidden" id="dashboard-header-widget">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
        <div className="space-y-1.5 max-w-3xl relative z-10">
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            Selamat Datang di Portal <span className="text-[#D4AF37]">SOP Kontraktor Pro</span> Custom ERP
          </h2>
          <p className="text-sm text-slate-300">
            Akses tingkat peran Anda saat ini: <strong className="text-white font-semibold font-mono uppercase bg-white/10 py-0.5 px-2 rounded ml-1 text-xs border border-white/10">{userRole}</strong>. 
            Semua modul real-time disinkronkan ke database Firestore secara aman.
          </p>
        </div>
      </div>

      {/* Grid Status Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="dashboard-kpi-grid">
        
        {/* KPI: Active Projects */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 flex items-center justify-between hover:border-[#D4AF37]/45 transition duration-200">
          <div className="space-y-1">
            <span className="text-slate-500 text-[10px] font-mono uppercase tracking-wider font-bold">Proyek Aktif Lapangan</span>
            <div className="text-3xl font-black text-[#002147] font-mono">{activeProjectsCount}</div>
            <button 
              onClick={() => onNavigateToTab("proyek")}
              className="text-[11px] text-[#002147] hover:text-[#D4AF37] flex items-center gap-1 font-bold group/btn cursor-pointer"
            >
              Kelola Proyek <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition" />
            </button>
          </div>
          <div className="p-3.5 rounded-lg bg-[#002147]/5 text-[#002147] border border-[#002147]/10">
            <Building className="w-6 h-6" />
          </div>
        </div>

        {/* KPI: Total Contracts */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 flex items-center justify-between hover:border-[#D4AF37]/45 transition duration-200">
          <div className="space-y-1">
            <span className="text-slate-500 text-[10px] font-mono uppercase tracking-wider font-bold">Total Nilai Kontrak</span>
            <div className="text-xl font-black text-[#002147] font-mono">{formatIDR(totalContractValue)}</div>
            <span className="text-[11px] text-slate-400 font-sans block">
              Akumulasi anggaran terbagi
            </span>
          </div>
          <div className="p-3.5 rounded-lg bg-[#D4AF37]/10 text-[#002147] border border-[#D4AF37]/20">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* KPI: Approved SOPs */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 flex items-center justify-between hover:border-[#D4AF37]/45 transition duration-200">
          <div className="space-y-1">
            <span className="text-slate-500 text-[10px] font-mono uppercase tracking-wider font-bold">SOP Aktif Terbit</span>
            <div className="text-3xl font-black text-[#002147] font-mono">{activeSopsCount} <span className="text-xs text-slate-400 font-normal">/ {sops.length}</span></div>
            <button 
              onClick={() => onNavigateToTab("sop")}
              className="text-[11px] text-[#002147] hover:text-[#D4AF37] flex items-center gap-1 font-bold group/btn cursor-pointer"
            >
              Lihat Kategori <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition" />
            </button>
          </div>
          <div className="p-3.5 rounded-lg bg-green-50 text-green-700 border border-green-150">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* KPI: Total Personnel */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 flex items-center justify-between hover:border-[#D4AF37]/45 transition duration-200">
          <div className="space-y-1">
            <span className="text-slate-500 text-[10px] font-mono uppercase tracking-wider font-bold">Personel &amp; Karyawan</span>
            <div className="text-3xl font-black text-[#002147] font-mono">{totalEmployeesCount}</div>
            <button 
              onClick={() => onNavigateToTab("karyawan")}
              className="text-[11px] text-[#002147] hover:text-[#D4AF37] flex items-center gap-1 font-bold group/btn cursor-pointer"
            >
              Absensi &amp; Kinerja <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition" />
            </button>
          </div>
          <div className="p-3.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-150">
            <Users className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Charts & Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Progress Chart Yard (Left) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-6" id="dashboard-charts-panel">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-md font-bold text-[#002147] flex items-center gap-1.5 uppercase tracking-wider text-xs font-mono">
                <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
                Analisa Progress Kumulatif Proyek
              </h3>
              <p className="text-xs text-slate-500">Membandingkan korelasi fisik (pencapaian) &amp; pembiayaan tertagih keuangan.</p>
            </div>
            
            <div className="flex gap-4 mt-2 sm:mt-0 text-[11px] font-mono font-bold">
              <span className="flex items-center gap-1 text-slate-700">
                <span className="w-2.5 h-2.5 rounded bg-[#D4AF37] inline-block"></span> Fisik
              </span>
              <span className="flex items-center gap-1 text-slate-700">
                <span className="w-2.5 h-2.5 rounded bg-[#002147] inline-block"></span> Finansial
              </span>
            </div>
          </div>

          <div className="h-68">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#002147", borderColor: "#D4AF37", borderRadius: "8px" }} 
                    labelStyle={{ color: "#ffffff", fontWeight: "bold", fontSize: 12 }}
                    itemStyle={{ color: "#D4AF37", fontSize: 11 }}
                  />
                  <Bar dataKey="Progress Fisik (%)" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Progress Finansial (%)" fill="#002147" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 font-mono text-xs">
                Tidak ada data proyek aktif untuk divisualkan.
              </div>
            )}
          </div>

          {/* Quick Stats on bottom */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center pt-2">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 font-mono block uppercase font-semibold">Rata-rata Progress Fisik</span>
              <strong className="text-md text-[#D4AF37] font-mono font-bold">
                {projects.length > 0 ? (projects.reduce((sum, p) => sum + p.physicalProgress, 0) / projects.length).toFixed(1) : 0}%
              </strong>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 font-mono block uppercase font-semibold">Rata-rata Finansial</span>
              <strong className="text-md text-[#002147] font-mono font-bold">
                {projects.length > 0 ? (projects.reduce((sum, p) => sum + p.financialProgress, 0) / projects.length).toFixed(1) : 0}%
              </strong>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-500 font-mono block uppercase font-semibold">Total Klien Terdaftar</span>
              <strong className="text-md text-slate-700 font-mono font-bold">{totalClientsCount} Korporat</strong>
            </div>
          </div>

        </div>

        {/* Recent Activity Cabin (Right) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Quick AI Assistant helper entrance */}
          <div className="bg-gradient-to-br from-[#002147] to-[#001733] border border-[#D4AF37]/30 rounded-xl p-5 text-white space-y-3 relative overflow-hidden shadow">
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
            <div className="space-y-1 relative z-10">
              <h4 className="text-sm font-extrabold uppercase font-mono tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                Gemini AI Constructor
              </h4>
              <p className="text-xs font-medium text-slate-350 leading-snug">
                Butuh draf penawaran proyek, estimasi RAB beton, atau SOP spesifik? Tanya langsung ke AI Assistant.
              </p>
            </div>
            <button 
              onClick={() => onNavigateToTab("ai-assistant")}
              className="w-full text-center bg-[#D4AF37] hover:bg-amber-500 text-[#002147] font-mono font-bold text-[11px] py-2 px-3 rounded-lg transition uppercase tracking-wider cursor-pointer"
            >
              Mulakan Chat Asisten
            </button>
          </div>

          {/* Recent Document Registers */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-[#002147] uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#D4AF37]" />
                Arsip Dokumen Terbaru
              </h3>
              <button 
                onClick={() => onNavigateToTab("dokumen")}
                className="text-[#002147] hover:text-[#D4AF37] text-[10px] font-mono uppercase font-bold cursor-pointer"
              >
                Semua
              </button>
            </div>

            <div className="space-y-3">
              {recentDocs.length > 0 ? (
                recentDocs.map((doc, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start bg-slate-50 hover:bg-slate-100 p-2.5 rounded-lg border border-slate-205 transition duration-150">
                    <div className="mt-0.5 p-1 rounded bg-[#002147] text-white text-[9px] font-mono uppercase tracking-widest font-black border border-transparent">
                      {doc.fileType.substring(0, 3)}
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="text-xs font-bold text-[#002147] truncate leading-tight">
                        {doc.name}
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                        <span>{doc.category}</span>
                        <span>{new Date(doc.uploadedAt).toLocaleDateString("id-ID")}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-slate-400 text-xs font-mono">
                  Belum ada dokumen diunggah.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Grid of Proyek Status details */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-4" id="dashboard-proyek-grid">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold text-[#002147] uppercase font-mono tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#D4AF37]" />
            Monitoring Detail Proyek Konstruksi
          </h3>
          <button 
            onClick={() => onNavigateToTab("proyek")}
            className="text-[#002147] hover:text-[#D4AF37] text-xs font-bold cursor-pointer"
          >
            Sistem Detail Proyek &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.slice(0, 3).map((proj, idx) => (
            <div key={idx} className="bg-slate-50 hover:bg-white rounded-xl border border-slate-200/80 p-4 space-y-3.5 hover:border-[#D4AF37]/50 shadow-xs transition duration-200">
              <div className="space-y-1">
                <span className="text-[10px] bg-[#002147]/5 text-[#002147] py-0.5 px-2 rounded-full font-mono border border-[#002147]/10 inline-block font-semibold">
                  No. Kontrak: #KTR-0{idx+1}
                </span>
                <h4 className="text-xs sm:text-sm font-black text-[#002147] leading-normal line-clamp-1">
                  {proj.name}
                </h4>
                <p className="text-[11px] text-slate-600 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" /> {proj.location}
                </p>
              </div>

              {/* Progress Bar Group */}
              <div className="space-y-2 pt-1 border-t border-slate-200">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-[11px] font-mono text-slate-600">
                    <span>Progress Fisik Konstruksi</span>
                    <strong className="text-[#D4AF37] font-black">{proj.physicalProgress}%</strong>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#D4AF37] transition-all duration-300" style={{ width: `${proj.physicalProgress}%` }}></div>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-[11px] font-mono text-slate-600">
                    <span>Penyerapan Anggaran (Finansial)</span>
                    <strong className="text-[#002147] font-black">{proj.financialProgress}%</strong>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#002147] transition-all duration-300" style={{ width: `${proj.financialProgress}%` }}></div>
                   </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-600 font-mono bg-slate-200/40 p-2 rounded">
                <span>Nilai: <strong className="text-slate-800 font-bold">{formatIDR(proj.contractValue)}</strong></span>
                <span>Klien: <strong className="text-slate-800 font-bold truncate max-w-20 inline-block align-bottom">{proj.client}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
