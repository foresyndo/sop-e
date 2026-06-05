import React, { useState, useEffect } from "react";
import { 
  Building2, 
  FileText, 
  Users, 
  Briefcase, 
  FolderOpen, 
  Cpu, 
  LogOut, 
  HardHat, 
  MessageSquare,
  ShieldAlert,
  UserCheck
} from "lucide-react";

// Imports Firebase hooks & DB
import { db, auth } from "./lib/firebase";
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  getDocs
} from "firebase/firestore";

// Types
import { UserProfile, Sop, Project, Employee, Client, Document, UserRole } from "./types";

// Default pre-loaded Indonesia SOP Templates
import { defaultSops } from "./data/defaultSops";

// Individual Tab Views
import LoginScreen from "./components/LoginScreen";
import DashboardTab from "./components/DashboardTab";
import SopsTab from "./components/SopsTab";
import ProjectsTab from "./components/ProjectsTab";
import EmployeesTab from "./components/EmployeesTab";
import ClientsTab from "./components/ClientsTab";
import DocumentsTab from "./components/DocumentsTab";
import AiAssistantTab from "./components/AiAssistantTab";

export default function App() {
  // Current user profiles state
  const [user, setUser] = useState<UserProfile | null>(null);

  // Core Data Collections
  const [sops, setSops] = useState<Sop[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);

  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Load user from local storage cache if existing on reload
  useEffect(() => {
    const cachedUser = localStorage.getItem("sop_ktr_pro_user");
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch (e) {
        // Clear corrupt
        localStorage.removeItem("sop_ktr_pro_user");
      }
    }
  }, []);

  // Sync state data either from live Firestore database OR local fallback cache
  useEffect(() => {
    // 1. Sync SOPs
    const unsubSops = onSnapshot(collection(db, "sop"), (snap) => {
      const list: Sop[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Sop);
      });
      
      if (list.length > 0) {
        setSops(list);
        localStorage.setItem("sop_ktr_pro_cache_sops", JSON.stringify(list));
      } else {
        // Fallback or Prepopulate with Default Indonesian SOPs
        const preseeded = defaultSops.map((s, idx) => ({
          id: s.id,
          title: s.title,
          category: s.category,
          contentPurpose: s.purpose,
          contentScope: s.scope,
          contentResponsibility: s.responsibility,
          contentProcedure: s.procedure || "",
          contentChecklist: s.checklist || "",
          contentSupportForms: s.supportForms || "",
          author: "Komite Standardisasi BSN",
          authorId: "bsn-default",
          status: "Approved" as const,
          isTemplate: true,
          revisionHistory: JSON.stringify([{
            revisionNo: 1,
            updatedBy: "System Builder",
            updatedAt: new Date().toISOString(),
            changeSummary: "Inisialisasi draf standardisasi sipil SNI"
          }]),
          createdAt: new Date().toISOString()
        }));
        setSops(preseeded);
        localStorage.setItem("sop_ktr_pro_cache_sops", JSON.stringify(preseeded));
      }
    }, (error) => {
      console.warn("Firestore SOP collection offline/unauthenticated. Using LocalStorage fallback caches.", error);
      const cached = localStorage.getItem("sop_ktr_pro_cache_sops");
      if (cached) setSops(JSON.parse(cached));
    });

    // 2. Sync Projects
    const unsubProjects = onSnapshot(collection(db, "projects"), (snap) => {
      const list: Project[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Project);
      });
      
      if (list.length > 0) {
        setProjects(list);
        localStorage.setItem("sop_ktr_pro_cache_projects", JSON.stringify(list));
      } else {
        // Pre-seed mock contractor projects
        const preseededProjects: Project[] = [
          {
            id: "proj-progo",
            name: "Pembangunan Jembatan Beton Kali Progo Tol Yogya-Solo",
            location: "Nanggulan, DI Yogyakarta",
            client: "PT Semesta Raya Agung",
            contractValue: 15400000000,
            startDate: "2026-02-15",
            endDate: "2026-10-30",
            physicalProgress: 65,
            financialProgress: 55,
            sCurveData: JSON.stringify([
              { month: "Feb 26", planned: 10, actual: 8 },
              { month: "Mar 26", planned: 25, actual: 23 },
              { month: "Apr 26", planned: 40, actual: 38 },
              { month: "Mei 26", planned: 55, actual: 48 },
              { month: "Jun 26", planned: 68, actual: 65 },
              { month: "Jul 26", planned: 80, actual: 0 }
            ]),
            documentation: JSON.stringify([
              { title: "Galian Abutmen Jembatan", url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=80", uploadedAt: new Date().toISOString() },
              { title: "Pemasangan Voided Slab", url: "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&w=400&q=80", uploadedAt: new Date().toISOString() }
            ]),
            description: "Pekerjaan mencakup bored pile diameter 80cm kedalaman 24 meter, pilar beton K-350, erection girder bentang 40 meter.",
            estimatedCost: 12500000000,
            actualExpense: 6800000000,
            overheadCost: 1200000000,
            createdAt: new Date().toISOString()
          },
          {
            id: "proj-pantura",
            name: "Pengaspalan Bahu Jalan Raya Pantura Segmen Demak-Ngrayun",
            location: "Demak, Jawa Tengah",
            client: "Dinas Pekerjaan Umum Demak",
            contractValue: 4200000000,
            startDate: "2026-04-01",
            endDate: "2026-07-15",
            physicalProgress: 90,
            financialProgress: 85,
            sCurveData: JSON.stringify([
              { month: "Apr 26", planned: 30, actual: 28 },
              { month: "Mei 26", planned: 65, actual: 64 },
              { month: "Jun 26", planned: 90, actual: 90 },
              { month: "Jul 26", planned: 100, actual: 0 }
            ]),
            documentation: JSON.stringify([
              { title: "Pekerjaan Lapisan AC-BC", url: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=400&q=80", uploadedAt: new Date().toISOString() }
            ]),
            description: "Rekonstruksi badan jalan semen agregat kelas A tebal 15cm dan pelapisan aspal hotmix tebal 10cm.",
            estimatedCost: 3500000000,
            actualExpense: 2900000000,
            overheadCost: 450000000,
            createdAt: new Date().toISOString()
          },
          {
            id: "proj-drainase",
            name: "Moderenisasi Drainase Parit Pemukiman BUMDes Silih Asih",
            location: "Majalengka, Jawa Barat",
            client: "BUMDes Silih Asih Berdaya",
            contractValue: 450000000,
            startDate: "2026-05-10",
            endDate: "2026-08-10",
            physicalProgress: 20,
            financialProgress: 10,
            sCurveData: JSON.stringify([
              { month: "Mei 26", planned: 15, actual: 12 },
              { month: "Jun 26", planned: 50, actual: 20 },
              { month: "Jul 26", planned: 85, actual: 0 },
              { month: "Agu 26", planned: 100, actual: 0 }
            ]),
            documentation: JSON.stringify([]),
            description: "Pemasangan Box Culvert precast u-ditch ukuran 60x60cm sepanjang 450 meter jalan RT 02-05.",
            estimatedCost: 380450000,
            actualExpense: 80000000,
            overheadCost: 15300000,
            createdAt: new Date().toISOString()
          }
        ];
        setProjects(preseededProjects);
        localStorage.setItem("sop_ktr_pro_cache_projects", JSON.stringify(preseededProjects));
      }
    }, (error) => {
      const cached = localStorage.getItem("sop_ktr_pro_cache_projects");
      if (cached) setProjects(JSON.parse(cached));
    });

    // 3. Sync Employees/SDM
    const unsubEmployees = onSnapshot(collection(db, "employees"), (snap) => {
      const list: Employee[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Employee);
      });
      
      if (list.length > 0) {
        setEmployees(list);
        localStorage.setItem("sop_ktr_pro_cache_employees", JSON.stringify(list));
      } else {
        const preseededEmployees: Employee[] = [
          {
            id: "emp-pm",
            name: "Pak Sastra H.",
            role: "Project Manager Utama",
            division: "Konstruksi",
            status: "Permanent",
            attendance: JSON.stringify([
              { date: "2026-06-01", status: "Present", checkIn: "07:30", checkOut: "17:15" },
              { date: "2026-06-02", status: "Present", checkIn: "07:44", checkOut: "17:00" },
              { date: "2026-06-03", status: "Present", checkIn: "07:50", checkOut: "18:05" }
            ]),
            leaves: JSON.stringify([]),
            performanceReviews: JSON.stringify([
              { date: "2026-05-15", score: 5, feedback: "Pengendalian deviasi material jembatan Kali Progo sangat ketat sehingga hemat anggaran semen 2.5%.", reviewer: "Ibu Kartika (Direktur)" }
            ]),
            createdAt: new Date().toISOString()
          },
          {
            id: "emp-supervisor",
            name: "Rian Permana",
            role: "Supervisor Pelaksana Lapangan",
            division: "K3 & Lingkungan",
            status: "Contract",
            attendance: JSON.stringify([
              { date: "2026-06-01", status: "Present", checkIn: "07:40", checkOut: "17:02" },
              { date: "2026-06-02", status: "Present", checkIn: "07:35", checkOut: "17:40" }
            ]),
            leaves: JSON.stringify([]),
            performanceReviews: JSON.stringify([]),
            createdAt: new Date().toISOString()
          },
          {
            id: "emp-staff",
            name: "Dian Saputra",
            role: "Operator Excavator & Surveyor",
            division: "Konstruksi",
            status: "Daily",
            attendance: JSON.stringify([
              { date: "2026-06-01", status: "Present", checkIn: "07:55", checkOut: "17:00" }
            ]),
            leaves: JSON.stringify([
              { id: "leave-01", type: "Cuti Tahunan", startDate: "2026-06-15", endDate: "2026-06-16", status: "Pending", reason: "Acara keluarga di kampung halaman" }
            ]),
            performanceReviews: JSON.stringify([
              { date: "2026-05-30", score: 4, feedback: "Sikap tanggap safety sangat bagus, selalu mengenakan scaffolding harness lengkap.", reviewer: "Pak Sastra H. (Project Manager)" }
            ]),
            createdAt: new Date().toISOString()
          }
        ];
        setEmployees(preseededEmployees);
        localStorage.setItem("sop_ktr_pro_cache_employees", JSON.stringify(preseededEmployees));
      }
    }, (error) => {
      const cached = localStorage.getItem("sop_ktr_pro_cache_employees");
      if (cached) setEmployees(JSON.parse(cached));
    });

    // 4. Sync Clients
    const unsubClients = onSnapshot(collection(db, "clients"), (snap) => {
      const list: Client[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Client);
      });
      
      if (list.length > 0) {
        setClients(list);
        localStorage.setItem("sop_ktr_pro_cache_clients", JSON.stringify(list));
      } else {
        const preseededClients: Client[] = [
          {
            id: "cli-semesta",
            name: "Ir. Harianto Wijaya",
            company: "PT Semesta Raya Agung",
            contact: "+62 813-9090-2345",
            email: "info@semestaraya.com",
            projectHistory: "Pembangunan Jembatan Beton Kali Progo Tol Yogya-Solo",
            createdAt: new Date().toISOString()
          },
          {
            id: "cli-dinaspu",
            name: "H. Sujatmiko, M.T.",
            company: "Dinas Pekerjaan Umum Demak",
            contact: "+62 812-7065-1100",
            email: "penawaran@dinaspudemak.go.id",
            projectHistory: "Pengaspalan Bahu Jalan Raya Pantura",
            createdAt: new Date().toISOString()
          }
        ];
        setClients(preseededClients);
        localStorage.setItem("sop_ktr_pro_cache_clients", JSON.stringify(preseededClients));
      }
    }, (error) => {
      const cached = localStorage.getItem("sop_ktr_pro_cache_clients");
      if (cached) setClients(JSON.parse(cached));
    });

    // 5. Sync Documents
    const unsubDocuments = onSnapshot(collection(db, "documents"), (snap) => {
      const list: Document[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Document);
      });
      
      if (list.length > 0) {
        setDocuments(list);
        localStorage.setItem("sop_ktr_pro_cache_documents", JSON.stringify(list));
      } else {
        const preseededDocuments: Document[] = [
          {
            id: "doc-ded-kali-progo",
            name: "Detail Engineering Design (DED) Kali Progo Bentang 40m.pdf",
            category: "Gambar Kerja (CAD / DED)",
            project: "proj-progo",
            uploadedBy: "Admin",
            uploadedAt: new Date().toISOString(),
            fileUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=80",
            fileType: "PDF"
          },
          {
            id: "doc-spk-pantura",
            name: "Surat Perjanjian Kerja (SPK) Konstruksi Pantura #892.pdf",
            category: "Kontrak SPK / MOU",
            project: "proj-pantura",
            uploadedBy: "Sari Wahyuni",
            uploadedAt: new Date().toISOString(),
            fileUrl: "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&w=400&q=80",
            fileType: "PDF"
          },
          {
            id: "doc-pajak-maret",
            name: "Rekap_PPN_PPH_Termin_1_Kali_Progo.xlsx",
            category: "Laporan Keuangan & Pajak",
            project: "proj-progo",
            uploadedBy: "Ibu Kartika",
            uploadedAt: new Date().toISOString(),
            fileUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=400&q=80",
            fileType: "XLSX"
          }
        ];
        setDocuments(preseededDocuments);
        localStorage.setItem("sop_ktr_pro_cache_documents", JSON.stringify(preseededDocuments));
      }
    }, (error) => {
      const cached = localStorage.getItem("sop_ktr_pro_cache_documents");
      if (cached) setDocuments(JSON.parse(cached));
    });

    return () => {
      unsubSops();
      unsubProjects();
      unsubEmployees();
      unsubClients();
      unsubDocuments();
    };
  }, []);

  // Set Profile Handler
  const handleLoginSuccess = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem("sop_ktr_pro_user", JSON.stringify(profile));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("sop_ktr_pro_user");
  };

  // Mutator operations with Local Fallback caches
  const handleAddSop = async (sopData: Omit<Sop, "id" | "createdAt">) => {
    try {
      const randomId = `sop-${Math.random().toString(36).substring(2, 8)}`;
      const payload = {
        ...sopData,
        createdAt: new Date().toISOString()
      };
      
      // Try Firestore
      await addDoc(collection(db, "sop"), payload);
    } catch (e) {
      console.warn("Firestore error on SOP create. Writing directly to localized memory cache.");
      const randomId = `sop-mem-${Math.random().toString(36).substring(2, 8)}`;
      const nextSop: Sop = {
        id: randomId,
        ...sopData,
        createdAt: new Date().toISOString()
      };
      const nextList = [nextSop, ...sops];
      setSops(nextList);
      localStorage.setItem("sop_ktr_pro_cache_sops", JSON.stringify(nextList));
    }
  };

  const handleUpdateSop = async (id: string, updates: Partial<Sop>) => {
    try {
      // Find inside Firestore
      const targetDoc = doc(db, "sop", id);
      await updateDoc(targetDoc, updates);
    } catch (e) {
      console.warn("Firestore offline on SOP update. Updating in-memory cache directly.");
      const nextList = sops.map(s => s.id === id ? { ...s, ...updates } : s);
      setSops(nextList);
      localStorage.setItem("sop_ktr_pro_cache_sops", JSON.stringify(nextList));
    }
  };

  const handleDeleteSop = async (id: string) => {
    try {
      await deleteDoc(doc(db, "sop", id));
    } catch (e) {
      console.warn("Firestore error on SOP delete. Stripping locally.");
      const nextList = sops.filter(s => s.id !== id);
      setSops(nextList);
      localStorage.setItem("sop_ktr_pro_cache_sops", JSON.stringify(nextList));
    }
  };

  // Mutator: PROJECTS
  const handleAddProject = async (projectData: Omit<Project, "id" | "createdAt">) => {
    try {
      const payload = {
        ...projectData,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, "projects"), payload);
    } catch (e) {
      console.warn("Writing project locally.");
      const randomId = `proj-${Math.random().toString(36).substring(2, 8)}`;
      const nextProj: Project = {
        id: randomId,
        ...projectData,
        createdAt: new Date().toISOString()
      };
      const nextList = [nextProj, ...projects];
      setProjects(nextList);
      localStorage.setItem("sop_ktr_pro_cache_projects", JSON.stringify(nextList));
    }
  };

  const handleUpdateProject = async (id: string, updates: Partial<Project>) => {
    try {
      await updateDoc(doc(db, "projects", id), updates);
    } catch (e) {
      console.warn("Updating project locally.");
      const nextList = projects.map(p => p.id === id ? { ...p, ...updates } : p);
      setProjects(nextList);
      localStorage.setItem("sop_ktr_pro_cache_projects", JSON.stringify(nextList));
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await deleteDoc(doc(db, "projects", id));
    } catch (e) {
      const nextList = projects.filter(p => p.id !== id);
      setProjects(nextList);
      localStorage.setItem("sop_ktr_pro_cache_projects", JSON.stringify(nextList));
    }
  };

  // Mutator: EMPLOYEE
  const handleAddEmployee = async (employeeData: Omit<Employee, "id" | "createdAt">) => {
    try {
      const payload = {
        ...employeeData,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, "employees"), payload);
    } catch (e) {
      const randomId = `emp-${Math.random().toString(36).substring(2, 8)}`;
      const nextEmp: Employee = {
        id: randomId,
        ...employeeData,
        createdAt: new Date().toISOString()
      };
      const nextList = [nextEmp, ...employees];
      setEmployees(nextList);
      localStorage.setItem("sop_ktr_pro_cache_employees", JSON.stringify(nextList));
    }
  };

  const handleUpdateEmployee = async (id: string, updates: Partial<Employee>) => {
    try {
      await updateDoc(doc(db, "employees", id), updates);
    } catch (e) {
      const nextList = employees.map(emp => emp.id === id ? { ...emp, ...updates } : emp);
      setEmployees(nextList);
      localStorage.setItem("sop_ktr_pro_cache_employees", JSON.stringify(nextList));
    }
  };

  // Mutator: CLIENTS
  const handleAddClient = async (clientData: Omit<Client, "id" | "createdAt">) => {
    try {
      const payload = {
        ...clientData,
        projectHistory: clientData.company, // default binding
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, "clients"), payload);
    } catch (e) {
      const randomId = `cli-${Math.random().toString(36).substring(2, 8)}`;
      const nextCli: Client = {
        id: randomId,
        ...clientData,
        projectHistory: clientData.company,
        createdAt: new Date().toISOString()
      };
      const nextList = [nextCli, ...clients];
      setClients(nextList);
      localStorage.setItem("sop_ktr_pro_cache_clients", JSON.stringify(nextList));
    }
  };

  const handleUpdateClient = async (id: string, updates: Partial<Client>) => {
    try {
      await updateDoc(doc(db, "clients", id), updates);
    } catch (e) {
      const nextList = clients.map(cli => cli.id === id ? { ...cli, ...updates } : cli);
      setClients(nextList);
      localStorage.setItem("sop_ktr_pro_cache_clients", JSON.stringify(nextList));
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      await deleteDoc(doc(db, "clients", id));
    } catch (e) {
      const nextList = clients.filter(c => c.id !== id);
      setClients(nextList);
      localStorage.setItem("sop_ktr_pro_cache_clients", JSON.stringify(nextList));
    }
  };

  // Mutator: DOCUMENTS
  const handleAddDocument = async (docData: Omit<Document, "id" | "uploadedAt">) => {
    try {
      const payload = {
        ...docData,
        category: docData.category as any, // Cast
        uploadedAt: new Date().toISOString()
      };
      await addDoc(collection(db, "documents"), payload);
    } catch (e) {
      const randomId = `doc-${Math.random().toString(36).substring(2, 8)}`;
      const nextDoc: Document = {
        id: randomId,
        ...docData,
        category: docData.category as any,
        uploadedAt: new Date().toISOString()
      };
      const nextList = [nextDoc, ...documents];
      setDocuments(nextList);
      localStorage.setItem("sop_ktr_pro_cache_documents", JSON.stringify(nextList));
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      await deleteDoc(doc(db, "documents", id));
    } catch (e) {
      const nextList = documents.filter(d => d.id !== id);
      setDocuments(nextList);
      localStorage.setItem("sop_ktr_pro_cache_documents", JSON.stringify(nextList));
    }
  };

  // If user is not logged in, render the login screen
  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-[#D4AF37] selection:text-[#002147] text-slate-900 font-sans" id="main-app-shell">
      
      {/* Top Professional ERP Header */}
      <header className="bg-[#002147] border-b border-[#D4AF37]/30 p-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & title */}
          <div className="flex items-center gap-3 select-none" id="header-brand">
            <div className="w-10 h-10 rounded bg-[#D4AF37] text-[#002147] flex items-center justify-center font-bold text-lg shadow-inner">
              <Building2 className="w-5 h-5 font-black" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white font-mono tracking-wider flex items-center gap-1.5 uppercase leading-none">
                SOP Kontraktor Pro <span className="text-[10px] text-[#D4AF37] bg-white/10 px-2 py-0.5 rounded font-normal font-mono border border-white/15">ERP</span>
              </h1>
              <span className="text-[10px] text-slate-300 font-mono">Standard Operating Procedure &amp; Project Management</span>
            </div>
          </div>

          {/* User profile actions & quick switches */}
          <div className="flex items-center gap-3.5 text-xs font-mono" id="header-profile">
            <span className="text-slate-300 hidden sm:inline text-[10px]">PENGGUNA AKTIF:</span>
            
            <div className="flex items-center gap-2 bg-white/10 p-1.5 pr-3.5 rounded-lg border border-white/10">
              <div className="w-7 h-7 bg-[#D4AF37] text-[#002147] rounded flex items-center justify-center font-bold text-xs uppercase" title={user.displayName}>
                {user.displayName.substring(0, 2)}
              </div>
              <div className="text-left select-none">
                <div className="text-white font-bold leading-none">{user.displayName.split(" ")[0]}</div>
                <div className="text-[8.5px] uppercase font-black text-[#D4AF37] mt-1 tracking-wider leading-none">{user.role}</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition border border-white/10"
              title="Keluar / Ganti Akun"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Main ERP Tab System Router */}
      <main className="max-w-7xl mx-auto w-full p-4 md:p-6 flex-1 space-y-6">
        
        {/* Navigation bar list */}
        <div className="flex gap-1 overflow-x-auto bg-white p-1 rounded-xl border border-slate-200/80 shadow-sm scrollbar-none sticky top-18 z-40" id="main-nav-tabs">
          
          {[
            { id: "dashboard", label: "DASHBOARD", icon: Building2 },
            { id: "sop", label: "STANDAR SOP", icon: FileText },
            { id: "proyek", label: "MONITOR PROYEK", icon: Briefcase },
            { id: "karyawan", label: "PERSONEL / SDM", icon: Users },
            { id: "klien", label: "CRM KLIEN", icon: UserCheck },
            { id: "dokumen", label: "KABINET BERKAS", icon: FolderOpen },
            { id: "ai-assistant", label: "ASISTEN AI", icon: Cpu }
          ].map((tab, idx) => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={idx}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2.5 px-4 rounded-lg font-mono text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition flex-shrink-0 cursor-pointer ${
                  isTabActive 
                  ? "bg-[#002147] text-white font-extrabold shadow-sm border-b-2 border-[#D4AF37]" 
                  : "text-slate-600 hover:text-[#002147] hover:bg-slate-105"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {tab.label}
              </button>
            );
          })}

        </div>

        {/* Tab Router Output Panel */}
        <div className="mt-4 animate-fade-in" id="main-tab-viewport">
          {activeTab === "dashboard" && (
            <DashboardTab
              sops={sops}
              projects={projects}
              employees={employees}
              clients={clients}
              documents={documents}
              onNavigateToTab={(tabId) => setActiveTab(tabId)}
              userRole={user.role}
            />
          )}

          {activeTab === "sop" && (
            <SopsTab
              sops={sops}
              onAddSop={handleAddSop}
              onUpdateSop={handleUpdateSop}
              onDeleteSop={handleDeleteSop}
              userRole={user.role}
              userDisplayName={user.displayName}
            />
          )}

          {activeTab === "proyek" && (
            <ProjectsTab
              projects={projects}
              onAddProject={handleAddProject}
              onUpdateProject={handleUpdateProject}
              onDeleteProject={handleDeleteProject}
              userRole={user.role}
            />
          )}

          {activeTab === "karyawan" && (
            <EmployeesTab
              employees={employees}
              onAddEmployee={handleAddEmployee}
              onUpdateEmployee={handleUpdateEmployee}
              userRole={user.role}
              userDisplayName={user.displayName}
            />
          )}

          {activeTab === "klien" && (
            <ClientsTab
              clients={clients}
              projects={projects}
              onAddClient={handleAddClient}
              onUpdateClient={(client) => handleUpdateClient(client.id, client)}
              onDeleteClient={handleDeleteClient}
              userRole={user.role}
            />
          )}

          {activeTab === "dokumen" && (
            <DocumentsTab
              documents={documents}
              projects={projects}
              onUploadDocument={handleAddDocument}
              onDeleteDocument={handleDeleteDocument}
              userRole={user.role}
              userDisplayName={user.displayName}
            />
          )}

          {activeTab === "ai-assistant" && <AiAssistantTab />}
        </div>

      </main>

      {/* Corporate bottom credit footer */}
      <footer className="border-t border-slate-200 bg-white text-center py-5 text-xs text-slate-500 font-mono space-y-1">
        <p>&copy; 2026 SOP Kontraktor Pro. Member of Indonesia Constructor ERP Ecosystem.</p>
        <p className="text-[10px] text-slate-400">Audit sinkronisasi cloud dengan Firestore aktif &bull; Akses Enkripsi End-to-End dengan TLS 1.3</p>
      </footer>

    </div>
  );
}
