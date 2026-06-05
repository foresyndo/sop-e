import React, { useState, useMemo } from "react";
import { 
  Building, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Settings, 
  Plus, 
  Upload, 
  User, 
  TrendingUp, 
  Camera, 
  CheckCircle, 
  Hourglass,
  Sliders,
  Trash2,
  LineChart as LineChartIcon,
  Shield,
  RotateCcw
} from "lucide-react";
import { Project, SCurvePoint, ProjectDoc, UserRole, ChangeOrder, PaymentTerm } from "../types";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface ProjectsTabProps {
  projects: Project[];
  onAddProject: (project: Omit<Project, "id" | "createdAt">) => Promise<void>;
  onUpdateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  userRole: UserRole;
}

export default function ProjectsTab({ 
  projects, 
  onAddProject, 
  onUpdateProject, 
  onDeleteProject, 
  userRole 
}: ProjectsTabProps) {

  const [activeProjectId, setActiveProjectId] = useState<string | null>(projects[0]?.id || null);
  
  // Safety (K3) Checklist internal state & definitions
  interface SafetyCheckItem {
    id: string;
    task: string;
    completed: boolean;
    checkedBy?: string;
    checkedAt?: string;
  }

  const defaultSafetyItems = useMemo(() => [
    { id: "wear-ppe", task: "Penggunaan APD Lengkap (Wear PPE: Helm, Rompi Reflektif, Sepatu Pelindung K3)" },
    { id: "scaffold-inspect", task: "Inspeksi Konstruksi Perancah / Scaffold & Safety Net di Area Tinggi" },
    { id: "toolbox-talk", task: "Safety Briefing Pagi / Toolbox Talk Sebelum Memulai Pekerjaan Konstruksi" },
    { id: "hazards-sign", task: "Pemasangan Rambu Bahaya Terbakar / Tegangan Tinggi & Pagar Pembatas" },
    { id: "first-aid", task: "Ketersediaan Kotak First-Aid / P3K Lengkap & Tabung Pemadam Api (APAR)" },
    { id: "waste-cleanup", task: "Pembersihan Area Kerja dari Sampah Paku Tajam, Kawat Seng, & Serpihan Beton" }
  ], []);

  const [safetyChecklist, setSafetyChecklist] = useState<SafetyCheckItem[]>([]);
  const [newSafetyTask, setNewSafetyTask] = useState("");

  // Load safety checklist on project selection
  React.useEffect(() => {
    if (!activeProjectId) {
      setSafetyChecklist([]);
      return;
    }
    const key = `k3_checklist_${activeProjectId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        setSafetyChecklist(JSON.parse(stored));
      } catch (e) {
        setSafetyChecklist(defaultSafetyItems.map(item => ({ ...item, completed: false })));
      }
    } else {
      setSafetyChecklist(defaultSafetyItems.map(item => ({ ...item, completed: false })));
    }
  }, [activeProjectId, defaultSafetyItems]);

  const handleToggleSafetyItem = (itemId: string) => {
    let currentUserName = "Pengawas Lapangan";
    const userStr = localStorage.getItem("sop_ktr_pro_user");
    if (userStr) {
      try {
        currentUserName = JSON.parse(userStr).displayName || "Supervisor";
      } catch (e) {}
    }

    const updated = safetyChecklist.map((item) => {
      if (item.id === itemId) {
        const completed = !item.completed;
        return {
          ...item,
          completed,
          checkedBy: completed ? currentUserName : undefined,
          checkedAt: completed ? new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : undefined
        };
      }
      return item;
    });

    setSafetyChecklist(updated);
    if (activeProjectId) {
      localStorage.setItem(`k3_checklist_${activeProjectId}`, JSON.stringify(updated));
    }
  };

  const handleAddSafetyItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSafetyTask.trim() || !activeProjectId) return;

    const newItem = {
      id: `custom_${Date.now()}`,
      task: newSafetyTask.trim(),
      completed: false
    };

    const updated = [...safetyChecklist, newItem];
    setSafetyChecklist(updated);
    localStorage.setItem(`k3_checklist_${activeProjectId}`, JSON.stringify(updated));
    setNewSafetyTask("");
  };

  const handleDeleteSafetyItem = (itemId: string) => {
    if (!activeProjectId) return;
    const updated = safetyChecklist.filter(item => item.id !== itemId);
    setSafetyChecklist(updated);
    localStorage.setItem(`k3_checklist_${activeProjectId}`, JSON.stringify(updated));
  };

  const handleResetSafetyChecklist = () => {
    if (!activeProjectId) return;
    const updated = safetyChecklist.map(item => ({
      ...item,
      completed: false,
      checkedBy: undefined,
      checkedAt: undefined
    }));
    setSafetyChecklist(updated);
    localStorage.setItem(`k3_checklist_${activeProjectId}`, JSON.stringify(updated));
  };

  const handleCheckAllSafetyChecklist = () => {
    if (!activeProjectId) return;
    let currentUserName = "Pengawas Lapangan";
    const userStr = localStorage.getItem("sop_ktr_pro_user");
    if (userStr) {
      try {
        currentUserName = JSON.parse(userStr).displayName || "Supervisor";
      } catch (e) {}
    }

    const updated = safetyChecklist.map(item => ({
      ...item,
      completed: true,
      checkedBy: currentUserName,
      checkedAt: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    }));
    setSafetyChecklist(updated);
    localStorage.setItem(`k3_checklist_${activeProjectId}`, JSON.stringify(updated));
  };
  
  // Sub-tabs & Gantt Filters
  const [activeSubTab, setActiveSubTab] = useState<"dashboard" | "gantt" | "map">("dashboard");
  const [ganttSearchQuery, setGanttSearchQuery] = useState("");
  const [ganttProgressFilter, setGanttProgressFilter] = useState<"all" | "planned" | "ongoing" | "completed">("all");

  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [isEditingCoords, setIsEditingCoords] = useState(false);
  const [selectedMapCoords, setSelectedMapCoords] = useState<{ lat: number; lng: number } | null>(null);

  const parseProjectLocation = (locationStr: string) => {
    if (!locationStr) {
      return { lat: -6.2088, lng: 106.8456, displayName: "Jakarta" };
    }
    const parts = locationStr.split("|");
    if (parts.length > 1) {
      const coordsStr = parts[0].trim();
      const coordParts = coordsStr.split(",");
      if (coordParts.length === 2) {
        const lat = parseFloat(coordParts[0]);
        const lng = parseFloat(coordParts[1]);
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng, displayName: parts.slice(1).join("|").trim() };
        }
      }
    }
    
    const loc = locationStr.toLowerCase();
    
    // Centers for key Indonesian development hubs
    if (loc.includes("ikn") || loc.includes("nusantara") || loc.includes("sepaku")) {
      return { lat: -0.9616, lng: 117.1518, displayName: locationStr };
    }
    if (loc.includes("balikpapan") || loc.includes("kaltim") || loc.includes("kalimantan")) {
      return { lat: -1.2420, lng: 116.8942, displayName: locationStr };
    }
    if (loc.includes("medan") || loc.includes("sumut") || loc.includes("sumatera utara")) {
      return { lat: 3.5952, lng: 98.6722, displayName: locationStr };
    }
    if (loc.includes("surabaya") || loc.includes("jatim") || loc.includes("jawa timur")) {
      return { lat: -7.2575, lng: 112.7521, displayName: locationStr };
    }
    if (loc.includes("bandung") || loc.includes("jabar") || loc.includes("jawa barat")) {
      return { lat: -6.9175, lng: 107.6191, displayName: locationStr };
    }
    if (loc.includes("bali") || loc.includes("denpasar") || loc.includes("badung")) {
      return { lat: -8.6500, lng: 115.2167, displayName: locationStr };
    }
    if (loc.includes("makassar") || loc.includes("sulsel") || loc.includes("sulawesi")) {
      return { lat: -5.1476, lng: 119.4327, displayName: locationStr };
    }
    if (loc.includes("palembang") || loc.includes("sumsel")) {
      return { lat: -2.9761, lng: 104.7754, displayName: locationStr };
    }

    // Default with hashed offset around Jakarta
    let hash = 0;
    for (let i = 0; i < locationStr.length; i++) {
      hash = locationStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const latOffset = (Math.abs(hash) % 100) / 1200 - 0.04;
    const lngOffset = (Math.abs(hash >> 3) % 100) / 1200 - 0.04;
    return { lat: -6.2088 + latOffset, lng: 106.8456 + lngOffset, displayName: locationStr };
  };

  const requestUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setGeoError(null);
        },
        (error) => {
          console.warn("Geolocation denied or failed:", error);
          setGeoError("Akses lokasi GPS ditolak/tidak disetujui. Memakai koordinat default.");
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setGeoError("Browser Anda tidak mendukung Geolocation.");
    }
  };

  // Dynamically load Leaflet CDN assets when Map tab is rendered or requested
  React.useEffect(() => {
    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      setLeafletLoaded(true);
    };
    document.head.appendChild(script);
  }, []);

  // Register focusProject globally for popup click interactions
  React.useEffect(() => {
    (window as any).focusProject = (id: string) => {
      setActiveProjectId(id);
      setActiveSubTab("dashboard");
    };
    return () => {
      delete (window as any).focusProject;
    };
  }, []);

  const mapRef = React.useRef<HTMLDivElement | null>(null);

  // Initialize and redraw the Leaflet Map
  React.useEffect(() => {
    if (activeSubTab !== "map" || !leafletLoaded || !mapRef.current) {
      return;
    }

    const container = mapRef.current;
    let map = (container as any)._leaflet_map;
    if (map) {
      map.remove();
    }

    let initialLat = -2.5489; // Indonesia Center
    let initialLng = 118.0149;
    let initialZoom = 5;

    if (activeProj) {
      const parsed = parseProjectLocation(activeProj.location);
      initialLat = parsed.lat;
      initialLng = parsed.lng;
      initialZoom = 8;
    } else if (userLocation) {
      initialLat = userLocation.lat;
      initialLng = userLocation.lng;
      initialZoom = 7;
    }

    const L = (window as any).L;
    if (!L) return;

    map = L.map(container).setView([initialLat, initialLng], initialZoom);
    (container as any)._leaflet_map = map;
    setMapInstance(map);

    // Use highly polished Map tiles: CartoDB Voyager
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(map);

    // Render current GPS Location Marker
    if (userLocation) {
      const userMarkerIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-5 h-5 bg-blue-500 rounded-full border border-white shadow animate-ping opacity-60"></div>
            <div class="w-8 h-8 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center shadow-lg relative z-10">
              <span class="text-white text-xs font-black">📍</span>
            </div>
          </div>`,
        className: 'custom-leaflet-marker-user',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      L.marker([userLocation.lat, userLocation.lng], { icon: userMarkerIcon })
        .addTo(map)
        .bindPopup(`
          <div class="text-xs font-sans p-1">
            <strong class="text-blue-600 font-mono text-[9px] uppercase font-bold">📍 LOKASI ANDA SAAT INI</strong>
            <p class="text-slate-500 mt-1 font-mono text-[10px]">Lat: ${userLocation.lat.toFixed(4)}<br>Lng: ${userLocation.lng.toFixed(4)}</p>
          </div>
        `);
    }

    // Render other projects markers
    projects.forEach((proj) => {
      const parsed = parseProjectLocation(proj.location);
      const isCurrentActive = proj.id === activeProjectId;

      const markerIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            \${isCurrentActive ? '<div class="absolute w-7 h-7 bg-amber-400 rounded-full border border-white shadow animate-ping opacity-60"></div>' : ''}
            <div class="w-7 h-7 \${isCurrentActive ? 'bg-[#D4AF37] border-2 border-[#002147]' : 'bg-[#002147] border-2 border-[#D4AF37]'} rounded-full flex items-center justify-center shadow-md relative z-10 transition duration-150 hover:scale-110">
              <span class="text-white text-[9px] font-black">\${isCurrentActive ? '🏗️' : '👷'}</span>
            </div>
          </div>`,
        className: `custom-leaflet-marker-\${proj.id}`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      L.marker([parsed.lat, parsed.lng], { icon: markerIcon })
        .addTo(map)
        .bindPopup(`
          <div class="text-xs font-sans min-w-[170px]">
            <span class="text-[9px] bg-slate-100 border border-slate-200 py-0.5 px-2 rounded-full font-mono text-slate-500 font-bold block w-fit mb-1.5">ID: #\${proj.id.slice(0, 8).toUpperCase()}</span>
            <strong class="text-[#002147] block text-xs font-black line-clamp-1 mb-1">\${proj.name}</strong>
            <p class="text-[10px] text-slate-500 font-mono mb-1">🏢 Klien: \${proj.client}</p>
            <p class="text-[10px] text-slate-500 font-mono mb-1">📅 Progress: \${proj.physicalProgress}%</p>
            <p class="text-[10px] text-slate-500 font-mono mb-2">💰 Nilai: Rp \${proj.contractValue.toLocaleString("id-ID")}</p>
            <div class="pt-1.5 border-t border-slate-200">
              <button class="w-full bg-[#002147] text-white text-[9px] font-bold py-1 px-2 rounded font-mono hover:bg-[#001733] uppercase transition cursor-pointer" onclick="window.focusProject('\${proj.id}')">
                Lihat Detail Proyek
              </button>
            </div>
          </div>
        `);
    });

    // Handle Coordinate modification clicks
    map.on("click", (e: any) => {
      if ((container as any)._is_editing_coords) {
        setSelectedMapCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    });

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [activeSubTab, leafletLoaded, projects, userLocation, activeProjectId]);

  // Synchronize state flag into map container properties to avoid closure captures
  React.useEffect(() => {
    if (mapRef.current) {
      (mapRef.current as any)._is_editing_coords = isEditingCoords;
    }
  }, [isEditingCoords]);

  // Forms & Modals
  const [isCreating, setIsCreating] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);

  // New Project Form
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [client, setClient] = useState("");
  const [contractValue, setContractValue] = useState<number>(500000000);
  const [startDate, setStartDate] = useState("2026-06-01");
  const [endDate, setEndDate] = useState("2026-12-31");
  const [description, setDescription] = useState("");

  // Adjustment form
  const [phyProg, setPhyProg] = useState<number>(0);
  const [finProg, setFinProg] = useState<number>(0);

  // Photo uploads
  const [photoTitle, setPhotoTitle] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  // Budget states for creation and modification
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [editEstCost, setEditEstCost] = useState<number>(0);
  const [editActExpense, setEditActExpense] = useState<number>(0);
  const [editOverhead, setEditOverhead] = useState<number>(0);

  const [newEstimatedCost, setNewEstimatedCost] = useState<number>(450000000);
  const [newActualExpense, setNewActualExpense] = useState<number>(0);
  const [newOverheadCost, setNewOverheadCost] = useState<number>(0);

  // Change Orders & Payment Terms tracking states
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  const [activeFinanceTab, setActiveFinanceTab] = useState<"change_orders" | "payment_terms">("change_orders");

  // Form states for Change Orders
  const [coId, setCoId] = useState<string | null>(null);
  const [coTitle, setCoTitle] = useState("");
  const [coDesc, setCoDesc] = useState("");
  const [coAmount, setCoAmount] = useState<number>(0);
  const [coStatus, setCoStatus] = useState<"Draft" | "Disetujui" | "Ditolak">("Draft");
  const [coDate, setCoDate] = useState("");

  // Form states for Payment Terms
  const [ptId, setPtId] = useState<string | null>(null);
  const [ptName, setPtName] = useState("");
  const [ptPercentage, setPtPercentage] = useState<number>(0);
  const [ptDueDate, setPtDueDate] = useState("");
  const [ptStatus, setPtStatus] = useState<"Belum Tagih" | "Sudah Tagih" | "Lunas">("Belum Tagih");

  // Active Project object
  const activeProj = useMemo(() => {
    return projects.find(p => p.id === activeProjectId) || projects[0] || null;
  }, [projects, activeProjectId]);

  // Parse S-Curve Data
  const sCurvePoints = useMemo(() => {
    if (!activeProj) return [];
    try {
      return JSON.parse(activeProj.sCurveData) as SCurvePoint[];
    } catch (e) {
      // Default fallback if error
      return [
        { month: "Bulan 1", planned: 10, actual: 8 },
        { month: "Bulan 2", planned: 25, actual: 20 },
        { month: "Bulan 3", planned: 45, actual: 40 },
        { month: "Bulan 4", planned: 70, actual: 65 },
        { month: "Bulan 5", planned: 90, actual: 85 },
        { month: "Bulan 6", planned: 100, actual: 100 }
      ];
    }
  }, [activeProj]);

  // Parse documentation
  const docsList = useMemo(() => {
    if (!activeProj) return [];
    try {
      return JSON.parse(activeProj.documentation) as ProjectDoc[];
    } catch (e) {
      return [];
    }
  }, [activeProj]);

  const canModify = useMemo(() => {
    return ["Super Admin", "Direktur", "Project Manager", "Supervisor"].includes(userRole);
  }, [userRole]);

  const exportProjectsPDF = () => {
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
    doc.text("LAPORAN DAFTAR PORTFOLIO PROYEK KONSTRUKSI", 15, 26);
    
    // Doc Info
    doc.setTextColor(80, 80, 80);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(`Dicetak pada: ${new Date().toLocaleString("id-ID")}`, 145, 42);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 33, 71);
    doc.text("TABEL UTAMA PORTFOLIO PROYEK", 15, 45);
    
    const tableData = projects.map((p) => [
      p.id.toUpperCase().slice(0, 8),
      p.name,
      p.client,
      p.location,
      `Rp ${p.contractValue.toLocaleString("id-ID")}`,
      `${p.physicalProgress}%`,
      `${p.financialProgress}%`
    ]);

    autoTable(doc, {
      startY: 49,
      head: [["ID Proyek", "Nama Proyek", "Klien", "Lokasi", "Nilai Kontrak", "Prog. Fisik", "Keuangan"]],
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
        fontSize: 8,
        cellPadding: 3,
        valign: "middle"
      },
      columnStyles: {
        0: { halign: "center", fontStyle: "bold" },
        5: { halign: "center", fontStyle: "bold" },
        6: { halign: "center", fontStyle: "bold" }
      }
    });

    doc.save("Laporan_Daftar_Proyek_SOP_Kontraktor.pdf");
  };

  const exportActiveProjectPDF = () => {
    if (!activeProj) return;
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
    doc.text("DOKUMEN DETAIL PROYEK KONSTRUKSI", 15, 26);
    
    // Project info block
    doc.setTextColor(0, 33, 71);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("INFORMASI UTAMA KONTRAK", 15, 45);
    
    doc.setFillColor(248, 250, 252);
    doc.rect(15, 49, 180, 52, "F");
    
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(`Nama Proyek       : ${activeProj.name}`, 18, 55);
    doc.text(`Nama Klien        : ${activeProj.client}`, 18, 61);
    doc.text(`Nilai Kontrak     : Rp ${activeProj.contractValue.toLocaleString("id-ID")}`, 18, 67);
    doc.text(`Lokasi Lapangan   : ${activeProj.location}`, 18, 73);
    doc.text(`Umur Kontrak      : ${new Date(activeProj.startDate).toLocaleDateString("id-ID")} s/d ${new Date(activeProj.endDate).toLocaleDateString("id-ID")}`, 18, 79);
    doc.text(`Progress Fisik    : ${activeProj.physicalProgress}%`, 18, 85);
    doc.text(`Progress Keuangan : ${activeProj.financialProgress}%`, 18, 91);
    doc.text(`Status Kesehatan  : SEHAT (Optimasi Kurva-S Terpenuhi)`, 18, 97);

    // S-Curve Targets Table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 33, 71);
    doc.text("REKAP TARGET BULANAN (KURVA-S DATA)", 15, 110);

    const curveData = sCurvePoints.map((pt) => [
      pt.month,
      `${pt.planned}%`,
      `${pt.actual}%`,
      `${pt.actual - pt.planned}%`
    ]);

    autoTable(doc, {
      startY: 114,
      head: [["Bulan / Periode", "Rencana Target (%)", "Realisasi Aktual (%)", "Deviasi (%)"]],
      body: curveData,
      theme: "striped",
      headStyles: {
        fillColor: [0, 33, 71],
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: "bold",
        halign: "center"
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        valign: "middle"
      },
      columnStyles: {
        0: { halign: "center", fontStyle: "bold" },
        1: { halign: "center" },
        2: { halign: "center" },
        3: { halign: "center" }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 33, 71);
    doc.text("Pihak Penanggung Jawab,", 135, finalY);
    doc.text("Project PM & Supervisor", 135, finalY + 20);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text("_______________________", 135, finalY + 21);

    doc.save(`Laporan_Detail_${activeProj.name.replace(/ /g, "_")}.pdf`);
  };

  // Handlers
  const handleOpenCreateForm = () => {
    setName("");
    setLocation("");
    setClient("");
    setContractValue(1000000000);
    setStartDate("2026-06-01");
    setEndDate("2026-12-31");
    setDescription("");
    setNewEstimatedCost(850000000);
    setNewActualExpense(0);
    setNewOverheadCost(0);
    setIsCreating(true);
    setIsAdjusting(false);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !location.trim()) return;

    // Build standard incremental S-Curve plans
    const defaultSCurve: SCurvePoint[] = [
      { month: "Bulan 1", planned: 10, actual: 0 },
      { month: "Bulan 2", planned: 30, actual: 0 },
      { month: "Bulan 3", planned: 50, actual: 0 },
      { month: "Bulan 4", planned: 75, actual: 0 },
      { month: "Bulan 5", planned: 90, actual: 0 },
      { month: "Bulan 6", planned: 100, actual: 0 }
    ];

    try {
      await onAddProject({
        name,
        location,
        client,
        contractValue,
        startDate,
        endDate,
        physicalProgress: 0,
        financialProgress: 0,
        description,
        sCurveData: JSON.stringify(defaultSCurve),
        documentation: JSON.stringify([]),
        estimatedCost: newEstimatedCost,
        actualExpense: newActualExpense,
        overheadCost: newOverheadCost
      });
      setIsCreating(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdjustProgress = async () => {
    if (!activeProj) return;

    // Reconstruct S-Curve actual indicators dynamically
    const updatedSCurve = sCurvePoints.map((pt, idx) => {
      // Linearly interpolating actual progress up to the adjusted value
      const progressFraction = (idx + 1) / sCurvePoints.length;
      const computedActual = Math.min(Math.round(phyProg * progressFraction), phyProg);
      return {
        ...pt,
        actual: computedActual
      };
    });

    try {
      await onUpdateProject(activeProj.id, {
        physicalProgress: phyProg,
        financialProgress: finProg,
        sCurveData: JSON.stringify(updatedSCurve)
      });
      setIsAdjusting(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveBudget = async () => {
    if (!activeProj) return;
    try {
      await onUpdateProject(activeProj.id, {
        estimatedCost: editEstCost,
        actualExpense: editActExpense,
        overheadCost: editOverhead
      });
      setIsEditingBudget(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveChangeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProj || !coTitle.trim()) return;

    let currentCOs: ChangeOrder[] = [];
    if (activeProj.changeOrders) {
      try {
        currentCOs = JSON.parse(activeProj.changeOrders);
      } catch (err) {}
    }

    if (coId) {
      currentCOs = currentCOs.map(co => co.id === coId ? {
        ...co,
        title: coTitle.trim(),
        description: coDesc.trim(),
        amount: coAmount,
        status: coStatus,
        date: coDate || new Date().toISOString().split("T")[0]
      } : co);
    } else {
      const newCO: ChangeOrder = {
        id: `co_${Date.now()}`,
        title: coTitle.trim(),
        description: coDesc.trim(),
        amount: coAmount,
        status: coStatus,
        date: coDate || new Date().toISOString().split("T")[0]
      };
      currentCOs.push(newCO);
    }

    try {
      await onUpdateProject(activeProj.id, {
        changeOrders: JSON.stringify(currentCOs)
      });
      setCoId(null);
      setCoTitle("");
      setCoDesc("");
      setCoAmount(0);
      setCoStatus("Draft");
      setCoDate("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteChangeOrder = async (id: string) => {
    if (!activeProj) return;

    let currentCOs: ChangeOrder[] = [];
    if (activeProj.changeOrders) {
      try {
        currentCOs = JSON.parse(activeProj.changeOrders);
      } catch (err) {}
    }

    const nextCOs = currentCOs.filter(co => co.id !== id);

    try {
      await onUpdateProject(activeProj.id, {
        changeOrders: JSON.stringify(nextCOs)
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSavePaymentTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProj || !ptName.trim()) return;

    let currentPTs: PaymentTerm[] = [];
    if (activeProj.paymentTerms) {
      try {
        currentPTs = JSON.parse(activeProj.paymentTerms);
      } catch (err) {}
    } else {
      const val = activeProj.contractValue;
      currentPTs = [
         { id: "term-1", termName: "Down Payment (Uang Muka)", percentage: 20, amount: Math.round(val * 0.2), status: "Lunas", dueDate: activeProj.startDate },
         { id: "term-2", termName: "Termin I (Progress 50%)", percentage: 30, amount: Math.round(val * 0.3), status: "Belum Tagih", dueDate: activeProj.endDate },
         { id: "term-3", termName: "Termin II (Progress 80%)", percentage: 30, amount: Math.round(val * 0.3), status: "Belum Tagih", dueDate: activeProj.endDate },
         { id: "term-4", termName: "Termin Akhir (Serah Terima)", percentage: 20, amount: Math.round(val * 0.2), status: "Belum Tagih", dueDate: activeProj.endDate }
      ];
    }

    const changeOrders = activeProj.changeOrders ? JSON.parse(activeProj.changeOrders) : [];
    const approvedCOTotal = changeOrders
      .filter((co: any) => co.status === "Disetujui")
      .reduce((sum: number, co: any) => sum + co.amount, 0);
    const adjustedContractVal = activeProj.contractValue + approvedCOTotal;

    const termAmount = Math.round(adjustedContractVal * (ptPercentage / 100));

    if (ptId) {
      currentPTs = currentPTs.map(pt => pt.id === ptId ? {
        ...pt,
        termName: ptName.trim(),
        percentage: ptPercentage,
        amount: termAmount,
        dueDate: ptDueDate || activeProj.endDate,
        status: ptStatus
      } : pt);
    } else {
      const newPT: PaymentTerm = {
        id: `pt_${Date.now()}`,
        termName: ptName.trim(),
        percentage: ptPercentage,
        amount: termAmount,
        dueDate: ptDueDate || activeProj.endDate,
        status: ptStatus
      };
      currentPTs.push(newPT);
    }

    try {
      await onUpdateProject(activeProj.id, {
        paymentTerms: JSON.stringify(currentPTs)
      });
      setPtId(null);
      setPtName("");
      setPtPercentage(0);
      setPtDueDate("");
      setPtStatus("Belum Tagih");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePaymentTerm = async (id: string) => {
    if (!activeProj) return;

    let currentPTs: PaymentTerm[] = [];
    if (activeProj.paymentTerms) {
      try {
        currentPTs = JSON.parse(activeProj.paymentTerms);
      } catch (err) {}
    } else {
      const val = activeProj.contractValue;
      currentPTs = [
         { id: "term-1", termName: "Down Payment (Uang Muka)", percentage: 20, amount: Math.round(val * 0.2), status: "Lunas", dueDate: activeProj.startDate },
         { id: "term-2", termName: "Termin I (Progress 50%)", percentage: 30, amount: Math.round(val * 0.3), status: "Belum Tagih", dueDate: activeProj.endDate },
         { id: "term-3", termName: "Termin II (Progress 80%)", percentage: 30, amount: Math.round(val * 0.3), status: "Belum Tagih", dueDate: activeProj.endDate },
         { id: "term-4", termName: "Termin Akhir (Serah Terima)", percentage: 20, amount: Math.round(val * 0.2), status: "Belum Tagih", dueDate: activeProj.endDate }
      ];
    }

    const nextPTs = currentPTs.filter(pt => pt.id !== id);

    try {
      await onUpdateProject(activeProj.id, {
        paymentTerms: JSON.stringify(nextPTs)
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddDocumentation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProj || !photoTitle.trim()) return;

    const newPhotoUrl = photoUrl.trim() || "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=80";
    const newDoc: ProjectDoc = {
      title: photoTitle,
      url: newPhotoUrl,
      uploadedAt: new Date().toISOString()
    };

    const nextDocs = [...docsList, newDoc];

    try {
      await onUpdateProject(activeProj.id, {
        documentation: JSON.stringify(nextDocs)
      });
      setPhotoTitle("");
      setPhotoUrl("");
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to calculate total calendar duration in days
  const calculateDurationDays = (startStr: string, endStr: string) => {
    const s = new Date(startStr);
    const e = new Date(endStr);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
    const diffMs = e.getTime() - s.getTime();
    return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  };

  // Gantt Chart Calculations & Filtered entries
  const ganttData = useMemo(() => {
    if (projects.length === 0) {
      return {
        timelineStart: new Date("2026-01-01"),
        timelineEnd: new Date("2026-12-31"),
        months: [],
        projects: []
      };
    }

    // Search & Category Filters
    const filtered = projects.filter(proj => {
      const matchesSearch = 
        proj.name.toLowerCase().includes(ganttSearchQuery.toLowerCase()) ||
        proj.location.toLowerCase().includes(ganttSearchQuery.toLowerCase()) ||
        proj.client.toLowerCase().includes(ganttSearchQuery.toLowerCase());

      let matchesProgress = true;
      if (ganttProgressFilter === "planned") {
        matchesProgress = proj.physicalProgress === 0;
      } else if (ganttProgressFilter === "ongoing") {
        matchesProgress = proj.physicalProgress > 0 && proj.physicalProgress < 100;
      } else if (ganttProgressFilter === "completed") {
        matchesProgress = proj.physicalProgress === 100;
      }

      return matchesSearch && matchesProgress;
    });

    // Find bounding dates (earliest start and latest end across ALL projects in the ledger)
    let minT = new Date();
    let maxT = new Date();
    let datesFound = false;

    projects.forEach(proj => {
      const s = new Date(proj.startDate);
      const e = new Date(proj.endDate);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
        if (!datesFound) {
          minT = s;
          maxT = e;
          datesFound = true;
        } else {
          if (s < minT) minT = s;
          if (e > maxT) maxT = e;
        }
      }
    });

    if (!datesFound) {
      minT = new Date("2026-06-01");
      maxT = new Date("2026-12-31");
    }

    // Align bounds strictly to monthly spans
    const timelineStart = new Date(minT.getFullYear(), minT.getMonth(), 1);
    const timelineEnd = new Date(maxT.getFullYear(), maxT.getMonth() + 1, 0);

    // Safeguard to make sure there's at least a 3-month viewport representation
    const diffMonths = (timelineEnd.getFullYear() - timelineStart.getFullYear()) * 12 + (timelineEnd.getMonth() - timelineStart.getMonth()) + 1;
    if (diffMonths < 3) {
      timelineEnd.setMonth(timelineEnd.getMonth() + (3 - diffMonths));
    }

    // Build month intervals
    const monthsList: { label: string; year: number; monthIndex: number }[] = [];
    const current = new Date(timelineStart);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    
    while (current <= timelineEnd) {
      monthsList.push({
        label: `${monthNames[current.getMonth()]} ${current.getFullYear()}`,
        year: current.getFullYear(),
        monthIndex: current.getMonth()
      });
      current.setMonth(current.getMonth() + 1);
    }

    return {
      timelineStart,
      timelineEnd,
      months: monthsList,
      projects: filtered
    };
  }, [projects, ganttSearchQuery, ganttProgressFilter]);

  // Translate date to percentage coordinates relative to timeline
  const getGanttPosition = (startStr: string, endStr: string, timelineStart: Date, timelineEnd: Date) => {
    const s = new Date(startStr);
    const e = new Date(endStr);
    
    if (isNaN(s.getTime()) || isNaN(e.getTime())) {
      return { left: 0, width: 0 };
    }

    const startMs = s.getTime();
    const endMs = e.getTime();
    const tStartMs = timelineStart.getTime();
    const tEndMs = timelineEnd.getTime();
    const totalDuration = tEndMs - tStartMs;

    if (totalDuration <= 0) return { left: 0, width: 0 };

    const leftPct = Math.max(0, ((startMs - tStartMs) / totalDuration) * 100);
    const widthPct = Math.max(1, ((endMs - startMs) / totalDuration) * 100);

    const left = Math.min(leftPct, 100);
    const width = Math.min(widthPct, 100 - left);

    return { left, width };
  };

  // Vertical line coordinate for "Today" (simulated as UTC 2026-06-05)
  const todayPosition = useMemo(() => {
    const today = new Date("2026-06-05T14:23:39Z");
    const { timelineStart, timelineEnd } = ganttData;
    const tStartMs = timelineStart.getTime();
    const totalDuration = timelineEnd.getTime() - tStartMs;
    const todayMs = today.getTime();

    if (totalDuration > 0 && todayMs >= tStartMs && todayMs <= timelineEnd.getTime()) {
      return ((todayMs - tStartMs) / totalDuration) * 100;
    }
    return null;
  }, [ganttData]);

  // Format helper
  const formatIDR = (val: number) => {
    return `Rp ${val.toLocaleString("id-ID")}`;
  };

  return (
    <div className="space-y-5 w-full" id="projects-tab-root">
      
      {/* Visual Sub-Tab Header Controller */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#002147]/5 p-2 rounded-xl border border-[#002147]/10 flex-shrink-0">
            <Building className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <h2 className="text-sm font-black text-[#002147] uppercase font-mono tracking-wider">
              Modul Manajemen Proyek ERP
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">
              Monitor Kemajuan Fisik-Sipil, Target Milestones, &amp; Kurva-S Schedulling
            </p>
          </div>
        </div>

        {/* Dynamic Nav Sub-tabs Switcher & Export */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Export Buttons */}
          <div className="flex gap-2">
            <button
              onClick={exportProjectsPDF}
              className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-[#002147] border border-slate-200 font-extrabold font-mono text-xs px-3 py-1.5 rounded-lg transition cursor-pointer"
              title="Export semua daftar proyek ke PDF"
            >
              <Upload className="w-3.5 h-3.5 rotate-180 text-[#D4AF37]" /> Portofolio PDF
            </button>
            
            {activeProj && (
              <button
                onClick={exportActiveProjectPDF}
                className="flex items-center gap-1.5 bg-[#002147] hover:bg-[#001733] text-white border border-[#002147] font-extrabold font-mono text-xs px-3 py-1.5 rounded-lg transition cursor-pointer"
                title="Export detail proyek aktif ke PDF"
              >
                <Upload className="w-3.5 h-3.5 rotate-180 text-[#D4AF37]" /> Detail PDF
              </button>
            )}
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveSubTab("dashboard")}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-bold transition font-mono uppercase tracking-wider cursor-pointer ${
                activeSubTab === "dashboard"
                  ? "bg-white text-[#002147] shadow-xs font-black border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-[#D4AF37]" />
              Kontrol Proyek &amp; Kurva-S
            </button>
            <button
              onClick={() => setActiveSubTab("gantt")}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-bold transition font-mono uppercase tracking-wider cursor-pointer ${
                activeSubTab === "gantt"
                  ? "bg-white text-[#002147] shadow-xs font-black border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
              Timeline Gantt Chart
            </button>
            <button
              onClick={() => {
                setActiveSubTab("map");
                // Trigger live geolocation request gracefully upon activating map tab
                requestUserLocation();
              }}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-bold transition font-mono uppercase tracking-wider cursor-pointer ${
                activeSubTab === "map"
                  ? "bg-white text-[#002147] shadow-xs font-black border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
              Peta Sebaran Proyek
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: EXISTING PROJECTS GRID & S-CURVE METRICS */}
      {activeSubTab === "dashboard" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="projects-tab-container">
          
          {/* Active Projects Selector Panel (Left) */}
          <div className="lg:col-span-4 bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex flex-col h-[calc(100vh-140px)]" id="projects-sidebar">
            
            <div className="pb-3 border-b border-slate-100 flex justify-between items-center whitespace-nowrap gap-2">
              <h3 className="text-xs font-black text-[#002147] uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Building className="w-4 h-4 text-[#D4AF37]" />
                Daftar Konstruksi Aktif
              </h3>
              
              <button
                onClick={handleOpenCreateForm}
                disabled={!canModify}
                className="p-1 px-3 rounded bg-[#002147] hover:bg-[#001733] text-white font-mono text-[10px] font-black uppercase tracking-wider transition disabled:opacity-40 cursor-pointer"
              >
                + Proyek Baru
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 mt-4 pr-1 scrollbar-thin">
              {projects.map((proj) => {
                const isActive = activeProjectId === proj.id;
                return (
                  <button
                    key={proj.id}
                    onClick={() => {
                      setActiveProjectId(proj.id);
                      setIsCreating(false);
                      setIsAdjusting(false);
                      setIsEditingBudget(false);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition cursor-pointer ${
                      isActive 
                      ? "bg-[#002147]/5 border-[#002147] shadow-xs" 
                      : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] bg-slate-50 border border-slate-200 py-0.5 px-2 rounded-full font-mono text-slate-500 font-bold">
                        ID: #{proj.id.toUpperCase()}
                      </span>
                      <span className="text-xs font-black text-[#D4AF37] font-mono">
                        {proj.physicalProgress}%
                      </span>
                    </div>

                    <h4 className="text-xs font-extrabold text-[#002147] mt-2 line-clamp-1 font-sans">
                      {proj.name}
                    </h4>

                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-1">
                      <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span className="truncate">{proj.location}</span>
                    </div>

                    {/* Progress bar simulation */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3">
                      <div className="h-full bg-[#D4AF37] transition-all duration-350" style={{ width: `${proj.physicalProgress}%` }}></div>
                    </div>
                  </button>
                );
              })}
            </div>

          </div>

          {/* Detail Block & Progress Editor Panel (Right) */}
          <div className="lg:col-span-8 bg-white border border-slate-200 shadow-sm rounded-xl p-5 md:p-6 min-h-[calc(100vh-140px)] flex flex-col justify-between" id="projects-work-area">

            {/* 1. STATE: ADD PROJECT FORM */}
            {isCreating && (
              <form onSubmit={handleCreateProject} className="space-y-4 font-sans" id="project-create-form">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black uppercase font-mono tracking-wider text-[#002147]">
                    Registrasi Kontrak &amp; Proyek Baru
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 font-mono cursor-pointer"
                  >
                    Batal
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Nama Proyek Konstruksi:</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: Pengaspalan Jalan Raya Pantura"
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Lokasi Pekerjaan Lapangan:</label>
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Contoh: Demak - Tuban, Jawa Tengah"
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Nama Perusahaan Klien / BUMDes:</label>
                    <input
                      type="text"
                      required
                      value={client}
                      onChange={(e) => setClient(e.target.value)}
                      placeholder="Contoh: PT Semesta Raya Agung"
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Nilai Kontrak Project (IDR):</label>
                    <input
                      type="number"
                      required
                      value={contractValue}
                      onChange={(e) => setContractValue(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#D4AF37] font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Tanggal Mulai (SPK):</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#D4AF37] font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Tanggal Rampung Estimasi:</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#D4AF37] font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-dashed border-slate-200 pt-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Estimasi RAP (Budget):</label>
                    <input
                      type="number"
                      required
                      value={newEstimatedCost}
                      onChange={(e) => setNewEstimatedCost(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#D4AF37] font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Biaya Aktual Lapangan:</label>
                    <input
                      type="number"
                      required
                      value={newActualExpense}
                      onChange={(e) => setNewActualExpense(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#D4AF37] font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Biaya Overhead:</label>
                    <input
                      type="number"
                      required
                      value={newOverheadCost}
                      onChange={(e) => setNewOverheadCost(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#D4AF37] font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Keterangan Spesifikasi Teknis / Scope:</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Spesifikasi agregat, dimensi pengecoran, standardisasi SNI..."
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#D4AF37]"
                  />
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
                    Konfirmasi SPK
                  </button>
                </div>
              </form>
            )}

            {/* 2. STATE: DETAILS & S-CURVE METRICS VIEW */}
            {!isCreating && activeProj && (
              <div className="space-y-6 flex-grow flex flex-col justify-between" id="project-detail-view-container">
                
                {/* Top metadata row */}
                <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 font-sans">
                  <div className="space-y-1.5 flex-1 select-none">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] border border-[#D4AF37]/35 bg-[#D4AF37]/10 text-[#D4AF37] font-bold font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Nilai Kontrak: {formatIDR(activeProj.contractValue)}
                      </span>
                      <span className="text-[10px] bg-[#002147]/5 border border-[#002147]/10 text-[#002147] font-mono font-bold py-0.5 px-2.5 rounded-full">
                        Klien: {activeProj.client}
                      </span>
                    </div>
                    
                    <h2 className="text-md sm:text-lg md:text-xl font-black text-[#002147] mt-1 line-clamp-2 leading-snug">
                      {activeProj.name}
                    </h2>
                    
                    <p className="text-xs text-slate-550 flex items-center gap-1 font-mono font-bold">
                      <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>{activeProj.location}</span>
                    </p>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {canModify && (
                      <button
                        onClick={() => {
                          setPhyProg(activeProj.physicalProgress);
                          setFinProg(activeProj.financialProgress);
                          setIsAdjusting(!isAdjusting);
                        }}
                        className="p-2 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition font-mono text-[11px] font-black flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sliders className="w-4 h-4 text-[#D4AF37]" /> Ajustmen Progress
                      </button>
                    )}

                    {userRole === "Super Admin" && (
                      <button
                        onClick={() => {
                          if (confirm("Hapus seluruh catatan proyek ini beserta grafik S-Curvenya?")) {
                            onDeleteProject(activeProj.id);
                          }
                        }}
                        className="p-2 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 transition cursor-pointer"
                        title="Hapus Proyek"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Adjuster drawer panel */}
                {isAdjusting && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 font-sans shadow-inner">
                    <h4 className="text-xs font-black text-[#002147] font-mono uppercase tracking-wider flex items-center gap-1">
                      <Sliders className="w-4 h-4 text-[#D4AF37]" /> Update Kemajuan Pekerjaan Harian
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 p-3 bg-white border border-slate-200 rounded-lg">
                        <div className="flex justify-between items-center text-xs font-mono text-slate-700">
                          <span className="font-bold">Progress Fisik Sipil</span>
                          <strong className="text-[#D4AF37] text-sm">{phyProg}%</strong>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={phyProg}
                          onChange={(e) => setPhyProg(Number(e.target.value))}
                          className="w-full accent-[#002147] cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1.5 p-3 bg-white border border-slate-200 rounded-lg">
                        <div className="flex justify-between items-center text-xs font-mono text-slate-700">
                          <span className="font-bold">Prosentase Keuangan</span>
                          <strong className="text-blue-700 text-sm">{finProg}%</strong>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={finProg}
                          onChange={(e) => setFinProg(Number(e.target.value))}
                          className="w-full accent-blue-600 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end font-mono">
                      <button
                        onClick={() => setIsAdjusting(false)}
                        className="bg-white border border-slate-200 text-slate-500 py-1.5 px-3 rounded text-xs font-bold cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleAdjustProgress}
                        className="bg-[#002147] hover:bg-[#001733] text-white py-1.5 px-4 rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Simpan Progres
                      </button>
                    </div>
                  </div>
                )}

                {/* Timelines and Description */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-sans">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />
                    <div>
                      <span className="text-[9px] text-slate-400 block font-mono uppercase font-bold">Mulai Kontrak</span>
                      <strong className="text-xs text-slate-800 font-mono font-bold">{new Date(activeProj.startDate).toLocaleDateString("id-ID")}</strong>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center gap-3">
                    <Hourglass className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <span className="text-[9px] text-slate-400 block font-mono uppercase font-bold">Target Rampung</span>
                      <strong className="text-xs text-slate-800 font-mono font-bold">{new Date(activeProj.endDate).toLocaleDateString("id-ID")}</strong>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200 flex items-center justify-between col-span-1 sm:col-span-1 bg-slate-50">
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-400 block font-mono uppercase font-bold">Kemajuan Kumulatif</span>
                      <strong className="text-xs text-green-700 font-mono font-bold">Deviasi Optimal</strong>
                    </div>
                    <div className="p-1 px-2 text-[10px] bg-green-50 border border-green-200 rounded font-mono text-green-700 font-extrabold select-none">
                      SEHAT
                    </div>
                  </div>
                </div>

                {/* Description Scope */}
                {activeProj.description && (
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs text-slate-600 leading-relaxed font-sans shadow-2xs">
                    <strong className="text-[#002147] font-bold font-mono text-[10px] uppercase block mb-1">Catatan Lingkup Konstruksi (Scope):</strong>
                    {activeProj.description}
                  </div>
                )}

                {/* 2.5 FINANCIAL BUDGETING SECTION */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 space-y-4 shadow-3xs" id="project-financial-budgeting-section">
                  {(() => {
                    // Extract and calculate Change Orders
                    const changeOrders = (() => {
                      if (!activeProj.changeOrders) return [];
                      try { return JSON.parse(activeProj.changeOrders) as ChangeOrder[]; } catch { return []; }
                    })();
                    const approvedCOTotal = changeOrders
                      .filter(co => co.status === "Disetujui")
                      .reduce((sum, co) => sum + co.amount, 0);
                    const netContractValue = activeProj.contractValue + approvedCOTotal;

                    // Extract and calculate Payment Terms
                    const paymentTerms = (() => {
                      if (!activeProj.paymentTerms) {
                        const val = activeProj.contractValue;
                        return [
                          { id: "term-1", termName: "Down Payment (Uang Muka Kerja)", percentage: 20, amount: Math.round(val * 0.2), status: "Lunas", dueDate: activeProj.startDate },
                          { id: "term-2", termName: "Termin I (Progress Fisik 50%)", percentage: 30, amount: Math.round(val * 0.3), status: "Belum Tagih", dueDate: activeProj.endDate },
                          { id: "term-3", termName: "Termin II (Progress Fisik 80%)", percentage: 30, amount: Math.round(val * 0.3), status: "Belum Tagih", dueDate: activeProj.endDate },
                          { id: "term-4", termName: "Termin Akhir (Serah Terima 100%)", percentage: 20, amount: Math.round(val * 0.2), status: "Belum Tagih", dueDate: activeProj.endDate }
                        ] as PaymentTerm[];
                      }
                      try { return JSON.parse(activeProj.paymentTerms) as PaymentTerm[]; } catch { return []; }
                    })();

                    const totalInvoicePaid = paymentTerms
                      .filter(pt => pt.status === "Lunas")
                      .reduce((sum, pt) => sum + pt.amount, 0);
                    const totalInvoiceOutstanding = paymentTerms
                      .filter(pt => pt.status === "Sudah Tagih")
                      .reduce((sum, pt) => sum + pt.amount, 0);

                    // Calculations for RAP
                    const rawEst = activeProj.estimatedCost ?? Math.round(activeProj.contractValue * 0.85);
                    // Approved Change Orders usually scale the project budget costs too, let's assume 85% of CO amount is added to RAP
                    const coRapCostImpact = Math.round(approvedCOTotal * 0.85);
                    const est = rawEst + coRapCostImpact;

                    const act = activeProj.actualExpense ?? 0;
                    const ovr = activeProj.overheadCost ?? 0;
                    const totalCost = act + ovr;
                    const sisa = est - totalCost;
                    const utilization = est > 0 ? (totalCost / est) * 100 : 0;

                    let barColor = "bg-emerald-600";
                    let textColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
                    let isOver = false;

                    if (utilization > 100) {
                      barColor = "bg-red-600";
                      textColor = "text-red-700 bg-red-50 border-red-200";
                      isOver = true;
                    } else if (utilization > 85) {
                      barColor = "bg-amber-500";
                      textColor = "text-amber-800 bg-amber-50 border-amber-200";
                    }

                    return (
                      <>
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2">
                            <div className="bg-blue-50 border border-blue-100 p-1.5 rounded-lg">
                              <DollarSign className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            </div>
                            <div>
                              <h3 className="text-xs font-black text-[#002147] font-mono uppercase tracking-wider">
                                Penganggaran &amp; Keuangan Kontrak (Financial Budgeting)
                              </h3>
                              <p className="text-[10px] text-slate-400 font-mono">
                                Lacak RAP, realisasi lapangan, dampak addendum, serta penerimaan termin pembayaran klien.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 font-mono flex-wrap">
                            {canModify && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isEditingBudget) {
                                    setEditEstCost(activeProj.estimatedCost ?? Math.round(activeProj.contractValue * 0.85));
                                    setEditActExpense(activeProj.actualExpense ?? 0);
                                    setEditOverhead(activeProj.overheadCost ?? 0);
                                  }
                                  setIsEditingBudget(!isEditingBudget);
                                }}
                                className="py-1 px-2.5 rounded bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 text-[9px] font-bold transition uppercase tracking-wider cursor-pointer"
                              >
                                {isEditingBudget ? "Batal" : "⚙️ Atur RAP"}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setIsFinancialModalOpen(true);
                              }}
                              className="py-1 px-3 rounded bg-[#002147] hover:bg-[#00142b] text-[#D4AF37] text-[9px] font-bold transition uppercase tracking-wider cursor-pointer inline-flex items-center gap-1.5 shadow-2xs border border-amber-550/20"
                            >
                              💼 Kelola CO &amp; Termin
                            </button>
                          </div>
                        </div>

                        {/* Contract summary and payment terms summary grids */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-250/50">
                          {/* Left: Contract and Addenda Information */}
                          <div className="space-y-2 border-r border-slate-200 md:pr-4">
                            <h4 className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider">Metrik Nilai Kontrak</h4>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                                <span className="text-slate-500 font-sans">1. Nilai Kontrak Base (Awal):</span>
                                <span className="font-mono font-bold text-slate-800">{formatIDR(activeProj.contractValue)}</span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                                <span className="text-slate-500 font-sans">2. Akumulasi Addendum (CO):</span>
                                <span className={`font-mono font-bold ${approvedCOTotal >= 0 ? "text-green-600" : "text-rose-600"}`}>
                                  {approvedCOTotal >= 0 ? "+" : ""}{formatIDR(approvedCOTotal)}
                                </span>
                              </div>
                              <div className="flex justify-between py-1 font-bold">
                                <span className="text-slate-800 font-sans">3. Nilai Kontrak Akhir:</span>
                                <span className="font-mono text-[#002147]">{formatIDR(netContractValue)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Milestone Payment details */}
                          <div className="space-y-2 md:pl-2">
                            <h4 className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider">Progress Cash-In (Termin)</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div className="bg-white p-2.5 rounded border border-slate-200 shadow-3xs">
                                <span className="text-[8px] text-slate-400 block font-mono font-bold uppercase">Sudah Dibayar (Lunas)</span>
                                <strong className="text-xs font-mono text-green-600 block mt-0.5">{formatIDR(totalInvoicePaid)}</strong>
                                <span className="text-[9px] text-slate-400 font-mono">{((totalInvoicePaid / (netContractValue || 1)) * 100).toFixed(1)}% Kontrak</span>
                              </div>
                              <div className="bg-white p-2.5 rounded border border-slate-200 shadow-3xs">
                                <span className="text-[8px] text-slate-400 block font-mono font-bold uppercase">Outstanding Invoice</span>
                                <strong className="text-xs font-mono text-blue-600 block mt-0.5">{formatIDR(totalInvoiceOutstanding)}</strong>
                                <span className="text-[9px] text-slate-400 font-mono">Belum Lunas</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {isEditingBudget ? (
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 font-sans shadow-inner">
                            <h4 className="text-[11px] font-black text-[#002147] font-mono uppercase tracking-wider">
                              Form Pemutakhiran Anggaran Proyek
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-500 font-mono uppercase">Anggaran Estimasi (RAP):</label>
                                <input
                                  type="number"
                                  value={editEstCost}
                                  onChange={(e) => setEditEstCost(Math.max(0, Number(e.target.value)))}
                                  className="w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-[#D4AF37] font-mono"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-500 font-mono uppercase">Biaya Aktual (Real Cost):</label>
                                <input
                                  type="number"
                                  value={editActExpense}
                                  onChange={(e) => setEditActExpense(Math.max(0, Number(e.target.value)))}
                                  className="w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-[#D4AF37] font-mono"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-500 font-mono uppercase">Biaya Overhead:</label>
                                <input
                                  type="number"
                                  value={editOverhead}
                                  onChange={(e) => setEditOverhead(Math.max(0, Number(e.target.value)))}
                                  className="w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-[#D4AF37] font-mono"
                                />
                              </div>
                            </div>

                            <div className="flex gap-2 justify-end font-mono">
                              <button
                                type="button"
                                onClick={() => setIsEditingBudget(false)}
                                className="bg-white border border-slate-200 text-slate-500 py-1 px-2.5 rounded text-[10px] font-bold cursor-pointer"
                              >
                                Batal
                              </button>
                              <button
                                type="button"
                                onClick={handleSaveBudget}
                                className="bg-[#002147] hover:bg-[#001733] text-white py-1 px-3.5 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                              >
                                Simpan Anggaran
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-sans">
                              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] text-slate-400 block font-mono uppercase font-bold">Anggaran RAP</span>
                                  {approvedCOTotal !== 0 && (
                                    <span className="text-[8px] bg-slate-200 text-slate-600 px-1 rounded font-mono font-bold" title={`Original Base RAP: ${formatIDR(rawEst)}`}>Adjusted</span>
                                  )}
                                </div>
                                <strong className="text-xs text-slate-800 font-mono font-bold block mt-0.5">{formatIDR(est)}</strong>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <span className="text-[9px] text-slate-400 block font-mono uppercase font-bold">Realisasi Lapangan</span>
                                <strong className="text-xs text-slate-800 font-mono font-bold block mt-0.5">{formatIDR(act)}</strong>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <span className="text-[9px] text-slate-400 block font-mono uppercase font-bold">Biaya Overhead</span>
                                <strong className="text-xs text-slate-800 font-mono font-bold block mt-0.5">{formatIDR(ovr)}</strong>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <span className="text-[9px] text-slate-400 block font-mono uppercase font-bold">Sisa Plafon</span>
                                <strong className={`text-xs font-mono font-bold block mt-0.5 ${sisa >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {formatIDR(sisa)}
                                </strong>
                              </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 space-y-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex-1 space-y-1.5">
                                <div className="flex justify-between items-center text-[10px] font-mono font-bold">
                                  <span className="text-slate-550">Utilisasi RAP Proyek (Budget Utilization)</span>
                                  <span className={isOver ? "text-red-700 font-black" : "text-slate-705 font-bold"}>
                                    {formatIDR(totalCost)} / {formatIDR(est)} ({utilization.toFixed(1)}%)
                                  </span>
                                </div>
                                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden relative">
                                  <div 
                                    className={`h-full transition-all duration-350 ${barColor}`}
                                    style={{ width: `${Math.min(100, utilization)}%` }}
                                  />
                                </div>
                              </div>

                              <div className="flex justify-end items-center flex-shrink-0">
                                <span className={`inline-flex items-center gap-1.5 py-1 px-3.5 rounded-full text-[9px] font-black font-mono border uppercase tracking-wider ${textColor}`}>
                                  ⚙️ {isOver ? "OFF-Limits (Over)" : "Efisien & Terkendali"}
                                </span>
                              </div>
                            </div>

                            {isOver && (
                              <div className="bg-red-50/70 border border-red-200 rounded-lg p-2.5 px-3 flex items-center gap-2 text-red-800 text-[10px] font-mono leading-relaxed" id="budget-overrun-banner">
                                <span className="text-xs">⚠️</span>
                                <span><strong>Peringatan Defisit:</strong> Pengeluaran kumulatif dan overhead melebihi Rencana Anggaran Pelaksanaan (RAP) yang disesuaikan. Silakan tinjau rekayasa material lapangan atau ajukan adendum volume pekerjaan tambahan!</span>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* 3. SAFETY (K3) DAILY CHECKLIST SECTION */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 space-y-4 shadow-3xs" id="k3-safety-checklist-section">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-amber-50 border border-amber-200 p-1.5 rounded-lg">
                        <Shield className="w-5 h-5 text-[#D4AF37]" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-[#002147] font-mono uppercase tracking-wider">
                          Inspeksi Keselamatan Harian (K3 Checklist)
                        </h3>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Lacak kepatuhan alat pelindung diri, inspeksi perancah, rambu-rambu, dan mitigasi bahaya di lapangan.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 font-mono">
                      <button
                        type="button"
                        onClick={handleResetSafetyChecklist}
                        className="flex items-center gap-1.5 py-1 px-2.5 rounded bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 text-[9px] font-bold transition uppercase tracking-wider cursor-pointer"
                        title="Kosongkan status inspeksi hari ini"
                      >
                        <RotateCcw className="w-3 h-3 text-amber-500" /> Reset
                      </button>
                      <button
                        type="button"
                        onClick={handleCheckAllSafetyChecklist}
                        className="flex items-center gap-1.5 py-1 px-2.5 rounded bg-[#002147]/5 border border-[#002147]/15 hover:bg-[#002147]/10 text-[#002147] text-[9px] font-bold transition uppercase tracking-wider cursor-pointer"
                        title="Tandai semua item sudah terverifikasi aman"
                      >
                        <CheckCircle className="w-3 h-3 text-emerald-500" /> Setujui Semua
                      </button>
                    </div>
                  </div>

                  {/* K3 Progress compliance bar */}
                  {safetyChecklist.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans">
                      <div className="w-full sm:w-2/3 space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-mono font-bold">
                          <span className="text-slate-550">Kepatuhan K3 (Compliance Rate)</span>
                          <span className={`${
                            (safetyChecklist.filter(item => item.completed).length / safetyChecklist.length) >= 0.8
                              ? "text-emerald-700"
                              : (safetyChecklist.filter(item => item.completed).length / safetyChecklist.length) >= 0.5
                              ? "text-amber-700"
                              : "text-red-700"
                          }`}>
                            {safetyChecklist.filter(item => item.completed).length} dari {safetyChecklist.length} item ({Math.round(safetyChecklist.filter(item => item.completed).length / safetyChecklist.length * 100)}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-350 ${
                              (safetyChecklist.filter(item => item.completed).length / safetyChecklist.length) >= 0.8
                                ? "bg-emerald-600"
                                : (safetyChecklist.filter(item => item.completed).length / safetyChecklist.length) >= 0.5
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${Math.round(safetyChecklist.filter(item => item.completed).length / safetyChecklist.length * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="w-full sm:w-auto flex justify-end">
                        <span className={`inline-flex items-center gap-1.5 py-1 px-3.5 rounded-full text-[9px] font-black font-mono border uppercase tracking-wider ${
                          (safetyChecklist.filter(item => item.completed).length / safetyChecklist.length) >= 0.8
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800 animate-pulse"
                            : (safetyChecklist.filter(item => item.completed).length / safetyChecklist.length) >= 0.5
                            ? "bg-amber-50 border-amber-200 text-amber-800"
                            : "bg-red-50 border-red-200 text-red-800 animate-bounce"
                        }`}>
                          🛡️ {(safetyChecklist.filter(item => item.completed).length / safetyChecklist.length) >= 0.8
                            ? "AMAN (K3 PATUH)"
                            : (safetyChecklist.filter(item => item.completed).length / safetyChecklist.length) >= 0.5
                            ? "PERINGATAN K3"
                            : "RISIKO TINGGI"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Checklist items rows */}
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 shadow-inner">
                    {safetyChecklist.length > 0 ? (
                      safetyChecklist.map((item) => (
                        <div 
                          key={item.id}
                          className={`flex items-start justify-between gap-3 p-3 rounded-xl border transition duration-150 ${
                            item.completed 
                              ? "bg-emerald-50/10 border-emerald-200/55 hover:bg-emerald-50/20"
                              : "bg-white border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-start gap-2.5 flex-1 cursor-pointer select-none" onClick={() => handleToggleSafetyItem(item.id)}>
                            <div
                              className={`mt-0.5 w-4.5 h-4.5 rounded border flex items-center justify-center transition-all ${
                                item.completed 
                                  ? "bg-emerald-600 border-emerald-600 text-white animate-scale-up" 
                                  : "bg-white border-slate-300 hover:border-slate-400 text-transparent"
                              }`}
                            >
                              {item.completed && <CheckCircle className="w-3.5 h-3.5" />}
                            </div>
                            <div className="space-y-0.5">
                              <span className={`text-xs font-semibold leading-relaxed font-sans ${
                                item.completed ? "text-slate-500 line-through decoration-slate-400" : "text-slate-800"
                              }`}>
                                {item.task}
                              </span>
                              {item.completed && item.checkedBy && (
                                <div className="text-[9px] font-mono text-emerald-700 flex items-center gap-1 font-semibold">
                                  <span>✅ Terverifikasi:</span>
                                  <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded font-extrabold">{item.checkedBy}</span>
                                  {item.checkedAt && <span>pukul {item.checkedAt}</span>}
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteSafetyItem(item.id)}
                            className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer flex-shrink-0"
                            title="Hapus item checklist ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 font-mono text-xs p-6">
                        🔒 Belum ada kriteria inspeksi K3 dalam checklist harian ini.
                      </div>
                    )}
                  </div>

                  {/* Add item inline mini-form */}
                  <form onSubmit={handleAddSafetyItem} className="flex gap-2 pt-2 border-t border-dashed border-slate-200">
                    <input
                      type="text"
                      value={newSafetyTask}
                      onChange={(e) => setNewSafetyTask(e.target.value)}
                      placeholder="Masukkan item K3 baru (misal: Wear PPE, Scaffold Inspection)..."
                      className="flex-1 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-sans text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#D4AF37] transition"
                    />
                    <button
                      type="submit"
                      disabled={!newSafetyTask.trim()}
                      className="px-3.5 py-1.5 bg-[#002147] hover:bg-[#001733] text-white rounded-lg text-xs font-mono font-black uppercase tracking-wider flex items-center gap-1 transition disabled:opacity-40 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-3" /> Tambah
                    </button>
                  </form>
                </div>

                {/* ERP S-CURVE METRICS CHART */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4" id="s-curve-analytic-graphics">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
                    <h3 className="text-xs font-black text-[#002147] font-mono uppercase tracking-wider flex items-center gap-1.5 font-sans">
                      <LineChartIcon className="w-4 h-4 text-[#D4AF37]" />
                      ANALISA KARYA: KURVA-S KEMAJUAN PROYEK
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">Diagram Interpolasi Rencana vs Realisasi (%)</span>
                  </div>

                  <div className="h-50">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sCurvePoints} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1" }} 
                          labelStyle={{ color: "#002147", fontSize: 11, fontWeight: "bold" }}
                          itemStyle={{ fontSize: 11 }}
                        />
                        <Legend wrapperStyle={{ fontSize: 10, fontFamily: "sans-serif" }} />
                        <Line type="monotone" dataKey="planned" stroke="#002147" name="Rencana Target (%)" strokeWidth={2.5} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="actual" stroke="#D4AF37" name="Realisasi Aktual (%)" strokeWidth={3} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* DOCUMENTATION PHOTOS / FOOTAGE GALLERIES */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-3 border-t border-slate-150 font-sans">
                  
                  {/* Image Adder form */}
                  <div className="md:col-span-5 space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-black text-[#002147] font-mono uppercase tracking-wider flex items-center gap-1">
                      <Camera className="w-4 h-4 text-[#D4AF37]" /> Upload Foto Kerja
                    </h4>

                    <form onSubmit={handleAddDocumentation} className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 font-mono uppercase">Nama Label Foto:</label>
                        <input
                          type="text"
                          required
                          value={photoTitle}
                          onChange={(e) => setPhotoTitle(e.target.value)}
                          placeholder="Misal: Pengecoran Segmen 1 (100% Selesai)"
                          className="w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 font-mono uppercase">Gambar URL (Atau Kosongkan untuk Mock):</label>
                        <input
                          type="text"
                          value={photoUrl}
                          onChange={(e) => setPhotoUrl(e.target.value)}
                          placeholder="Koneksi URL Gambar..."
                          className="w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-[#002147] hover:bg-[#001733] transition text-white py-2 px-3 rounded text-xs font-mono uppercase tracking-wider font-extrabold cursor-pointer"
                      >
                        Arsip Foto Kerja
                      </button>
                    </form>
                  </div>

                  {/* Photo Galleries list */}
                  <div className="md:col-span-7 bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between shadow-2xs">
                    <h4 className="text-xs font-black text-[#002147] font-mono uppercase tracking-wider border-b border-slate-200 pb-2 mb-2">
                      Dokumentasi Aktual Lapangan ({docsList.length})
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto max-h-[160px] pr-1">
                      {docsList.length > 0 ? (
                        docsList.map((doc, idx) => (
                          <div key={idx} className="group relative rounded overflow-hidden aspect-video bg-white border border-slate-200 shadow-2xs">
                            <img 
                              referrerPolicy="no-referrer"
                              src={doc.url} 
                              alt={doc.title} 
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-1">
                              <span className="text-[9px] text-white font-semibold truncate w-full" title={doc.title}>
                                 {doc.title}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-3 text-center py-6 text-slate-400 font-mono text-[11px] h-full flex items-center justify-center">
                          Belum ada dokumentasi visual terarsip.
                        </div>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            )}

          </div>

        </div>
      )}

      {/* SUB-TAB 2: GANTT CHART TIMELINE INTEGRATED VIEW */}
      {activeSubTab === "gantt" && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 md:p-6 space-y-6" id="gantt-chart-view">
          
          {/* Gantt Header & Stats Overview Row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
            <div>
              <h3 className="text-md font-black text-[#002147] font-mono uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#D4AF37]" />
                Jadwal Proyek Konstruksi Terintegrasi
              </h3>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Visualisasi pemetaan rentang tanggal, estimasi umur kontrakan, dan progres fisik kumulatif seluruh entitas.
              </p>
            </div>

            {/* Quick counters summary indicators */}
            <div className="flex gap-3 flex-wrap font-sans">
              <div className="bg-[#002147]/5 border border-[#002147]/10 rounded-lg p-2 px-3.5 text-center min-w-[100px]">
                <span className="block text-[9px] text-slate-400 font-bold font-mono tracking-wider uppercase">Proyek Terpapar</span>
                <strong className="text-md text-[#002147] font-mono">{ganttData.projects.length}</strong>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2 px-3.5 text-center min-w-[100px]">
                <span className="block text-[9px] text-emerald-600/70 font-bold font-mono tracking-wider uppercase">Selesai 100%</span>
                <strong className="text-md text-emerald-700 font-mono">
                  {ganttData.projects.filter(p => p.physicalProgress === 100).length}
                </strong>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-2 px-3.5 text-center min-w-[100px]">
                <span className="block text-[9px] text-amber-600 font-bold font-mono tracking-wider uppercase">Konstruksi</span>
                <strong className="text-md text-amber-700 font-mono">
                  {ganttData.projects.filter(p => p.physicalProgress > 0 && p.physicalProgress < 100).length}
                </strong>
              </div>
            </div>
          </div>

          {/* Filtering and Query Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col md:flex-row items-center justify-between gap-4 font-sans">
            
            {/* Search tool block */}
            <div className="relative w-full md:w-80">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                <svg className="w-3.5 h-3.5 stroke-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Cari Proyek, Klien, atau Lokasi Lapangan..."
                value={ganttSearchQuery}
                onChange={(e) => setGanttSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-white rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            {/* Filter buttons control */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">Status Pekerjaan:</span>
              <div className="flex bg-white border border-slate-200 rounded-lg p-0.5 text-[10px] font-mono">
                {(["all", "planned", "ongoing", "completed"] as const).map((status) => {
                  const labels: Record<string, string> = {
                    all: "SEMUA",
                    planned: "PLANNED",
                    ongoing: "PROGRESSING",
                    completed: "SELESAI"
                  };
                  return (
                    <button
                      key={status}
                      onClick={() => setGanttProgressFilter(status)}
                      className={`px-3 py-1 rounded transition font-bold uppercase tracking-wider cursor-pointer ${
                        ganttProgressFilter === status
                          ? "bg-[#002147] text-white"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {labels[status]}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Gantt Timeline Board Grid Block */}
          {ganttData.projects.length > 0 ? (
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-3xs" id="gantt-board-container">
              
              <div className="overflow-x-auto scrollbar-thin selection:bg-[#D4AF37]/20">
                <div className="min-w-[1000px] flex flex-col divide-y divide-slate-200">
                  
                  {/* Timeline Header Row (Months tracking grid names) */}
                  <div className="flex bg-slate-50 font-mono text-[10px] font-bold text-slate-500 align-stretch select-none">
                    
                    {/* Left Column header */}
                    <div className="w-80 min-w-[320px] p-3.5 border-r border-slate-200 bg-slate-100 flex-shrink-0 flex items-center text-slate-600">
                      📋 INFORMASI DETIL KONTRAK PROGRAM
                    </div>

                    {/* Right Month columns map */}
                    <div className="flex-1 flex relative">
                      {ganttData.months.map((month, idx) => (
                        <div 
                          key={idx} 
                          className="flex-1 min-w-[90px] text-center p-3.5 border-r border-slate-200 relative flex items-center justify-center font-extrabold text-[#002147] tracking-wider"
                        >
                          {month.label}
                        </div>
                      ))}
                    </div>

                  </div>

                  {/* Actual Projects Schedule Bar mapping tracker */}
                  <div className="relative flex flex-col divide-y divide-slate-100">
                    
                    {/* Today's reference visual marker overlay */}
                    {todayPosition !== null && (
                      <div 
                        className="absolute top-0 bottom-0 border-l-2 border-dashed border-red-500 z-10 pointer-events-none"
                        style={{ 
                          left: `calc(320px + ${todayPosition}% - (${todayPosition}% * 320 / 100))`
                        }}
                      >
                        <div className="absolute top-1.5 -left-16 bg-red-600 text-white font-mono text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow-sm">
                          📍 HARI INI (5 JUNI)
                        </div>
                      </div>
                    )}

                    {ganttData.projects.map((proj) => {
                      const days = calculateDurationDays(proj.startDate, proj.endDate);
                      const isCompleted = proj.physicalProgress === 100;
                      const isOngoing = proj.physicalProgress > 0 && proj.physicalProgress < 100;

                      // Calculate positioning percentages
                      const { left, width } = getGanttPosition(proj.startDate, proj.endDate, ganttData.timelineStart, ganttData.timelineEnd);

                      // Design coloring palettes
                      let barBg = "bg-sky-50 border-sky-200";
                      let barFill = "bg-[#002147]";
                      let textColor = "text-sky-900";
                      let badgeBg = "bg-sky-50 text-sky-700 border-sky-100";
                      let statusText = "BELUM MULAI";

                      if (isCompleted) {
                        barBg = "bg-emerald-50 border-emerald-200";
                        barFill = "bg-emerald-600";
                        textColor = "text-emerald-900";
                        badgeBg = "bg-emerald-50 text-emerald-700 border-emerald-100";
                        statusText = "TERAMPUNG";
                      } else if (isOngoing) {
                        barBg = "bg-amber-50 border-amber-250";
                        barFill = "bg-[#D4AF37]";
                        textColor = "text-amber-900";
                        badgeBg = "bg-amber-50 text-amber-700 border-amber-100";
                        statusText = "LAPANGAN SPK";
                      }

                      return (
                        <div key={proj.id} className="flex items-stretch hover:bg-slate-50/50 transition group min-h-[64px]">
                          
                          {/* Row Left Description block */}
                          <div className="w-80 min-w-[320px] p-3.5 border-r border-slate-200 flex-shrink-0 flex flex-col justify-center space-y-1 bg-white group-hover:bg-slate-50/10">
                            
                            <div className="flex justify-between items-center gap-1.5">
                              <span className="text-[8px] border border-slate-250 bg-slate-100 py-0.5 px-1.5 rounded font-mono text-slate-500 font-black tracking-widest uppercase">
                                PROYEK #{proj.id.toUpperCase()}
                              </span>
                              <span className={`text-[8px] font-mono font-black uppercase py-0.5 px-2 rounded-full border ${badgeBg}`}>
                                {statusText} ({proj.physicalProgress}%)
                              </span>
                            </div>

                            <h4 className="text-xs font-black text-[#002147] line-clamp-1 font-sans">
                              {proj.name}
                            </h4>

                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                              <span className="truncate max-w-[155px] font-medium block">
                                🏢 {proj.client || "Client"}
                              </span>
                              <span className="font-extrabold text-[#D4AF37]">
                                {formatIDR(proj.contractValue)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono mt-0.5">
                              <span>📅 {new Date(proj.startDate).toLocaleDateString("id-ID", { month: "short", year: "numeric" })} - {new Date(proj.endDate).toLocaleDateString("id-ID", { month: "short", year: "numeric" })}</span>
                              <span className="font-bold text-slate-500">({days} HARI KERJA)</span>
                            </div>

                          </div>

                          {/* Row Right scheduling graphic board */}
                          <div className="flex-1 relative flex items-center select-none bg-slate-50/10 min-w-[680px]">
                            
                            {/* Visual grid column divider markings */}
                            <div className="absolute inset-0 flex pointer-events-none">
                              {ganttData.months.map((_, i) => (
                                <div key={i} className="flex-1 border-r border-slate-200/40 h-full py-0" />
                              ))}
                            </div>

                            {/* Scheduling Ribbon bar */}
                            <div 
                              className="absolute h-8 rounded-lg border flex items-center overflow-hidden shadow-3xs cursor-pointer transition duration-150 hover:scale-[1.01] hover:shadow-2xs"
                              style={{ 
                                left: `${left}%`, 
                                width: `${width}%` 
                              }}
                              onClick={() => {
                                // Select project, stop editing and refocus
                                setActiveProjectId(proj.id);
                                setActiveSubTab("dashboard");
                              }}
                              title={`Nama: ${proj.name}\nTgl Mulai: ${proj.startDate}\nTgl Selesai: ${proj.endDate}\nProgress Aktual: ${proj.physicalProgress}%\nTotal Durasi: ${days} Hari`}
                            >
                              
                              {/* Background default track bar template */}
                              <div className={`absolute inset-0 ${barBg} w-full h-full`} />

                              {/* Completed Filled Bar */}
                              <div 
                                className={`absolute h-full ${barFill} opacity-85 transition-all duration-350`}
                                style={{ width: `${proj.physicalProgress}%` }}
                              />

                              {/* Overlaid values inside scheduling bar */}
                              <div className={`absolute inset-0 flex justify-between items-center px-3 font-mono text-[9px] font-black z-5 truncate ${textColor}`}>
                                <span className="truncate whitespace-nowrap font-bold pr-1 select-all hover:underline">
                                  {proj.physicalProgress > 10 ? `${proj.physicalProgress}% Progress` : ""}
                                </span>
                                <span className="text-[8px] font-extrabold opacity-90 whitespace-nowrap hidden sm:inline">
                                  {width > 12 ? `${days} Hari` : ""}
                                </span>
                              </div>

                            </div>

                          </div>

                        </div>
                      );
                    })}

                  </div>

                </div>
              </div>

              {/* Informative Legend Summary bar */}
              <div className="bg-slate-50 p-3.5 px-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] font-mono text-slate-550">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-emerald-600 inline-block border border-emerald-700 shadow-3xs" />
                    <span>Telah Selesai (100%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-[#D4AF37] inline-block border border-amber-450 shadow-3xs" />
                    <span>Lembaga Konstruksi Lapangan</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-[#002147] inline-block border border-[#001733] shadow-3xs" />
                    <span>Perencanaan (Planned)</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 font-sans italic">
                  💡 Klik pada baris diagram untuk fokus &amp; mengubah data S-Curve proyek.
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center" id="gantt-empty-state">
              <Calendar className="w-8 h-8 text-slate-350 mx-auto mb-2" />
              <p className="text-slate-500 font-mono text-xs font-bold uppercase">Proyek tidak terdeteksi</p>
              <p className="text-slate-400 text-xs mt-1">Gunakan kata kunci berbeda atau matikan penyaring status yang aktif.</p>
              <button 
                onClick={() => { setGanttSearchQuery(""); setGanttProgressFilter("all"); }}
                className="mt-3.5 text-xs text-blue-600 hover:text-blue-800 font-bold border border-blue-200 bg-white p-1.5 px-3 rounded-lg shadow-4xs cursor-pointer font-mono"
              >
                Reset Setelan Filter
              </button>
            </div>
          )}

        </div>
      )}

      {activeSubTab === "map" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="projects-map-view-container">
          {/* Left Panel: Projects coordinate controller and coordinates editor */}
          <div className="lg:col-span-4 bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex flex-col space-y-4">
            <div className="pb-3 border-b border-slate-100 flex justify-between items-center whitespace-nowrap">
              <h3 className="text-sm font-black text-[#002147] uppercase font-mono tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#D4AF37]" />
                Pemetaan Geografis Proyek
              </h3>
              <button
                onClick={requestUserLocation}
                className="py-1 px-2.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#002147] font-mono text-[9px] font-bold uppercase transition cursor-pointer"
              >
                📡 Cek GPS Anda
              </button>
            </div>

            {geoError && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-mono p-2.5 rounded-lg">
                ⚠️ {geoError}
              </div>
            )}

            {userLocation && (
              <div className="bg-emerald-50 border border-emerald-250 text-emerald-900 text-[10.5px] font-mono p-2.5 rounded-lg flex items-center justify-between">
                <span>📍 GPS Terdeteksi ({userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)})</span>
                <span className="text-[8px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded animate-pulse">LIVE</span>
              </div>
            )}

            {/* Project List Selector */}
            <div className="space-y-2 flex-1 overflow-y-auto max-h-[360px] pr-1 scrollbar-thin">
              <span className="block text-[10px] text-slate-400 font-extrabold font-mono tracking-wider uppercase mb-1">
                DAFTAR LOKASI PORTFOLIO
              </span>
              
              {projects.map((proj) => {
                const isActive = proj.id === activeProjectId;
                const parsed = parseProjectLocation(proj.location);
                let distStr = "";
                if (userLocation) {
                  // Compute straight line distance in km (haversine formula)
                  const R = 6371; // km
                  const dLat = ((parsed.lat - userLocation.lat) * Math.PI) / 180;
                  const dLng = ((parsed.lng - userLocation.lng) * Math.PI) / 180;
                  const a =
                    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos((userLocation.lat * Math.PI) / 180) *
                      Math.cos((parsed.lat * Math.PI) / 180) *
                      Math.sin(dLng / 2) *
                      Math.sin(dLng / 2);
                  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                  const d = R * c;
                  distStr = `${d.toFixed(1)} km`;
                }

                return (
                  <div
                    key={proj.id}
                    className={`p-3 rounded-xl border transition flex flex-col space-y-1.5 cursor-pointer ${
                      isActive
                        ? "bg-[#002147]/5 border-[#002147]"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                    onClick={() => {
                      setActiveProjectId(proj.id);
                      if (mapInstance) {
                        mapInstance.setView([parsed.lat, parsed.lng], 10, { animate: true });
                      }
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[8px] font-mono font-bold bg-slate-100 py-0.5 px-2 rounded border border-slate-200">
                        #{proj.id.toUpperCase().slice(0, 8)}
                      </span>
                      <span
                        className={`text-[8px] font-mono font-extrabold px-1.5 py-0.5 rounded border ${
                          proj.physicalProgress === 100
                            ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                            : "bg-amber-50 border-amber-200 text-amber-950"
                        }`}
                      >
                        {proj.physicalProgress}% FISIK
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-[#002147] font-sans line-clamp-1">
                        {proj.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                        📍 {parsed.displayName}
                      </p>
                    </div>

                    <div className="text-[9px] text-slate-400 font-mono pt-1.5 border-t border-dashed border-slate-100 flex justify-between items-center">
                      <span>Lat: {parsed.lat.toFixed(4)}, Lng: {parsed.lng.toFixed(4)}</span>
                      {distStr && <span className="text-emerald-700 font-black">⚙️ {distStr} dari lokasi Anda</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Coordinates Alignment workflow */}
            {activeProj && (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] bg-[#002147] text-white p-1 rounded font-mono font-black py-0.5 px-1.5">ALAT PM</span>
                  <span className="text-xs font-bold text-[#002147] line-clamp-1">{activeProj.name}</span>
                </div>
                
                <p className="text-[10.5px] text-slate-500 leading-relaxed font-sans">
                  Geser pin letak resmi proyek dengan menunjuk langsung di peta untuk ketepan penanganan K3.
                </p>

                {isEditingCoords ? (
                  <div className="space-y-2 pt-1 border-t border-slate-200">
                    <p className="text-[10.5px] font-mono font-bold text-amber-800 bg-amber-50 rounded-md p-2 border border-amber-200 animate-pulse">
                      👉 SILAKAN KLIK DI MANA SAJA PADA MAP UNTUK MEMILIH TITIK PROYEK!
                    </p>
                    
                    {selectedMapCoords && (
                      <div className="bg-slate-100 p-2.5 rounded-lg border border-slate-250 font-mono text-[10.5px]">
                        <span className="block font-bold text-slate-500 uppercase text-[9px] tracking-wider mb-0.5">KOORDINAT TERPILIH :</span>
                        <div className="flex justify-between items-center text-slate-700">
                          <span>Latitude: {selectedMapCoords.lat.toFixed(5)}</span>
                          <span>Longitude: {selectedMapCoords.lng.toFixed(5)}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        onClick={() => {
                          setIsEditingCoords(false);
                          setSelectedMapCoords(null);
                        }}
                        className="py-1 px-2.5 border border-slate-250 bg-white hover:bg-slate-50 text-slate-600 font-mono text-[10px] font-black rounded-lg transition uppercase tracking-wider cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        onClick={async () => {
                          if (selectedMapCoords) {
                            const parsed = parseProjectLocation(activeProj.location);
                            const updatedLocation = `${selectedMapCoords.lat.toFixed(5)}, ${selectedMapCoords.lng.toFixed(5)} | ${parsed.displayName}`;
                            await onUpdateProject(activeProj.id, { location: updatedLocation });
                            setIsEditingCoords(false);
                            setSelectedMapCoords(null);
                          }
                        }}
                        disabled={!selectedMapCoords}
                        className="py-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[10px] font-black rounded-lg transition uppercase tracking-wider disabled:opacity-40 cursor-pointer"
                      >
                        Simpan Letak Baru
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsEditingCoords(true);
                      setSelectedMapCoords(null);
                    }}
                    disabled={!canModify}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-mono font-black text-[10.5px] uppercase tracking-wider transition disabled:opacity-40 cursor-pointer"
                  >
                    👷 Kalibrasi Letak Koordinat
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Panel: The interactive lightweight map container */}
          <div className="lg:col-span-8 bg-white border border-slate-200 shadow-sm rounded-xl p-3 flex flex-col h-[520px] lg:h-auto min-h-[500px]">
            <div className="flex items-center justify-between px-2 pb-2.5 border-b border-slate-100 mb-3">
              <span className="text-[10px] text-slate-400 font-black font-mono tracking-wider uppercase">
                LAYOUT GEOSPASIAL MILITER KONTRAKTOR PRO (VOYAGER CORE-ENGINES)
              </span>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[9px] font-mono text-emerald-600 font-bold uppercase">SISTEM AKTIF</span>
              </div>
            </div>

            {/* Leaflet map object */}
            <div className="flex-1 relative bg-slate-50 rounded-lg overflow-hidden border border-slate-100 flex items-center justify-center">
              {!leafletLoaded && (
                <div className="text-center font-mono text-xs text-slate-400 space-y-2 p-6 z-10">
                  <div className="w-6 h-6 border-2 border-t-transparent border-[#002147] rounded-full animate-spin mx-auto mb-2"></div>
                  <p>Memasangkan Peta Kartografi Satelit...</p>
                </div>
              )}
              
              <div 
                ref={mapRef} 
                id="leaflet-map-root" 
                className={`absolute inset-0 w-full h-full z-0 transition-opacity duration-300 \${leafletLoaded ? 'opacity-100' : 'opacity-0'}`} 
              />
            </div>
          </div>
        </div>
      )}

      {/* 2.6 DEDICATED FINANCIAL OVERLAY MODAL */}
      {isFinancialModalOpen && activeProj && (
        <div className="fixed inset-0 bg-[#001733]/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto" id="financial-management-modal">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-[#002147] p-4 text-white flex justify-between items-center border-b border-[#D4AF37]">
              <div>
                <h3 className="text-xs font-black font-mono uppercase tracking-widest text-[#D4AF37]">
                  KEUANGAN PROYEK (FINANCIAL MANAGEMENT PORTAL)
                </h3>
                <h4 className="text-xs font-bold font-sans mt-0.5 max-w-[500px] truncate">
                  {activeProj.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsFinancialModalOpen(false);
                  setCoId(null);
                  setPtId(null);
                }}
                className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer text-sm font-bold font-mono"
              >
                ✕ Tutup
              </button>
            </div>

            {/* Sub-tab selection */}
            <div className="flex bg-slate-50 border-b border-slate-250/60 font-mono text-[10.5px]">
              <button
                type="button"
                onClick={() => setActiveFinanceTab("change_orders")}
                className={`flex-1 py-3 text-center font-bold uppercase border-b-2 transition ${
                  activeFinanceTab === "change_orders"
                    ? "border-[#002147] text-[#002147] bg-white text-xs"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                🛠️ Addendum Kontrak (Change Orders)
              </button>
              <button
                type="button"
                onClick={() => setActiveFinanceTab("payment_terms")}
                className={`flex-1 py-3 text-center font-bold uppercase border-b-2 transition ${
                  activeFinanceTab === "payment_terms"
                    ? "border-[#002147] text-[#002147] bg-white text-xs"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                📅 Termin Pembayaran (Payment Milestones)
              </button>
            </div>

            {/* Calculations summaries live */}
            {(() => {
              const changeOrdersList = (() => {
                if (!activeProj.changeOrders) return [];
                try { return JSON.parse(activeProj.changeOrders) as ChangeOrder[]; } catch { return []; }
              })();
              const coTotalSum = changeOrdersList
                .filter(c => c.status === "Disetujui")
                .reduce((sum, cur) => sum + cur.amount, 0);
              const totalContractVal = activeProj.contractValue + coTotalSum;

              const paymentTermsList = (() => {
                if (!activeProj.paymentTerms) {
                  const val = activeProj.contractValue;
                  return [
                    { id: "term-1", termName: "Down Payment (Uang Muka Kerja)", percentage: 20, amount: Math.round(val * 0.2), status: "Lunas", dueDate: activeProj.startDate },
                    { id: "term-2", termName: "Termin I (Progress Fisik 50%)", percentage: 30, amount: Math.round(val * 0.3), status: "Belum Tagih", dueDate: activeProj.endDate },
                    { id: "term-3", termName: "Termin II (Progress Fisik 80%)", percentage: 30, amount: Math.round(val * 0.3), status: "Belum Tagih", dueDate: activeProj.endDate },
                    { id: "term-4", termName: "Termin Akhir (Serah Terima 100%)", percentage: 20, amount: Math.round(val * 0.2), status: "Belum Tagih", dueDate: activeProj.endDate }
                  ] as PaymentTerm[];
                }
                try { return JSON.parse(activeProj.paymentTerms) as PaymentTerm[]; } catch { return []; }
              })();

              const billedInvoiceSum = paymentTermsList
                .filter(pt => pt.status === "Sudah Tagih" || pt.status === "Lunas")
                .reduce((sum, cur) => sum + cur.amount, 0);

              const paidInvoiceSum = paymentTermsList
                .filter(pt => pt.status === "Lunas")
                .reduce((sum, cur) => sum + cur.amount, 0);

              return (
                <div className="bg-slate-100 p-3.5 px-5 font-mono grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-slate-205 text-slate-700 text-[10px]">
                  <div>
                    <span className="text-slate-400 block uppercase font-bold text-[8.5px]">NILAI KONTRAK TER-ADDENDUM</span>
                    <strong className="text-[#002147] text-xs font-bold block mt-0.5">
                      {formatIDR(totalContractVal)}
                    </strong>
                    <span className="text-[9px] text-slate-500">
                      Nilai Awal: {formatIDR(activeProj.contractValue)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase font-bold text-[8.5px]">CASH REALIZATION (TUNTAS)</span>
                    <strong className="text-emerald-600 text-xs font-bold block mt-0.5">
                      {formatIDR(paidInvoiceSum)}
                    </strong>
                    <span className="text-[9px] text-slate-500">
                      Prog. Inkaso: {((paidInvoiceSum / (totalContractVal || 1)) * 100).toFixed(1)}% Kontrak
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase font-bold text-[8.5px]">OUTSTANDING BILL (AKRUAL)</span>
                    <strong className="text-blue-600 text-xs font-bold block mt-0.5">
                      {formatIDR(billedInvoiceSum - paidInvoiceSum)}
                    </strong>
                    <span className="text-[9px] text-slate-500">
                      Outstanding Tagih: {formatIDR(billedInvoiceSum - paidInvoiceSum)}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Tab content bodies */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              {activeFinanceTab === "change_orders" ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="change-orders-tab-content">
                  {/* Left component: Editor view if canModify */}
                  {canModify ? (
                    <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                      <h4 className="text-[10.5px] font-black text-[#002147] font-mono uppercase tracking-wider">
                        {coId ? "✏️ Perbarui Addendum" : "➕ Daftarkan Addendum Baru"}
                      </h4>

                      <form onSubmit={handleSaveChangeOrder} className="space-y-3 font-sans text-xs">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-550 font-mono uppercase block">Judul Addendum / Pekerjaan Tambah:</label>
                          <input
                            required
                            type="text"
                            placeholder="E.g., Galian Tambahan Pier 4"
                            value={coTitle}
                            onChange={(e) => setCoTitle(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded p-2 text-xs focus:outline-none focus:border-[#002147]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-550 font-mono uppercase block">Keterangan Teknis / Scope:</label>
                          <textarea
                            placeholder="Tuliskan latar belakang teknis penambahan pekerjaan..."
                            value={coDesc}
                            onChange={(e) => setCoDesc(e.target.value)}
                            rows={3}
                            className="w-full bg-white border border-slate-200 rounded p-2 text-xs focus:outline-none focus:border-[#002147]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-550 font-mono uppercase block">Nominal Dampak Biaya (IDR):</label>
                          <input
                            required
                            type="number"
                            placeholder="Dampak Biaya (Gunakan minus untuk Deductions)"
                            value={coAmount || ""}
                            onChange={(e) => setCoAmount(Number(e.target.value))}
                            className="w-full bg-white border border-slate-200 rounded p-2 text-xs focus:outline-none focus:border-[#002147] font-mono text-slate-800"
                          />
                          <p className="text-[8.5px] italic text-slate-400 font-sans mt-0.5">Note: Tanda positif (+) untuk Pekerjaan Tambah, tanda negatif (-) untuk Pekerjaan Kurang Kontrak.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-550 font-mono uppercase block">Status:</label>
                            <select
                              value={coStatus}
                              onChange={(e) => setCoStatus(e.target.value as any)}
                              className="w-full bg-white border border-slate-200 rounded p-2 text-xs focus:outline-none focus:border-[#002147] font-sans"
                            >
                              <option value="Draft">Draft</option>
                              <option value="Disetujui">Disetujui</option>
                              <option value="Ditolak">Ditolak</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-550 font-mono uppercase block">Tanggal Penandatanganan:</label>
                            <input
                              type="date"
                              required
                              value={coDate}
                              onChange={(e) => setCoDate(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded p-2 text-xs focus:outline-none focus:border-[#002147] font-mono"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-2 font-mono">
                          {coId && (
                            <button
                              type="button"
                              onClick={() => {
                                setCoId(null);
                                setCoTitle("");
                                setCoDesc("");
                                setCoAmount(0);
                                setCoStatus("Draft");
                                setCoDate("");
                              }}
                              className="bg-white border border-slate-200 text-slate-500 py-1.5 px-3 rounded text-[10px] font-black cursor-pointer uppercase tracking-wider"
                            >
                              Batal
                            </button>
                          )}
                          <button
                            type="submit"
                            className="bg-[#002147] hover:bg-[#001733] text-[#D4AF37] hover:text-white py-1.5 px-4 rounded text-[10px] font-black uppercase tracking-wider cursor-pointer"
                          >
                            {coId ? "Simpan Perubahan" : "Daftarkan CO"}
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-4 text-center py-10 font-sans text-xs text-slate-400">
                      🚫 Peran akun Anda ({userRole}) tidak memiliki otorisasi untuk menambah atau memutifikasi Addendum/Change Orders.
                    </div>
                  )}

                  {/* Right Component: List of Existing COs */}
                  <div className="lg:col-span-8 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <h4 className="text-[10.5px] font-black text-[#002147] font-mono uppercase tracking-wider">
                          Daftar Akumulasi Addendum Lapangan (Change Orders)
                        </h4>
                        <span className="text-[9px] font-mono font-bold bg-[#002147]/5 text-[#002147] py-0.5 px-2 rounded-full border border-slate-200">
                          {(() => {
                            try { return (JSON.parse(activeProj.changeOrders || "[]") as ChangeOrder[]).length; } catch { return 0; }
                          })()} CO
                        </span>
                      </div>

                      <div className="overflow-x-auto mt-2.5">
                        <table className="w-full text-left font-sans text-xs border border-slate-200/60 rounded-xl overflow-hidden shadow-3xs">
                          <thead className="bg-[#002147]/5 font-mono text-[9px] text-[#002147]">
                            <tr className="border-b border-slate-200">
                              <th className="p-3">Keterangan / Deskripsi CO</th>
                              <th className="p-3 text-center">Tanggal</th>
                              <th className="p-3 text-right">Nilai Biaya (IDR)</th>
                              <th className="p-3 text-center">Status</th>
                              {canModify && <th className="p-3 text-center">Aksi</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {(() => {
                              const list = (() => {
                                if (!activeProj.changeOrders) return [];
                                try { return JSON.parse(activeProj.changeOrders) as ChangeOrder[]; } catch { return []; }
                              })();

                              if (list.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan={canModify ? 5 : 4} className="p-8 text-center text-slate-400 italic">
                                      Tidak ada data Addendum / Change Order terdaftar di kontrak ini.
                                    </td>
                                  </tr>
                                );
                              }

                              return list.map((co) => (
                                <tr key={co.id} className="hover:bg-slate-50/50 transition">
                                  <td className="p-3">
                                    <strong className="text-[#002147] font-bold block text-[11px]">{co.title}</strong>
                                    <p className="text-[10px] text-slate-400 italic mt-0.5 line-clamp-2 max-w-[280px]">{co.description}</p>
                                  </td>
                                  <td className="p-3 text-center font-mono text-[10px] text-slate-500 whitespace-nowrap">
                                    {new Date(co.date).toLocaleDateString("id-ID")}
                                  </td>
                                  <td className={`p-3 text-right font-mono font-bold whitespace-nowrap ${co.amount >= 0 ? "text-green-600" : "text-rose-600"}`}>
                                    {co.amount >= 0 ? "+" : ""}{formatIDR(co.amount)}
                                  </td>
                                  <td className="p-3 text-center whitespace-nowrap">
                                    <span className={`inline-block py-0.5 px-2 rounded-full font-mono text-[8.5px] font-bold uppercase border ${
                                      co.status === "Disetujui"
                                        ? "bg-emerald-50 border-emerald-250 text-emerald-800"
                                        : co.status === "Ditolak"
                                        ? "bg-rose-50 border-rose-250 text-rose-800"
                                        : "bg-slate-50 border-slate-250 text-slate-800"
                                    }`}>
                                      {co.status}
                                    </span>
                                  </td>
                                  {canModify && (
                                    <td className="p-3 text-center whitespace-nowrap">
                                      <div className="flex gap-1.5 justify-center">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setCoId(co.id);
                                            setCoTitle(co.title);
                                            setCoDesc(co.description);
                                            setCoAmount(co.amount);
                                            setCoStatus(co.status);
                                            setCoDate(co.date);
                                          }}
                                          className="text-xs text-blue-500 p-1 hover:bg-blue-50 rounded"
                                          title="Sunting Addendum"
                                        >
                                          ✏️
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (window.confirm("Hapus addendum ini?")) {
                                              handleDeleteChangeOrder(co.id);
                                            }
                                          }}
                                          className="text-xs text-red-500 p-1 hover:bg-red-50 rounded"
                                          title="Hapus Addendum"
                                        >
                                          🗑️
                                        </button>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              ));
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="bg-blue-50/50 border border-blue-200/60 p-3 rounded-lg leading-relaxed text-[10px] text-blue-800 font-sans">
                      💡 <strong>Dampak Terintegrasi RAP:</strong> Setiap addendum yang berstatus <strong>Disetujui (Approved)</strong> akan ditambahkan secara proporsional ke dalam plavon RAP untuk proyek ini (+85% dari nilai addendum sebagai estimasi biaya rill lapangan), merubah limit bar visualisasi secara otomatis.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="payment-terms-tab-content">
                  {/* Left component: Editor view if canModify */}
                  {canModify ? (
                    <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                      <h4 className="text-[10.5px] font-black text-[#002147] font-mono uppercase tracking-wider">
                        {ptId ? "✏️ Perbarui Termin Pembayaran" : "➕ Daftarkan Termin Pembayaran"}
                      </h4>

                      <form onSubmit={handleSavePaymentTerm} className="space-y-4 font-sans text-xs">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-550 font-mono uppercase block">Nama Termin Milestone:</label>
                          <input
                            required
                            type="text"
                            placeholder="E.g., Termin I (Progress Fisik 30%)"
                            value={ptName}
                            onChange={(e) => setPtName(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded p-2 text-xs focus:outline-none focus:border-[#002147]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-550 font-mono uppercase block">Persentase Nilai Kontrak (%):</label>
                          <input
                            required
                            type="number"
                            min={1}
                            max={100}
                            placeholder="Contoh: 20"
                            value={ptPercentage || ""}
                            onChange={(e) => setPtPercentage(Math.min(100, Math.max(1, Number(e.target.value))))}
                            className="w-full bg-white border border-slate-200 rounded p-2 text-xs focus:outline-none focus:border-[#002147] font-mono"
                          />
                          <p className="text-[8.5px] text-slate-400 mt-1">
                            {(() => {
                              const changeOrders = activeProj.changeOrders ? JSON.parse(activeProj.changeOrders) : [];
                              const approvedCOTotal = changeOrders
                                .filter((co: any) => co.status === "Disetujui")
                                .reduce((sum: number, co: any) => sum + co.amount, 0);
                              const adjustedContractVal = activeProj.contractValue + approvedCOTotal;
                              const valueOfTerm = Math.round(adjustedContractVal * (ptPercentage / 100));

                              return (
                                <span>Perhitungan Hasil: <strong>{formatIDR(valueOfTerm)}</strong> (Dihitung dari Nilai Akhir Kontrak)</span>
                              );
                            })()}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-550 font-mono uppercase block">Status Termin:</label>
                            <select
                              value={ptStatus}
                              onChange={(e) => setPtStatus(e.target.value as any)}
                              className="w-full bg-white border border-slate-200 rounded p-2 text-xs focus:outline-none focus:border-[#002147] font-sans"
                            >
                              <option value="Belum Tagih">Belum Tagih</option>
                              <option value="Sudah Tagih">Sudah Tagih (Pending Lunas)</option>
                              <option value="Lunas">Lunas</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-550 font-mono uppercase block">Jatuh Tempo (Target):</label>
                            <input
                              type="date"
                              required
                              value={ptDueDate}
                              onChange={(e) => setPtDueDate(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded p-2 text-xs focus:outline-none focus:border-[#002147] font-mono"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-2 font-mono">
                          {ptId && (
                            <button
                              type="button"
                              onClick={() => {
                                setPtId(null);
                                setPtName("");
                                setPtPercentage(0);
                                setPtDueDate("");
                                setPtStatus("Belum Tagih");
                              }}
                              className="bg-white border border-slate-200 text-slate-500 py-1.5 px-3 rounded text-[10px] font-black cursor-pointer uppercase tracking-wider"
                            >
                              Batal
                            </button>
                          )}
                          <button
                            type="submit"
                            className="bg-[#002147] hover:bg-[#001733] text-[#D4AF37] hover:text-white py-1.5 px-4 rounded text-[10px] font-black uppercase tracking-wider cursor-pointer"
                          >
                            {ptId ? "Simpan Perubahan" : "Daftarkan Termin"}
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-4 text-center py-10 font-sans text-xs text-slate-400">
                      🚫 Peran akun Anda ({userRole}) tidak memiliki otorisasi untuk menambah atau merubah status Termin Kontrak.
                    </div>
                  )}

                  {/* Right Component: List of Existing PTs */}
                  <div className="lg:col-span-8 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <h4 className="text-[10.5px] font-black text-[#002147] font-mono uppercase tracking-wider">
                            Rencana Alokasi &amp; Status Milestone Termin Kontrak
                          </h4>
                        </div>
                        
                        <div className="flex gap-2 font-mono">
                          {canModify && !activeProj.paymentTerms && (
                            <button
                              type="button"
                              onClick={async () => {
                                // Populate default items automatically to showcase data
                                const val = activeProj.contractValue;
                                const defaultPTs: PaymentTerm[] = [
                                  { id: "term-1", termName: "Down Payment (Uang Muka Kerja)", percentage: 20, amount: Math.round(val * 0.2), status: "Lunas", dueDate: activeProj.startDate },
                                  { id: "term-2", termName: "Termin I (Progress Fisik 50%)", percentage: 30, amount: Math.round(val * 0.3), status: "Belum Tagih", dueDate: activeProj.endDate },
                                  { id: "term-3", termName: "Termin II (Progress Fisik 80%)", percentage: 30, amount: Math.round(val * 0.3), status: "Belum Tagih", dueDate: activeProj.endDate },
                                  { id: "term-4", termName: "Termin Akhir (Serah Terima 100%)", percentage: 20, amount: Math.round(val * 0.2), status: "Belum Tagih", dueDate: activeProj.endDate }
                                ];
                                try {
                                  await onUpdateProject(activeProj.id, { paymentTerms: JSON.stringify(defaultPTs) });
                                } catch (err) { console.error(err); }
                              }}
                              className="py-0.5 px-2 bg-amber-50 border border-amber-200 rounded text-[#002147] hover:bg-amber-100 font-mono text-[8.5px] font-black transition cursor-pointer"
                              title="Hydrate default layout for construction"
                            >
                              ⚡ Reset Termin Standard
                            </button>
                          )}
                          
                          <span className="text-[9px] font-mono font-bold bg-[#002147]/5 text-[#002147] py-0.5 px-2 rounded-full border border-slate-200 inline-block">
                            {(() => {
                              const list = activeProj.paymentTerms ? JSON.parse(activeProj.paymentTerms) : [];
                              return list.length || 4; // default terms fallback
                            })()} Milestones
                          </span>
                        </div>
                      </div>

                      <div className="overflow-x-auto mt-2.5">
                        <table className="w-full text-left font-sans text-xs border border-slate-200/60 rounded-xl overflow-hidden shadow-3xs">
                          <thead className="bg-[#002147]/5 font-mono text-[9px] text-[#002147]">
                            <tr className="border-b border-slate-200">
                              <th className="p-3">Nama Termin / Milestone</th>
                              <th className="p-3 text-center">Bobot Kontrak</th>
                              <th className="p-3 text-right">Nilai Tagihan (IDR)</th>
                              <th className="p-3 text-center">Jatuh Tempo</th>
                              <th className="p-3 text-center">Status</th>
                              {canModify && <th className="p-3 text-center">Aksi</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {(() => {
                              const list = (() => {
                                if (!activeProj.paymentTerms) {
                                  // Live representation of standard fallbacks in UI
                                  const val = activeProj.contractValue;
                                  return [
                                    { id: "term-1", termName: "Down Payment (Uang Muka Kerja)", percentage: 20, amount: Math.round(val * 0.2), status: "Lunas", dueDate: activeProj.startDate },
                                    { id: "term-2", termName: "Termin I (Progress Fisik 50%)", percentage: 30, amount: Math.round(val * 0.3), status: "Belum Tagih", dueDate: activeProj.endDate },
                                    { id: "term-3", termName: "Termin II (Progress Fisik 80%)", percentage: 30, amount: Math.round(val * 0.3), status: "Belum Tagih", dueDate: activeProj.endDate },
                                    { id: "term-4", termName: "Termin Akhir (Serah Terima 100%)", percentage: 20, amount: Math.round(val * 0.2), status: "Belum Tagih", dueDate: activeProj.endDate }
                                  ] as PaymentTerm[];
                                }
                                try { return JSON.parse(activeProj.paymentTerms) as PaymentTerm[]; } catch { return []; }
                              })();

                              return list.map((pt) => {
                                // recalculate amount based on possible active contract change orders
                                const changeOrders = activeProj.changeOrders ? JSON.parse(activeProj.changeOrders) : [];
                                const approvedCOTotal = changeOrders
                                  .filter((co: any) => co.status === "Disetujui")
                                  .reduce((sum: number, co: any) => sum + co.amount, 0);
                                const adjustedContractVal = activeProj.contractValue + approvedCOTotal;
                                const calculatedAmount = Math.round(adjustedContractVal * (pt.percentage / 100));

                                return (
                                  <tr key={pt.id} className="hover:bg-slate-50/50 transition">
                                    <td className="p-3">
                                      <strong className="text-[#002147] font-bold block text-[11px]">{pt.termName}</strong>
                                    </td>
                                    <td className="p-3 text-center font-mono font-bold text-slate-800 text-[10.5px]">
                                      {pt.percentage}%
                                    </td>
                                    <td className="p-3 text-right font-mono font-bold text-slate-800 text-[10.5px]">
                                      {formatIDR(calculatedAmount)}
                                    </td>
                                    <td className="p-3 text-center font-mono text-[10px] text-slate-500 whitespace-nowrap">
                                      {new Date(pt.dueDate).toLocaleDateString("id-ID")}
                                    </td>
                                    <td className="p-3 text-center whitespace-nowrap">
                                      <span className={`inline-block py-0.5 px-2 rounded-full font-mono text-[8.5px] font-bold uppercase border ${
                                        pt.status === "Lunas"
                                          ? "bg-emerald-50 border-emerald-250 text-emerald-800"
                                          : pt.status === "Sudah Tagih"
                                          ? "bg-blue-50 border-blue-250 text-blue-800"
                                          : "bg-slate-50 border-slate-250 text-slate-800"
                                      }`}>
                                        {pt.status}
                                      </span>
                                    </td>
                                    {canModify && (
                                      <td className="p-3 text-center whitespace-nowrap">
                                        <div className="flex gap-1.5 justify-center">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setPtId(pt.id);
                                              setPtName(pt.termName);
                                              setPtPercentage(pt.percentage);
                                              setPtDueDate(pt.dueDate);
                                              setPtStatus(pt.status);
                                            }}
                                            className="text-xs text-blue-500 p-1 hover:bg-blue-50 rounded"
                                            title="Sunting Termin"
                                          >
                                            ✏️
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (window.confirm("Hapus termin pembayaran ini?")) {
                                                handleDeletePaymentTerm(pt.id);
                                              }
                                            }}
                                            className="text-xs text-red-500 p-1 hover:bg-red-50 rounded"
                                            title="Hapus Termin"
                                          >
                                            🗑️
                                          </button>
                                        </div>
                                      </td>
                                    )}
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="bg-amber-50/50 border border-amber-200/60 p-3 rounded-lg leading-relaxed text-[10px] text-[#002147] font-sans">
                      💡 <strong>Aspek Sinkronisasi Progress:</strong> Total penagihan termin mengontrol kesehatan cashflow serta realisasi kas masuk yang langsung dilaporkan pada dashboard portofolio utama.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-3.5 px-5 border-t border-slate-205 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsFinancialModalOpen(false);
                  setCoId(null);
                  setPtId(null);
                }}
                className="py-1.5 px-5 rounded-lg bg-[#002147] hover:bg-[#001733] text-white text-xs font-bold font-mono uppercase tracking-wider transition cursor-pointer"
              >
                Selesai &amp; Sinkronisasi Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
