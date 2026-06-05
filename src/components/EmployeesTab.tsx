import React, { useState, useMemo } from "react";
import { 
  Users, 
  Search, 
  Plus, 
  Calendar, 
  Star, 
  Award, 
  FileText, 
  CheckCircle, 
  XSquare, 
  UserPlus, 
  ShieldCheck,
  Building2,
  Clock,
  Briefcase,
  GitFork
} from "lucide-react";
import { Employee, AttendanceRecord, LeaveRequest, PerformanceReview, UserRole } from "../types";

interface EmployeesTabProps {
  employees: Employee[];
  onAddEmployee: (employee: Omit<Employee, "id" | "createdAt">) => Promise<void>;
  onUpdateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  userRole: UserRole;
  userDisplayName: string;
}

const DIVISIONS = ["Konstruksi", "Logistik", "Keuangan", "Direksi", "K3 & Lingkungan", "HR & Legal"];

export default function EmployeesTab({ 
  employees, 
  onAddEmployee, 
  onUpdateEmployee, 
  userRole, 
  userDisplayName 
}: EmployeesTabProps) {

  const [activeEmployeeId, setActiveEmployeeId] = useState<string | null>(employees[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("Semua Divisi");

  // Modern modal state
  const [isCreating, setIsCreating] = useState(false);

  // Subtabs configuration for SDM area
  const [activeSubTab, setActiveSubTab] = useState<"roster" | "org-chart">("roster");
  const [orgViewMode, setOrgViewMode] = useState<"hierarchy" | "division">("hierarchy");
  const [selectedOrgEmpId, setSelectedOrgEmpId] = useState<string | null>(null);

  // Dynamic Rank & Hierarchy Classifier for Organizational Chart
  const employeeRankList = useMemo(() => {
    return employees.map(emp => {
      const roleLower = emp.role.toLowerCase();
      const divLower = emp.division.toLowerCase();
      
      let rank: 1 | 2 | 3 | 4 = 4; // Default: Staff / Worker
      let rankName = "Staf Pelaksana & Operator";
      
      if (
        divLower === "direksi" || 
        roleLower.includes("ceo") || 
        roleLower.includes("direktur") || 
        roleLower.includes("general manager") || 
        roleLower.includes("gm") || 
        roleLower.includes("owner") || 
        roleLower.includes("direksi")
      ) {
        rank = 1;
        rankName = "Direksi / Board of Directors";
      } else if (
        roleLower.includes("project manager") || 
        roleLower.includes("manager") || 
        roleLower.includes("kepala") || 
        roleLower.includes("lead") || 
        roleLower.includes("chief")
      ) {
        rank = 2;
        rankName = "Manajer & Kepala Divisi";
      } else if (
        roleLower.includes("supervisor") || 
        roleLower.includes("surveyor") || 
        roleLower.includes("engineer") || 
        roleLower.includes("koordinator") || 
        roleLower.includes("coordinator") || 
        roleLower.includes("officer") || 
        roleLower.includes("pengawas")
      ) {
        rank = 3;
        rankName = "Supervisor & Tenaga Ahli Teknis";
      }
      
      return {
        ...emp,
        rank,
        rankName
      };
    }).sort((a, b) => a.rank - b.rank); // Default higher ranks first
  }, [employees]);

  const orgStats = useMemo(() => {
    const total = employees.length;
    const permanent = employees.filter(e => e.status === "Permanent").length;
    const contract = employees.filter(e => e.status === "Contract").length;
    const daily = employees.filter(e => e.status === "Daily").length;
    
    // Calculate global average KPI score
    let totalScore = 0;
    let reviewCount = 0;
    employees.forEach(emp => {
      try {
        const reviews = JSON.parse(emp.performanceReviews) as PerformanceReview[];
        reviews.forEach(r => {
          totalScore += r.score;
          reviewCount++;
        });
      } catch (e) {}
    });
    const avgKpi = reviewCount > 0 ? (totalScore / reviewCount).toFixed(1) : "N/A";
    
    return { total, permanent, contract, daily, avgKpi };
  }, [employees]);

  const selectedOrgEmp = useMemo(() => {
    return employeeRankList.find(e => e.id === selectedOrgEmpId) || null;
  }, [employeeRankList, selectedOrgEmpId]);

  const selectedEmpStats = useMemo(() => {
    if (!selectedOrgEmp) return null;
    
    let totalAttendance = 0;
    let presentCount = 0;
    let sickCount = 0;
    let leaveCount = 0;
    let alphaCount = 0;
    
    try {
      const records = JSON.parse(selectedOrgEmp.attendance) as AttendanceRecord[];
      totalAttendance = records.length;
      records.forEach(r => {
        if (r.status === "Present") presentCount++;
        else if (r.status === "Sick") sickCount++;
        else if (r.status === "Leave") leaveCount++;
        else if (r.status === "Absent") alphaCount++;
      });
    } catch(e) {}
    
    const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 100;
    
    // Recent Reviews
    let reviews: PerformanceReview[] = [];
    try {
      reviews = JSON.parse(selectedOrgEmp.performanceReviews) as PerformanceReview[];
    } catch(e) {}
    
    return {
      totalAttendance,
      presentCount,
      sickCount,
      leaveCount,
      alphaCount,
      attendanceRate,
      recentReview: reviews[0] || null
    };
  }, [selectedOrgEmp]);

  const tier1 = useMemo(() => employeeRankList.filter(e => e.rank === 1), [employeeRankList]);
  const tier2 = useMemo(() => employeeRankList.filter(e => e.rank === 2), [employeeRankList]);
  const tier3 = useMemo(() => employeeRankList.filter(e => e.rank === 3), [employeeRankList]);
  const tier4 = useMemo(() => employeeRankList.filter(e => e.rank === 4), [employeeRankList]);

  // New Employee fields
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [division, setDivision] = useState(DIVISIONS[0]);
  const [empStatus, setEmpStatus] = useState<"Permanent" | "Contract" | "Daily">("Contract");

  // Performance rating tool
  const [pScore, setPScore] = useState<number>(5);
  const [pFeedback, setPFeedback] = useState("");

  // Leave Form
  const [lType, setLType] = useState("Cuti Tahunan");
  const [lStart, setLStart] = useState("2026-06-10");
  const [lEnd, setLEnd] = useState("2026-06-12");
  const [lReason, setLReason] = useState("");

  const activeEmp = useMemo(() => {
    return employees.find(e => e.id === activeEmployeeId) || employees[0] || null;
  }, [employees, activeEmployeeId]);

  // Filters logic
  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      const matchDiv = selectedDivision === "Semua Divisi" || e.division === selectedDivision;
      const matchSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.role.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDiv && matchSearch;
    });
  }, [employees, selectedDivision, searchQuery]);

  // Split serialized records
  const attendanceList = useMemo(() => {
    if (!activeEmp) return [];
    try {
      return JSON.parse(activeEmp.attendance) as AttendanceRecord[];
    } catch {
      return [];
    }
  }, [activeEmp]);

  const leavesList = useMemo(() => {
    if (!activeEmp) return [];
    try {
      return JSON.parse(activeEmp.leaves) as LeaveRequest[];
    } catch {
      return [];
    }
  }, [activeEmp]);

  const reviewsList = useMemo(() => {
    if (!activeEmp) return [];
    try {
      return JSON.parse(activeEmp.performanceReviews) as PerformanceReview[];
    } catch {
      return [];
    }
  }, [activeEmp]);

  const canApproveHR = useMemo(() => {
    return ["Super Admin", "Direktur", "Project Manager", "Admin"].includes(userRole);
  }, [userRole]);

  // Handlers
  const handleOpenAddForm = () => {
    setName("");
    setRole("");
    setDivision(DIVISIONS[0]);
    setEmpStatus("Contract");
    setIsCreating(true);
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) return;

    // Default pre-seeded empty history
    try {
      await onAddEmployee({
        name,
        role,
        division,
        status: empStatus,
        attendance: JSON.stringify([]),
        leaves: JSON.stringify([]),
        performanceReviews: JSON.stringify([])
      });
      setIsCreating(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Add Attendance record
  const handlePunchAttendance = async (status: "Present" | "Absent" | "Leave" | "Sick") => {
    if (!activeEmp) return;
    
    // Check if attendance already has today's record
    const todayStr = new Date().toISOString().split("T")[0];
    const existingIndex = attendanceList.findIndex(r => r.date === todayStr);

    const newRecord: AttendanceRecord = {
      date: todayStr,
      status,
      checkIn: status === "Present" ? "07:45" : "--:--",
      checkOut: status === "Present" ? "17:00" : "--:--"
    };

    let updatedList = [...attendanceList];
    if (existingIndex > -1) {
      updatedList[existingIndex] = newRecord;
    } else {
      updatedList.unshift(newRecord);
    }

    try {
      await onUpdateEmployee(activeEmp.id, {
        attendance: JSON.stringify(updatedList)
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Request Leave Form
  const handleRequestLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEmp || !lReason.trim()) return;

    const newLeave: LeaveRequest = {
      id: "LV-" + Math.floor(Math.random() * 9000 + 1000),
      type: lType,
      startDate: lStart,
      endDate: lEnd,
      reason: lReason,
      status: "Pending"
    };

    const updatedLeaves = [newLeave, ...leavesList];

    try {
      await onUpdateEmployee(activeEmp.id, {
        leaves: JSON.stringify(updatedLeaves)
      });
      setLReason("");
    } catch (err) {
      console.error(err);
    }
  };

  // Action Leave (Approve/Reject)
  const handleActionLeave = async (leaveId: string, action: "Approved" | "Rejected") => {
    if (!activeEmp) return;

    const updatedLeaves = leavesList.map(l => {
      if (l.id === leaveId) {
        return { ...l, status: action };
      }
      return l;
    });

    try {
      await onUpdateEmployee(activeEmp.id, {
        leaves: JSON.stringify(updatedLeaves)
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Register performance evaluation
  const handleRegisterReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEmp || !pFeedback.trim()) return;

    const newReview: PerformanceReview = {
      date: new Date().toISOString().split("T")[0],
      score: pScore,
      feedback: pFeedback,
      reviewer: userDisplayName
    };

    const updatedReviews = [newReview, ...reviewsList];

    try {
      await onUpdateEmployee(activeEmp.id, {
        performanceReviews: JSON.stringify(updatedReviews)
      });
      setPFeedback("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6" id="employees-tab-container">
      {/* Sub-tabs header & stats bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl select-none">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab("roster")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-black uppercase tracking-wider rounded-lg border transition cursor-pointer ${
              activeSubTab === "roster"
                ? "bg-[#002147] border-[#002147] text-white shadow-xs"
                : "bg-white border-slate-202 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Roster &amp; Kinerja
          </button>
          
          <button
            type="button"
            onClick={() => {
              setActiveSubTab("org-chart");
              if (!selectedOrgEmpId && employees.length > 0) {
                setSelectedOrgEmpId(employees[0].id);
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-black uppercase tracking-wider rounded-lg border transition cursor-pointer ${
              activeSubTab === "org-chart"
                ? "bg-[#002147] border-[#002147] text-white shadow-xs"
                : "bg-white border-slate-202 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            Bagan Organisasi
          </button>
        </div>

        {/* Global overview metrics */}
        <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500 overflow-x-auto whitespace-nowrap py-1">
          <div>Total SDM: <strong className="text-[#002147] font-extrabold">{orgStats.total}</strong></div>
          <div className="h-3 w-px bg-slate-200" />
          <div>Tetap: <strong className="text-emerald-700 font-extrabold">{orgStats.permanent}</strong></div>
          <div className="h-3 w-px bg-slate-200" />
          <div>Kontrak/Lepas: <strong className="text-amber-700 font-extrabold">{orgStats.contract + orgStats.daily}</strong></div>
          <div className="h-3 w-px bg-slate-200" />
          <div>Avg KPI Kinerja: <strong className="text-[#D4AF37] font-extrabold">★ {orgStats.avgKpi}</strong></div>
        </div>
      </div>

      {activeSubTab === "roster" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Employee List Selector (Left) */}
      <div className="lg:col-span-4 bg-white border border-slate-202 shadow-sm rounded-xl p-4 flex flex-col h-[calc(100vh-140px)]" id="employees-sidebar">
        
        <div className="space-y-3 pb-3 border-b border-slate-100">
          <div className="flex justify-between items-center whitespace-nowrap">
            <h3 className="text-xs font-black text-[#002147] uppercase font-mono tracking-wider flex items-center gap-1">
              <Users className="w-4 h-4 text-[#D4AF37]" />
              Roster Karyawan Pro
            </h3>
            
            <button
              onClick={handleOpenAddForm}
              disabled={!canApproveHR}
              className="p-1 px-2.5 rounded bg-[#002147] hover:bg-[#001733] text-white font-mono text-[10px] font-black uppercase tracking-wider transition disabled:opacity-40 cursor-pointer"
            >
              + Tim Baru
            </button>
          </div>

          {/* Search roster */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama / jabatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded p-2 pl-8 text-[11px] text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#D4AF37] transition font-mono"
            />
          </div>

          {/* Division filters */}
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            className="w-full bg-slate-50 border border-slate-202 rounded p-2 text-xs text-slate-750 font-mono focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="Semua Divisi">Semua Divisi ({employees.length})</option>
            {DIVISIONS.map((div, i) => (
              <option key={i} value={div}>{div}</option>
            ))}
          </select>
        </div>

        {/* Scrollable member grid */}
        <div className="flex-1 overflow-y-auto space-y-2 mt-4 pr-1 scrollbar-thin">
          {filteredEmployees.map((emp) => {
            const isActive = activeEmployeeId === emp.id;
            return (
              <button
                key={emp.id}
                onClick={() => {
                  setActiveEmployeeId(emp.id);
                  setIsCreating(false);
                }}
                className={`w-full text-left p-3 rounded-lg border transition cursor-pointer ${
                  isActive 
                  ? "bg-[#002147]/5 border-[#002147] shadow-xs" 
                  : "bg-white border-slate-202 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div className="flex justify-between items-center gap-1">
                  <h4 className="text-xs font-black text-[#002147] truncate">
                    {emp.name}
                  </h4>
                  <span className="text-[9px] px-1.5 border border-slate-200 text-slate-500 bg-slate-50 font-mono font-bold rounded uppercase flex-shrink-0">
                    {emp.status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mt-1.5 gap-2 leading-none">
                  <span className="truncate">{emp.role}</span>
                  <span className="text-[#D4AF37] flex-shrink-0 font-sans font-bold">{emp.division}</span>
                </div>
              </button>
            );
          })}
        </div>

      </div>

      {/* Employee Details and Interactions (Right) */}
      <div className="lg:col-span-8 bg-white border border-slate-205 shadow-sm rounded-xl p-5 md:p-6 min-h-[calc(100vh-140px)] flex flex-col justify-between" id="employees-work-area">

        {/* 1. STATE: REGISTER MEMBER FORM */}
        {isCreating && (
          <form onSubmit={handleCreateEmployee} className="space-y-4 font-sans" id="employee-create-form">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black uppercase font-mono tracking-wider text-[#002147]">
                Pencatatan Profil Karyawan &amp; Staff Baru
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
                <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Nama Lengkap Karyawan:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Rendi Hidayat"
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 placeholder-slate-405 focus:outline-none focus:bg-white focus:border-[#D4AF37]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Jabatan / Kompetensi Khusus:</label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Contoh: Surveyor Lapangan Utama / Operator Excavator"
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 placeholder-slate-405 focus:outline-none focus:bg-white focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Divisi Organisasi:</label>
                <select
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-[#D4AF37]"
                >
                  {DIVISIONS.map((div, i) => (
                    <option key={i} value={div}>{div}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Status Kepegawaian:</label>
                <select
                  value={empStatus}
                  onChange={(e) => setEmpStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="Permanent">Permanent (Tetap)</option>
                  <option value="Contract">Contract (PKWT)</option>
                  <option value="Daily">Daily Worker (Harian Lepas)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 font-mono">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 px-4 py-2 rounded text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="bg-[#002147] hover:bg-[#001733] text-white px-5 py-2 rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Ciptakan Profil
              </button>
            </div>
          </form>
        )}

        {/* 2. STATE: DETAILS & STAFF CONTROLS (ATTENDANCE, LEAVE, RATING) */}
        {!isCreating && activeEmp && (
          <div className="space-y-5 flex-grow flex flex-col justify-between" id="employee-detail-work-area">
            
            {/* Header row */}
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 select-none font-sans">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9px] border border-[#002147]/10 bg-[#002147]/5 text-[#002147] px-2.5 py-0.5 rounded-full font-mono font-bold uppercase">
                    Divisi: {activeEmp.division}
                  </span>
                  <span className="text-[9px] border bg-slate-50 border-slate-200 text-slate-500 px-2 py-0.5 rounded-full font-mono">
                    Status: {activeEmp.status}
                  </span>
                </div>
                <h2 className="text-md sm:text-lg font-black text-[#002147] mt-1">
                  {activeEmp.name}
                </h2>
                <p className="text-xs text-[#D4AF37] font-mono font-bold">{activeEmp.role}</p>
              </div>

              {/* Instant Attendance Punch */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-2 flex-wrap">
                <div className="text-[10px] text-[#002147] font-mono font-black uppercase tracking-wider pl-1">
                  Absen Hari Ini:
                </div>
                <div className="flex gap-1 flex-wrap">
                  {[
                    { label: "Presen", status: "Present" as const, color: "bg-green-700 hover:bg-green-800 text-white cursor-pointer" },
                    { label: "Sakit", status: "Sick" as const, color: "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 cursor-pointer" },
                    { label: "Izin", status: "Leave" as const, color: "bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 cursor-pointer" },
                    { label: "Alfa", status: "Absent" as const, color: "bg-red-50 text-red-705 border border-red-200 hover:bg-red-100 cursor-pointer" }
                  ].map((btn, idx) => (
                    <button
                      key={idx}
                      onClick={() => handlePunchAttendance(btn.status)}
                      className={`text-[10px] font-mono font-bold py-1 px-2.5 rounded transition ${btn.color}`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Attendance & Leave Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
              
              {/* Absensi log column */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between shadow-xs">
                <div>
                  <h4 className="text-xs font-black text-[#002147] font-mono uppercase tracking-wider border-b border-slate-200 pb-2 mb-3.5 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#D4AF37]" /> REKAP PRESENSI HARI KERJA
                  </h4>

                  <div className="space-y-2 overflow-y-auto max-h-[160px] pr-1">
                    {attendanceList.length > 0 ? (
                      attendanceList.map((rec, i) => (
                        <div key={i} className="flex justify-between items-center text-[11px] font-mono bg-white p-2.5 rounded border border-slate-200 text-slate-800">
                          <span className="text-slate-500 font-semibold">{new Date(rec.date).toLocaleDateString("id-ID")}</span>
                          <span className={`px-2 py-0.5 rounded uppercase font-black text-[9px] border ${
                            rec.status === "Present" 
                            ? "bg-green-50 border-green-200 text-green-700" 
                            : rec.status === "Leave" 
                            ? "bg-slate-100 border-slate-200 text-slate-600" 
                            : "bg-red-50 border-red-200 text-red-700"
                          }`}>
                            {rec.status === "Present" ? `Present (${rec.checkIn})` : rec.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-slate-400 font-mono text-xs">
                        Belum ada riwayat presensi bulan ini.
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-slate-450 font-mono mt-3 text-center">
                  Setiap jam masuk diaudit otomatis ke GPS log cabang.
                </div>
              </div>

              {/* Leave request form & lists column */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-202 flex flex-col justify-between space-y-4 shadow-xs">
                
                <div>
                  <h4 className="text-xs font-black text-[#002147] font-mono uppercase tracking-wider border-b border-slate-200 pb-2 mb-3 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#D4AF37]" /> PENGAJUAN CUTI &amp; IZIN
                  </h4>

                  <div className="space-y-2.5 max-h-[140px] overflow-y-auto pr-1 select-none">
                    {leavesList.length > 0 ? (
                      leavesList.map((leave, i) => (
                        <div key={i} className="bg-white p-2.5 rounded border border-slate-200 space-y-1.5 text-xs text-slate-800">
                          <div className="flex justify-between items-center gap-2">
                            <span className="font-bold text-[#002147] text-xs">{leave.type}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase font-black border ${
                              leave.status === "Approved" 
                              ? "bg-green-50 border-green-200 text-green-700" 
                              : leave.status === "Rejected" 
                              ? "bg-red-50 border-red-200 text-red-700" 
                              : "bg-blue-50 border-blue-200 text-blue-700"
                            }`}>
                              {leave.status}
                            </span>
                          </div>
                          
                          <p className="text-[11px] text-slate-500 font-sans italic leading-snug">
                            &quot;{leave.reason}&quot;
                          </p>

                          <div className="flex justify-between items-center text-[10px] text-slate-450 font-mono pt-1">
                            <span>{leave.startDate} s/d {leave.endDate}</span>
                            
                            {leave.status === "Pending" && canApproveHR && (
                              <div className="flex gap-1.5">
                                <button 
                                  onClick={() => handleActionLeave(leave.id, "Approved")}
                                  className="text-green-600 hover:text-green-700 cursor-pointer"
                                  title="Setujui Cuti"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleActionLeave(leave.id, "Rejected")}
                                  className="text-red-500 hover:text-red-650 cursor-pointer"
                                  title="Tolak Cuti"
                                >
                                  <XSquare className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-slate-400 font-mono text-xs">
                        Tidak ada pengajuan cuti tertunda.
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit new leave */}
                <form onSubmit={handleRequestLeave} className="space-y-2.5 pt-2 border-t border-slate-200">
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="space-y-0.5">
                      <span className="text-[#002147] font-mono font-bold">Jenis Izin:</span>
                      <select 
                        value={lType} 
                        onChange={(e) => setLType(e.target.value)}
                        className="bg-white border border-slate-200 text-slate-800 rounded p-1 w-full text-[10px] focus:outline-none focus:border-[#D4AF37]"
                      >
                        <option value="Cuti Tahunan">Cuti Tahunan</option>
                        <option value="Izin Nikahan">Izin Keluarga</option>
                        <option value="Izin Duka Cita">Sakit Surat Dokter</option>
                        <option value="Keperluan Teknis font-sans">Tugas Luar Kota</option>
                      </select>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[#002147] font-mono font-bold">Keterangan:</span>
                      <input
                        type="text"
                        required
                        value={lReason}
                        onChange={(e) => setLReason(e.target.value)}
                        placeholder="Alasan dwi-harian..."
                        className="bg-white border border-slate-200 rounded p-1 w-full text-[10px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#002147] hover:bg-[#001733] text-white text-[10px] font-mono tracking-wider uppercase font-extrabold py-2 rounded transition cursor-pointer"
                  >
                    Ajukan Permohonan Izin
                  </button>
                </form>

              </div>
            </div>

            {/* Performance KPI & Review Appraisals Section */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 font-sans shadow-xs mt-3">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <h3 className="text-xs font-black text-[#002147] font-mono uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  <Star className="w-4 h-4 text-[#D4AF37]" />
                  KUALIFIKASI &amp; PENILAIAN PRESTASI KERJA (KPI)
                </h3>
                <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">Disertifikasi Kepala Konstruksi &amp; HRD</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                
                {/* Score & Adder Form */}
                <form onSubmit={handleRegisterReview} className="md:col-span-5 space-y-3 bg-white p-3.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-[#002147] font-mono uppercase block">Beri Nilai Kinerja:</span>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-500 font-mono">Skor (1-5):</span>
                    <select
                      value={pScore}
                      onChange={(e) => setPScore(Number(e.target.value))}
                      className="bg-slate-50 border border-slate-205 rounded p-1 text-xs text-slate-800 font-mono w-24 focus:outline-none"
                    >
                      <option value="5">5 - Sangat Baik</option>
                      <option value="4">4 - Baik</option>
                      <option value="3">3 - Cukup</option>
                      <option value="2">2 - Kurang</option>
                      <option value="1">1 - Buruk</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <textarea
                      rows={2}
                      required
                      value={pFeedback}
                      onChange={(e) => setPFeedback(e.target.value)}
                      placeholder="Ulasan kinerja lapangan, kedisiplinan K3, kejujuran penulisan berkas..."
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#D4AF37]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#002147] hover:bg-[#001733] font-black font-mono text-[10px] py-2 text-white rounded uppercase tracking-wider transition cursor-pointer"
                  >
                    Simpan Nilai KPI
                  </button>
                </form>

                {/* Score List History */}
                <div className="md:col-span-7 space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {reviewsList.length > 0 ? (
                    reviewsList.map((rev, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 space-y-1 shadow-2xs">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-slate-400">Tanggal: {rev.date}</span>
                          <span className="text-[#002147] flex items-center gap-0.5 font-bold">
                            Skor: {rev.score} / 5 <Star className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37] inline-block align-middle" />
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-normal font-sans italic">
                          &quot;{rev.feedback}&quot;
                        </p>
                        <div className="text-[9px] text-slate-450 text-right font-mono">
                          Penilai: <strong className="text-slate-550 font-bold">{rev.reviewer}</strong>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-slate-400 font-mono text-xs">
                      Pekerja ini belum dinilai oleh manajemen lapangan.
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>
        )}

      </div>

        </div>
      ) : (
        /* ORGANIZATIONAL CHART TAB VIEW */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="organizational-chart-layout">
          
          {/* Main Visual Hierarchy Map Column */}
          <div className="xl:col-span-8 bg-white border border-slate-202 rounded-xl p-5 md:p-6 shadow-sm flex flex-col justify-between space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-black text-[#002147] font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <GitFork className="w-4 h-4 text-[#D4AF37]" /> Bagan Organisasi Konstruksi Pro
                </h3>
                <p className="text-[10px] text-slate-404 font-mono leading-relaxed mt-0.5">
                  Visualisasi jalur komando, koordinasi pengawas lapangan, serta delegasi tugas harian.
                </p>
              </div>

              {/* View options within Org-Chart */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto font-mono">
                <button
                  type="button"
                  onClick={() => setOrgViewMode("hierarchy")}
                  className={`px-3 py-1 text-[9px] font-black uppercase rounded transition cursor-pointer ${
                    orgViewMode === "hierarchy" ? "bg-white text-[#002147] shadow-3xs" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Hierarki Tingkat
                </button>
                <button
                  type="button"
                  onClick={() => setOrgViewMode("division")}
                  className={`px-3 py-1 text-[9px] font-black uppercase rounded transition cursor-pointer ${
                    orgViewMode === "division" ? "bg-white text-[#002147] shadow-3xs" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Grup Divisi
                </button>
              </div>
            </div>

            {/* Tree Chart container */}
            <div className="flex-1 min-h-[480px] bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-4 overflow-y-auto max-h-[600px] select-none shadow-inner animate-fade-in" id="hierarchy-tree-canvas">
              
              {orgViewMode === "hierarchy" ? (
                <div className="space-y-6 md:space-y-8 flex flex-col items-center">
                  
                  {/* Tier 1: Direksi / Exec Command */}
                  <div className="flex flex-col items-center w-full">
                    <div className="text-[9px] font-mono font-black border border-rose-200 bg-rose-50 text-rose-800 px-2.5 py-0.5 rounded-full mb-2 uppercase tracking-wide">
                      Level 1: Direksi &amp; Komando Utama
                    </div>
                    <div className="flex flex-wrap justify-center gap-4">
                      {tier1.length > 0 ? (
                        tier1.map((emp) => (
                          <div
                            key={emp.id}
                            onClick={() => setSelectedOrgEmpId(emp.id)}
                            className={`p-3 rounded-xl border text-center transition duration-150 cursor-pointer w-48 shadow-2xs ${
                              selectedOrgEmpId === emp.id 
                                ? "bg-amber-50/45 border-[#D4AF37] ring-1 ring-[#D4AF37]" 
                                : "bg-white border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <Building2 className="w-6 h-6 text-rose-600 mx-auto mb-1.5" />
                            <h4 className="text-xs font-black text-[#002147] truncate">{emp.name}</h4>
                            <p className="text-[10px] text-rose-800 font-mono font-semibold mt-0.5">{emp.role}</p>
                            <div className="text-[9px] text-[#D4AF37] font-mono mt-1 font-bold">{emp.division}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-[11px] text-slate-400 font-mono italic bg-white p-3 border rounded border-dashed">Tidak ada staf Direksi Utama</div>
                      )}
                    </div>
                  </div>

                  {/* Vertical Connection Line */}
                  <div className="h-6 w-0.5 bg-slate-200 relative">
                    <span className="absolute -top-1 -left-0.5 w-1.5 h-1.5 rounded-full bg-slate-300" />
                  </div>

                  {/* Tier 2: Managers */}
                  <div className="flex flex-col items-center w-full">
                    <div className="text-[9px] font-mono font-black border border-sky-100 bg-sky-50 text-sky-805 px-2.5 py-0.5 rounded-full mb-2 uppercase tracking-wide">
                      Level 2: Kepala Operasi &amp; Manajer Proyek
                    </div>
                    <div className="flex flex-wrap justify-center gap-4">
                      {tier2.length > 0 ? (
                        tier2.map((emp) => (
                          <div
                            key={emp.id}
                            onClick={() => setSelectedOrgEmpId(emp.id)}
                            className={`p-3 rounded-xl border text-center transition duration-150 cursor-pointer w-48 shadow-2xs ${
                              selectedOrgEmpId === emp.id 
                                ? "bg-amber-50/45 border-[#D4AF37] ring-1 ring-[#D4AF37]" 
                                : "bg-white border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <Briefcase className="w-6 h-6 text-sky-600 mx-auto mb-1.5" />
                            <h4 className="text-xs font-black text-[#002147] truncate">{emp.name}</h4>
                            <p className="text-[10px] text-sky-800 font-mono font-semibold mt-0.5">{emp.role}</p>
                            <div className="text-[9px] text-[#D4AF37] font-mono mt-1 font-bold">{emp.division}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-[11px] text-slate-400 font-mono bg-white p-2 border rounded border-dashed italic">Tentukan Project Manager pada Roster</div>
                      )}
                    </div>
                  </div>

                  {/* Vertical Connection Line */}
                  <div className="h-6 w-0.5 bg-slate-200 relative">
                    <span className="absolute -top-1 -left-0.5 w-1.5 h-1.5 rounded-full bg-slate-300" />
                  </div>

                  {/* Tier 3: Supervisors / Engineers */}
                  <div className="flex flex-col items-center w-full">
                    <div className="text-[9px] font-mono font-black border border-amber-200 bg-amber-50 text-amber-805 px-2.5 py-0.5 rounded-full mb-2 uppercase tracking-wide">
                      Level 3: Supervisor Lapangan &amp; Engineering
                    </div>
                    <div className="flex flex-wrap justify-center gap-4">
                      {tier3.length > 0 ? (
                        tier3.map((emp) => (
                          <div
                            key={emp.id}
                            onClick={() => setSelectedOrgEmpId(emp.id)}
                            className={`p-3 rounded-xl border text-center transition duration-150 cursor-pointer w-48 shadow-2xs ${
                              selectedOrgEmpId === emp.id 
                                ? "bg-amber-50/45 border-[#D4AF37] ring-1 ring-[#D4AF37]" 
                                : "bg-white border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <ShieldCheck className="w-6 h-6 text-amber-605 mx-auto mb-1.5" />
                            <h4 className="text-xs font-black text-[#002147] truncate">{emp.name}</h4>
                            <p className="text-[10px] text-amber-800 font-mono font-semibold mt-0.5">{emp.role}</p>
                            <div className="text-[9px] text-[#D4AF37] font-mono mt-1 font-bold">{emp.division}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-[11px] text-slate-400 font-mono bg-white p-2 border rounded border-dashed italic">Tidak ada personil tingkat Supervisor</div>
                      )}
                    </div>
                  </div>

                  {/* Vertical Connection Line */}
                  <div className="h-6 w-0.5 bg-slate-200 relative">
                    <span className="absolute -top-1 -left-0.5 w-1.5 h-1.5 rounded-full bg-slate-300" />
                  </div>

                  {/* Tier 4: Staff & Operators */}
                  <div className="flex flex-col items-center w-full">
                    <div className="text-[9px] font-mono font-black border border-emerald-200 bg-emerald-50 text-emerald-805 px-2.5 py-0.5 rounded-full mb-2 uppercase tracking-wide">
                      Level 4: Tenaga Teknis &amp; Pekerja Harian
                    </div>
                    <div className="flex flex-wrap justify-center gap-3.5">
                      {tier4.length > 0 ? (
                        tier4.map((emp) => (
                          <div
                            key={emp.id}
                            onClick={() => setSelectedOrgEmpId(emp.id)}
                            className={`p-3 rounded-xl border text-center transition duration-150 cursor-pointer w-44 shadow-2xs ${
                              selectedOrgEmpId === emp.id 
                                ? "bg-amber-50/45 border-[#D4AF37] ring-1 ring-[#D4AF37]" 
                                : "bg-white border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <Users className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
                            <h4 className="text-xs font-black text-[#002147] truncate">{emp.name}</h4>
                            <p className="text-[10px] text-emerald-700 font-mono leading-tight truncate mt-0.5 font-sans">{emp.role}</p>
                            <div className="text-[9px] text-slate-400 font-mono font-bold">{emp.division}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-[11px] text-slate-400 font-mono italic bg-white p-2.5 border rounded border-dashed">Belum ada pekerja harian or staff</div>
                      )}
                    </div>
                  </div>

                </div>
              ) : (
                /* DIVISION-GROUPED STRUCTURE */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {DIVISIONS.map((div, i) => {
                    const divStaff = employeeRankList.filter(e => e.division === div);
                    return (
                      <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                          <span className="text-xs font-black text-[#002147] font-mono uppercase tracking-wider">{div}</span>
                          <span className="text-[9px] bg-slate-50 border border-slate-200 text-slate-500 font-mono font-bold rounded px-1.5 py-0.2">
                            {divStaff.length} Orang
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {divStaff.length > 0 ? (
                            divStaff.map((emp) => (
                              <div
                                key={emp.id}
                                onClick={() => setSelectedOrgEmpId(emp.id)}
                                className={`p-2 rounded-lg border transition duration-150 cursor-pointer text-left ${
                                  selectedOrgEmpId === emp.id 
                                    ? "bg-amber-50/40 border-[#D4AF37]" 
                                    : "bg-slate-50/60 border-slate-200/60 hover:bg-slate-50 hover:border-slate-300"
                                }`}
                              >
                                <div className="text-xs font-black text-[#002147] truncate">{emp.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono truncate">{emp.role}</div>
                              </div>
                            ))
                          ) : (
                            <div className="text-[10px] text-slate-450 font-mono italic py-2">Belum ada anggota divisi</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
              <span>💡 Petunjuk:</span>
              <span>Klik pada kartu karyawan manapun untuk meninjau status absensi, kualifikasi kepemimpinan, dan KPI-nya.</span>
            </div>
          </div>

          {/* Org Chart Interactive Detail Drawer Sidebar */}
          <div className="xl:col-span-4 space-y-4">
            
            <div className="bg-gradient-to-br from-[#002147] to-[#001733] text-white p-5 rounded-xl space-y-4 shadow-sm" id="org-sidebar">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
                <h4 className="text-xs font-black font-mono uppercase tracking-wider">Kartu Pengawas Lapangan</h4>
              </div>

              {selectedOrgEmp ? (
                <div className="space-y-4 font-sans select-none" id="selected-org-emp-card">
                  <div className="border-b border-white/10 pb-3">
                    <span className="inline-block bg-white/10 text-white border border-white/15 px-2 py-0.5 rounded text-[8px] font-mono tracking-wider uppercase font-black">
                      {selectedOrgEmp.division} • {selectedOrgEmp.status}
                    </span>
                    <h3 className="text-sm font-black text-white mt-1.5">{selectedOrgEmp.name}</h3>
                    <p className="text-xs text-[#D4AF37] font-mono font-bold">{selectedOrgEmp.role}</p>
                  </div>

                  {selectedEmpStats && (
                    <div className="space-y-3 font-mono text-[11px]">
                      
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-white/70">
                          <span>Kepatuhan Presensi:</span>
                          <span className="font-extrabold text-white">{selectedEmpStats.attendanceRate}%</span>
                        </div>
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-[#D4AF37] h-full" 
                            style={{ width: `${selectedEmpStats.attendanceRate}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                        <div className="bg-white/5 border border-white/10 p-2 rounded">
                          <span className="block text-white/50 text-[9px] uppercase">Hadir Sehat</span>
                          <strong className="text-emerald-400 font-black text-xs">{selectedEmpStats.presentCount} Hari</strong>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-2 rounded">
                          <span className="block text-white/50 text-[9px] uppercase">Cuti / Izin</span>
                          <strong className="text-amber-400 font-black text-xs">{selectedEmpStats.leaveCount + selectedEmpStats.sickCount} Hari</strong>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-white/10">
                        <span className="text-white/65 block text-[9px] uppercase font-black">Evaluasi Terakhir Atasan:</span>
                        {selectedEmpStats.recentReview ? (
                          <div className="bg-white/5 border border-white/10 p-2.5 rounded text-[10px] leading-relaxed text-slate-200 font-sans italic">
                            &quot;{selectedEmpStats.recentReview.feedback}&quot;
                            <div className="text-[8px] font-mono font-bold text-[#D4AF37] mt-1 text-right">
                              ★ {selectedEmpStats.recentReview.score}/5 oleh {selectedEmpStats.recentReview.reviewer}
                            </div>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-300 italic">Belum ada evaluasi kinerja tertulis</div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveEmployeeId(selectedOrgEmp.id);
                          setActiveSubTab("roster");
                          setIsCreating(false);
                        }}
                        className="w-full text-center py-2 bg-white text-[#002147] hover:bg-slate-100 font-bold transition duration-150 rounded uppercase font-mono text-[9px] tracking-wider cursor-pointer"
                      >
                        Buka Tab &amp; Manage Absensi →
                      </button>

                    </div>
                  )}

                </div>
              ) : (
                <div className="text-center py-8 text-white/40 font-mono text-xs">
                  🚫 Silakan pilih personil pada bagan di sebelah kiri untuk menelaah status kepangkatan K3 dan KPI.
                </div>
              )}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 font-sans">
              <h5 className="text-[10px] font-bold text-[#002147] font-mono uppercase tracking-wider">Statistik Roster K3</h5>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Kinerja personil K3 (Keselamatan dan Kesehatan Kerja) dan kepatuhan pengawas lapangan diaudit harian untuk meminimalisasi deviasi dan risiko kecelakaan kerja di lapangan.
              </p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
