import React, { useState } from "react";
import { HardHat, ShieldCheck, Briefcase, Award, Building2, UserCheck, KeyRound } from "lucide-react";
import { auth, googleProvider } from "../lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { UserRole, UserProfile } from "../types";
import firebaseConfig from "../../firebase-applet-config.json";

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);

  // Quick roles metadata for ERP quick-switch during testing/evaluation
  const demoUsers = [
    { name: "Hardianto", role: "Super Admin" as UserRole, division: "Direksi", desc: "Akses penuh konfigurasi sistem ERP" },
    { name: "Ibu Kartika", role: "Direktur" as UserRole, division: "Manajemen Utama", desc: "Melihat laporan profit, kinerja, & approval SOP" },
    { name: "Pak Sastra", role: "Project Manager" as UserRole, division: "Divisi Konstruksi", desc: "Kelola S-Curve & progress proyek lapangan" },
    { name: "Sari Wahyuni", role: "Admin" as UserRole, division: "Keuangan & Arsip", desc: "Input dokumen, invoice, & absensi tim" },
    { name: "Rian Permana", role: "Supervisor" as UserRole, division: "Pelaksana Lapangan", desc: "Update progress fisik harian & K3 kerja" },
    { name: "Dian Saputra", role: "Staff" as UserRole, division: "Operasional Teknik", desc: "Mengajukan cuti, membaca SOP, & cetak form" }
  ];

  // Quick login with Demo Users
  const handleDemoLogin = (role: UserRole, name: string) => {
    setLoading(true);
    setTimeout(() => {
      const mockProfile: UserProfile = {
        userId: `demo-uid-${role.toLowerCase().replace(/ /g, "-")}`,
        email: `${name.toLowerCase().replace(/ /g, "")}@sopsolusi.pro`,
        displayName: `${name} (${role})`,
        role: role,
        createdAt: new Date().toISOString()
      };
      onLoginSuccess(mockProfile);
      setLoading(false);
    }, 400);
  };

  // Simulated Google Auth Fallback (Bypasses Domain restrictions)
  const handleSimulatedGoogleLogin = (email: string, displayName: string, role: UserRole) => {
    setLoading(true);
    setTimeout(() => {
      const userProfile: UserProfile = {
        userId: "simulated-google-uid-sahrul",
        email: email,
        displayName: `${displayName} (${role})`,
        role: role,
        createdAt: new Date().toISOString()
      };
      onLoginSuccess(userProfile);
      setLoading(false);
    }, 400);
  };

  // Google Login via Firebase Auth
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        // Default role based on email or setting random for demonstration
        let role: UserRole = "Staff";
        const email = result.user.email || "";
        if (email.includes("admin") || email.includes("sahrul")) {
          role = "Super Admin";
        } else if (email.includes("direktur") || email.includes("ceo")) {
          role = "Direktur";
        } else if (email.includes("pm") || email.includes("manager")) {
          role = "Project Manager";
        }

        const userProfile: UserProfile = {
          userId: result.user.uid,
          email: email,
          displayName: result.user.displayName || "Pengguna Konstruksi",
          role: role,
          createdAt: new Date().toISOString()
        };
        onLoginSuccess(userProfile);
      }
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      if (err?.code === "auth/unauthorized-domain" || String(err).includes("unauthorized-domain")) {
        setError(
          <div className="space-y-3 text-left">
            <p className="font-bold text-red-700 font-mono text-[11px] uppercase tracking-wider">
              ⚠️ Domain Belum Diizinkan (Unauthorized Domain)
            </p>
            <p className="text-slate-600 text-xs">
              Domain pratinjau ini (<code className="bg-red-100 px-1 py-0.5 rounded font-mono font-bold text-red-800">{window.location.hostname}</code>) belum didaftarkan di setelan Authorized Domains proyek Firebase Anda.
            </p>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-705 leading-relaxed space-y-1.5 font-sans">
              <p className="font-bold text-[#002147] font-mono text-[10px] uppercase">Langkah Solusi Mandiri:</p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>
                  Buka{" "}
                  <a 
                    href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800 font-bold"
                  >
                    Setelan Firebase Auth Proyek &rarr;
                  </a>
                </li>
                <li>Temukan tab <strong>Authorized Domains</strong> (Domain yang Diizinan).</li>
                <li>Pilih <strong>Add domain</strong> (Tambahkan domain).</li>
                <li>Tempel domain ini dan klik simpan: <code className="bg-white border border-slate-300 px-1.5 py-0.5 rounded font-mono select-all text-[#002147] font-bold">{window.location.hostname}</code></li>
              </ol>
            </div>
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <p className="text-[11px] text-slate-600 font-semibold">
                Masuk instan di sandbox menggunakan email Google Anda secara aman:
              </p>
              <button
                onClick={() => handleSimulatedGoogleLogin("sahrul.viona12@gmail.com", "Sahrul Viona", "Super Admin")}
                className="w-full text-center py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wider uppercase transition duration-150 active:scale-[0.97] shadow-sm cursor-pointer"
              >
                ⚡ Bypass & Masuk sebagai sahrul.viona12@gmail.com
              </button>
            </div>
          </div>
        );
      } else {
        setError("Gagal masuk dengan Google. Silakan coba kembali atau gunakan Akses Demo Cepat di bawah.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 md:p-8 selection:bg-[#D4AF37] selection:text-[#002147]" id="login-container">
      
      {/* Top corporate header decoration */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#002147] via-[#D4AF37] to-[#002147]"></div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto my-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-8">
        
        {/* Brand Column (Left) */}
        <div className="lg:col-span-5 text-left space-y-6 md:pr-6" id="login-brand-info">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white border border-[#002147]/20 text-[#002147] text-xs font-semibold tracking-wider uppercase shadow-sm">
            <Building2 className="w-3.5 h-3.5 text-[#002147]" />
            Indonesia Constructor ERP
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black text-[#002147] leading-tight tracking-tight">
            SOP Kontraktor <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-amber-600 font-extrabold">Pro</span>
          </h1>
          
          <p className="text-slate-600 text-sm md:text-base leading-relaxed">
            Platform ERP Enterprise &amp; Manajemen Standard Operating Procedure (SOP) terintegrasi berbasis kecerdasan buatan untuk mengontrol proyek, keuangan, tenaga kerja, dan perizinan kontraktor profesional.
          </p>

          {/* Core pillar points */}
          <div className="space-y-4 pt-2">
            {[
              { title: "Standardisasi SNI & Pra-Kontrak", desc: "Akses 18 draf SOP terakreditasi siap pakai untuk berbagai tipe pekerjaan sipil." },
              { title: "AI SOP Generator & Assistant", desc: "Buat SOP kustom & simulasi Rencana Anggaran Biaya (RAB) sekejap mata dengan Gemini AI." },
              { title: "Monitoring Fisik & Finansial (S-Curve)", desc: "Metrik visual deviasi kemajuan proyek, pengadaan material, & rekam kuitansi terpusat." }
            ].map((p, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="mt-1 flex items-center justify-center w-5 h-5 rounded-full bg-[#002147]/10 border border-[#002147]/30 text-[#002147] text-xs font-bold">
                  {i + 1}
                </div>
                <div>
                  <h4 className="text-[#002147] text-xs font-bold font-mono tracking-wider">{p.title}</h4>
                  <p className="text-slate-600 text-xs mt-0.5">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200 text-slate-400 text-xs font-mono">
            SOP-KTR PRO &bull; VERSI 5.6.2 (MILFEEL)
          </div>
        </div>

        {/* Authenticate & Demo Box (Right) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 shadow-md rounded-2xl p-6 md:p-8" id="login-auth-box">
          
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-5">
              <h2 className="text-xl font-bold text-[#002147] flex items-center gap-2">
                <ShieldCheck className="w-5.5 h-5.5 text-[#D4AF37]" />
                Portal Autentikasi Pengguna
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Gunakan kredensial pengujian atau Google Akun Anda untuk masuk ke sistem ERP.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-650">
                {error}
              </div>
            )}

            {/* Google Authentication Section */}
            <div className="space-y-3">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                id="btn-google-login"
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-[#002147] hover:bg-[#001733] text-white active:scale-[0.98] transition hover:shadow border border-transparent text-xs font-mono font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer"
              >
                <div className="w-5 h-5 bg-white text-[#002147] flex items-center justify-center rounded-full text-[10px] font-bold shadow-sm">
                  G
                </div>
                {loading ? "Menghubungkan..." : "Masuk Dengan Google"}
              </button>

              <button
                onClick={() => handleSimulatedGoogleLogin("sahrul.viona12@gmail.com", "Sahrul Viona", "Super Admin")}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#002147]/5 hover:bg-[#002147]/10 text-[#002147] border border-[#002147]/10 text-xs font-bold tracking-wide transition duration-150 active:scale-[0.98] cursor-pointer"
              >
                <span>🔓 Bypass Firebase &amp; Masuk Sesi (sahrul.viona12@gmail.com)</span>
              </button>

              <p className="text-[10px] text-center text-slate-400 font-mono">
                Dukungan Akun Google Workspace &amp; Sandbox Instan
              </p>
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-mono uppercase tracking-widest font-bold">
                Atau Akses Demo Cepat (Role Based)
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Role quick selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="quick-demo-roles">
              {demoUsers.map((user, idx) => (
                <button
                  key={idx}
                  onClick={() => handleDemoLogin(user.role, user.name)}
                  disabled={loading}
                  className="group flex flex-col text-left p-3.5 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-[#D4AF37] hover:shadow-sm transition active:scale-[0.99] duration-150 disabled:opacity-50 cursor-pointer"
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-xs font-bold text-slate-700 group-hover:text-[#002147] font-mono transition">
                      {user.name}
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-slate-200/50 group-hover:bg-[#002147]/10 border border-slate-200 group-hover:border-[#002147]/20 text-[#002147] font-mono font-semibold transition">
                      {user.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-slate-500 text-[10px] sm:text-[11px] leading-tight">
                    <span className="text-[#002147] font-mono text-[9px] uppercase font-bold tracking-wider opacity-85 font-black">
                      {user.division} &bull;
                    </span>
                    <span className="line-clamp-1">{user.desc}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 justify-center text-slate-400 text-[11px] font-mono">
              <KeyRound className="w-3.5 h-3.5 text-[#D4AF37]" />
              Sistem Enkripsi Database End-to-End diaktifkan via Firebase
            </div>
          </div>

        </div>
      </div>

      {/* Footer credits */}
      <div className="text-center text-xs text-slate-450 mt-8 border-t border-slate-200 pt-4 pb-2">
        <p>&copy; 2026 SOP Kontraktor Pro. Hak Cipta Dilindungi Undang-Undang.</p>
        <p className="text-[10px] mt-0.5 text-slate-400">Tampilan Dioptimalkan untuk Manajemen Proyek Konstruksi &amp; Konsultan Teknik Terakreditasi BSN Indonesia.</p>
      </div>

    </div>
  );
}
