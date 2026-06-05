export interface DefaultSop {
  id: string;
  title: string;
  category: string;
  purpose: string;
  scope: string;
  responsibility: string;
  procedure?: string;
  checklist?: string;
  supportForms?: string;
}

export const defaultSops: DefaultSop[] = [
  {
    id: "sop-01",
    title: "SOP Penerimaan Proyek",
    category: "SOP Pengelolaan Proyek",
    purpose: "Memastikan proses seleksi, review penawaran, dan penandatanganan kontrak proyek baru berjalan transparan, menguntungkan, dan legal.",
    scope: "Berlaku mulai dari diterimanya undangan tender atau penunjukan langsung dari klien hingga verifikasi kontrak kesepakatan.",
    responsibility: "Direktur Utama, Project Manager, Legal Admin.",
    procedure: "1. Menerima Undangan Tender/LOI dari Pemberi Tugas.\n2. Melakukan evaluasi administrasi dan kelayakan bisnis proyek.\n3. Menunjuk PM dan tim pembuat usulan teknis.\n4. Menyusun draf usulan biaya dan komparasi profit margin.\n5. Menyetujui syarat kontrak (SPK) bersama Klien.",
    checklist: "- Verifikasi kapasitas finansial klien\n- Rekomendasi tim penilai kelayakan proyek\n- Dokumen kontrak ditinjau oleh penasihat hukum\n- Penandatanganan kontrak dilakukan oleh pejabat berwenang",
    supportForms: "- Form Penilaian Awal Proyek\n- Surat Kuasa Penandatanganan Kontrak\n- Berkas Kesepakatan Harga (Deal Sheet)"
  },
  {
    id: "sop-02",
    title: "SOP Survey Lapangan",
    category: "SOP Pengelolaan Proyek",
    purpose: "Mendapatkan data topografi, kondisi geoteknis, aksesibilitas, dan utilitas eksisting lapangan secara presisi untuk meminimalkan deviasi pengerjaan.",
    scope: "Meliputi kegiatan persiapan alat, pengukuran titik batas lahan, dokumentasi awal, hingga penulisan Laporan Survey Lapangan.",
    responsibility: "Surveyor, Estimator, Geotechnical Engineer, Supervisor.",
    procedure: "1. Menyiapkan peralatan survey (Theodolite, GPS, Drone, meteran).\n2. Melakukan koordinasi dengan aparatur setempat/pemilik lahan.\n3. Mengukur batas koordinat batas proyek sesuai berkas legalitas.\n4. Mencatat elevasi, jenis tanah, hambatan alam, drainase eksisting, dan sumber daya setempat.\n5. Menyusun Laporan Hasil Survey Lapangan disertai foto panoramik.",
    checklist: "- Keakuratan kalibrasi alat ukur\n- Dokumentasi semua batas sudut lahan\n- Catatan ketersediaan instalasi air & listrik kerja\n- Tanda tangan persetujuan pemilik batas lahan tetangga",
    supportForms: "- Berita Acara Survey Lapangan (BASL)\n- Checklist Kondisi Fisik Lahan\n- Lembar Koordinat Batas Lahan"
  },
  {
    id: "sop-03",
    title: "SOP Penyusunan RAB",
    category: "SOP Keuangan",
    purpose: "Menyusun Estimasi Biaya Konstruksi (RAB) yang akurat berdasarkan harga pasar material, upah tenaga kerja, sewa alat berat, serta overhead proyek.",
    scope: "Berlaku sejak analisa gambar teknis (DED) disetujui sampai pengajuan RAB disahkan Direksi.",
    responsibility: "Quantity Surveyor (QS), Estimator, Direktur Konstruksi.",
    procedure: "1. Menganalisis Gambar Kerja (DED) dan Spesifikasi Teknis.\n2. Melakukan perhitungan volume bersih masing-masing item pekerjaan.\n3. Melakukan survey harga pasar terkini untuk material, upah kerja, dan alat.\n4. Menghitung Analisa Harga Satuan Pekerjaan (AHSP) mengacu standar SNI.\n5. Memasukkan faktor overhead, pajak, asuransi, dan margin laba.\n6. Pengesahan RAB oleh Direksi sebelum diajukan ke Klien.",
    checklist: "- Kesesuaian gambar teknis dengan volume RAB\n- Verifikasi validitas penawaran supplier material utama\n- Perhitungan overhead minimal 10-15%\n- Double check formula aritmatika lembar kerja (Excel)"
  },
  {
    id: "sop-04",
    title: "SOP Pengadaan Material",
    category: "SOP Pengadaan Material",
    purpose: "Menjamin ketersediaan material konstruksi di lapangan dengan kualitas sesuai spesifikasi teknis kontraktual, harga paling efisien, dan waktu kirim tepat.",
    scope: "Dimulai dari pembuatan daftar kebutuhan material harian/mingguan di lapangan hingga penerimaan fisik barang di gudang proyek.",
    responsibility: "Logistik Proyek, Admin Purchasing, Project Manager.",
    procedure: "1. Pelaksana Lapangan mengajukan Form Permintaan Barang (FPB).\n2. Bagian Purchasing meminta minimal 3 penawaran harga dari supplier terpilih.\n3. Melakukan negosiasi harga, termin pembayaran, dan jadwal pengiriman.\n4. Menerbitkan Purchase Order (PO) yang disahkan oleh PM/Direktur.\n5. Penerimaan barang di lokasi dibuktikan dengan Surat Jalan yang ditandatangani Logistik proyek.",
    checklist: "- Spesifikasi material sesuai dengan sample/mockup yang disetujui\n- Surat Jalan asli dari vendor wajib dilampirkan\n- Pemeriksaan kualitas visual (cacat fisik, kadaluarsa)\n- Pencatatan stok masuk di Kartu Logistik Gudang",
    supportForms: "- Form Permintaan Barang (FPB)\n- Purchase Order (PO)\n- Berita Acara Penerimaan Barang (BAPB)"
  },
  {
    id: "sop-05",
    title: "SOP Pengawasan Lapangan",
    category: "SOP Pengelolaan Proyek",
    purpose: "Memantau jalannya pekerjaan di lapangan agar berjalan sesuai kualitas, jadwal (time schedule), metode kerja, keselamatan kerja, serta biaya eksekusi.",
    scope: "Berlaku harian selama durasi konstruksi aktif berlangsung.",
    responsibility: "Supervisor (Pelaksana lapangan), Project Manager, Site Engineer.",
    procedure: "1. Melakukan briefing pagi (morning toolbox meeting) dengan seluruh tim pekerja.\n2. Memeriksa ketersediaan material dan kesiapan tenaga kerja.\n3. Mengawasi metode pelaksanaan pekerjaan di lokasi sesuai instruksi teknis.\n4. Menghentikan pekerjaan bila terdeteksi ada ketidaksesuaian metode atau potensi bahaya.\n5. Melakukan pengukuran hasil kerja harian untuk dicatat dalam Laporan Harian.",
    checklist: "- Kehadiran mandor dan pekerja inti\n- Penggunaan APD lengkap oleh seluruh personil\n- Pengawasan kebersihan area kerja (Housekeeping)\n- Pengukuran dimensi dan elevasi berkala sesuai shop drawings",
    supportForms: "- Logbook Harian Pengawas\n- Form Instruksi Lapangan\n- Lembar Teguran Kualitas Pekerjaan"
  },
  {
    id: "sop-06",
    title: "SOP Progress Harian",
    category: "SOP Pengelolaan Proyek",
    purpose: "Menyediakan data aktual kemajuan pencapaian volume kerja harian untuk evaluasi pengendalian jadwal proyek.",
    scope: "Meliputi pencatatan harian volume kerja, kondisi cuaca, kendala lapangan, serta jumlah alat/tenaga kerja.",
    responsibility: "Supervisor Lapangan, Inspector, Admin Proyek.",
    procedure: "1. Mencatat semua aktivitas pekerjaan dari pagi hingga sore.\n2. Mengkalkulasi volume hasil pekerjaan masing-masing divisi sektor.\n3. Mencatat fluktuasi cuaca (jumlah jam hujan) yang menghambat kerja.\n4. Mencatat persediaan material masuk dan keluar gudang harian.\n5. Menyusun Laporan Harian dan meminta tanda tangan verifikasi dari Konsultan Pengawas.",
    checklist: "- Pengisian lembar Laporan Kerja Harian di hari yang sama\n- Konfirmasi visual foto dokumentasi (Before - Progress - After)\n- Pencatatan jumlah jam lembur pekerja\n- Paraf Konsultan Pengawas terlampir asli",
    supportForms: "- Lembar Laporan Harian Proyek (LHP)\n- Form Catatan Curah Hujan\n- Daftar Tenaga Kerja Harian"
  },
  {
    id: "sop-07",
    title: "SOP Progress Mingguan",
    category: "SOP Pengelolaan Proyek",
    purpose: "Mengonsolidasikan laporan harian menjadi kemajuan kumulatif mingguan, guna membandingkan realisasi progres fisik dengan rencana (Kurva S).",
    scope: "Pengumpulan data dari Senin hingga Sabtu, dilaporkan pada setiap hari Senin minggu berikutnya.",
    responsibility: "Admin Proyek, Project Manager, Konsultan Pengawas.",
    procedure: "1. Mengumpulkan semua bundel dokumen Laporan Harian seminggu terakhir.\n2. Mengonversi volume fisik tercapai menjadi bobot persentase progres (%).\n3. Membandingkan progres kumulatif aktual dengan target rencana kurva S.\n4. Menyusun solusi pemulihan bila didapati status 'Keterlambatan/Deviasi Negatif'.\n5. Pembahasan progres di Rapat Koordinasi Mingguan Proyek.",
    checklist: "- Keabsahan komparasi penambahan progres aktual\n- Pembaruan berkala diagram kemajuan proyek\n- Tindakan korektif terdokumentasi untuk keterlambatan pekerjaan\n- Tanda tangan persetujuan tertulis Klien / Manajemen Konstruksi",
    supportForms: "- Laporan Kemajuan Proyek Mingguan (LKPM)\n- Grafik Deviasi Progres\n- Berita Acara Rapat Mingguan"
  },
  {
    id: "sop-08",
    title: "SOP Pembayaran Vendor",
    category: "SOP Keuangan",
    purpose: "Mengatur proses pengajuan, verifikasi prestasi, hingga transfer pembayaran termin termin kepada subkontraktor dan vendor material secara tertib dan transparan.",
    scope: "Sejak invoice tagihan dari vendor diterima oleh kasir proyek sampai dana dicairkan oleh Finance pusat.",
    responsibility: "Admin Keuangan, QS, Project Manager, Direktur Keuangan.",
    procedure: "1. Vendor mengirimkan surat tagihan/invoice beserta lampiran Berita Acara Progres Kerja (BAPK) / Kwitansi pembelian.\n2. QS Proyek memverifikasi opname volume fisik di lapangan secara presisi.\n3. PM menyetujui lembar disposisi pembayaran pembayaran.\n4. Admin Keuangan mengecek keabsahan faktur pajak dan nomor rekening vendor.\n5. Pengesahan pembayaran oleh Direktur Keuangan dan transfer dana ke rekening vendor.",
    checklist: "- Berita Acara Opname Fisik ditandatangani PM dan Vendor\n- Faktur Pajak lengkap & valid (jika PKP)\n- Pengecekan ada tidaknya potongan retensi/denda keterlambatan\n- Konfirmasi transfer berhasil dikirim ke vendor",
    supportForms: "- Surat Permohonan Pembayaran (SPP)\n- Berita Acara Progres Kemajuan Kerja\n- Lembar Verifikasi Kupon Pajak"
  },
  {
    id: "sop-09",
    title: "SOP Pengelolaan Kas",
    category: "SOP Keuangan",
    purpose: "Mengatur penggunaan, pengeluaran, pengembalian, dan pelaporan dana kas kecil (petty cash) proyek agar kebutuhan operasional lapangan mendesak dapat didanai secara akuntabel.",
    scope: "Meliputi pembukaan kas kecil proyek, verifikasi kuitansi mikro, pengisian kembali (reimbursement), dan rekonsiliasi kas proyek.",
    responsibility: "Kasir Proyek, Project Manager, Auditor Internal.",
    procedure: "1. Membuka limit saldo dana kas proyek (misalnya Rp 10.000.000,-).\n2. Setiap pengeluaran darurat wajib menggunakan nota/bon pembelian resmi.\n3. Kasir mencatat pengeluaran di Buku Kas Kecil harian.\n4. Pengajuan isi ulang kas (reimbursement) diajukan ketika saldo tersisa 20%.\n5. Melakukan opname fisik kas secara berkala (cash opname).",
    checklist: "- Kas fisik disimpan di loker/safe box terkunci rapat\n- Penggunaan kas kecil maksimal Rp 1.500.000 per transaksi\n- Bukti nota pembelian harus asli (bukan salinan)\n- Catatan posisi kas harian dilaporkan ke PM",
    supportForms: "- Voucher Kas Proyek Masuk / Keluar\n- Form Pengajuan Reimbursement Kos\n- Lembar Hasil Cash Opname Bulanan"
  },
  {
    id: "sop-10",
    title: "SOP Rekrutmen",
    category: "SOP SDM",
    purpose: "Bagi SDM, memenuhi kebutuhan personil proyek (Manajer, Pelaksana, Safety Officer, Tenaga Borong) yang andal, jujur, berpengalaman, dan sesuai anggaran.",
    scope: "Mulai dari usulan penambahan staf baru dari PM proyek hingga penandatanganan Kontrak Kerja PKWT staf.",
    responsibility: "HRD Manager, Project Manager, Direktur Operasional.",
    procedure: "1. PM mengajukan formulir Permintaan Karyawan Baru (FPTK).\n2. HRD memasang iklan lowongan kerja di portal dan relasi kontraktor.\n3. Melakukan seleksi CV administrasi, wawancara HRD, dan tes teknis sipil.\n4. Wawancara akhir (user interview) bersama PM/Direktur.\n5. Pengiriman surat penawaran gaji (Offering Letter) dan penandatanganan Perjanjian Kerja Waktu Tertentu (PKWT).",
    checklist: "- Kelayakan portofolio proyek kandidat sebelumnya\n- Pemeriksaan referensi kerja tempat kerja lama\n- Kesesuaian kisaran seleri dengan budget anggaran gaji proyek\n- Berkas sertifikat keahlian konstruksi (SKA/SKT) yang sah",
    supportForms: "- Formulir Permintaan Tenaga Kerja (FPTK)\n- Lembar Penilaian Wawancara Kandidat\n- Kontrak Kerja PKWT Kontraktor"
  },
  {
    id: "sop-11",
    title: "SOP Absensi",
    category: "SOP SDM",
    purpose: "Mengatur kedisiplinan jam kerja, pencatatan presensi harian, dan kalkulasi uang harian/lembur bagi semua staf proyek dan pekerja konstruksi di lapangan.",
    scope: "Berlaku untuk seluruh staf manajemen proyek, mandor, dan tukang harian.",
    responsibility: "HR Admin Proyek, Supervisor, Mandor.",
    procedure: "1. Semua staf wajib melakukan absen masuk (check-in) dan pulang (check-out) menggunakan mesin absensi sidik jari / aplikasi presensi digital.\n2. Pekerja lapangan (tukang/kenek) diabsen manual oleh Mandor masing-masing pada jam 07.45 WIB dan diserahkan ke HR Proyek.\n3. Pengajuan lembur kerja (overtime) harus disetujui PM secara tertulis sebelum lembur dilaksanakan.\n4. HR Proyek merekap persentase absensi bulanan untuk dasar pembayaran gaji.",
    checklist: "- Jam kehadiran maksimal pukul 08.00 WIB untuk staf kantor proyek\n- Form lembur ditandatangani PM asli\n- Verifikasi acak kehadiran tukang di lokasi kerja secara fisik\n- Sinkronisasi rekap absensi dengan slip penggajian mingguan",
    supportForms: "- Form Surat Tugas Lembur (STL)\n- Lembar Rekap Absensi Tenaga Kerja Mandor\n- Form Surat Izin Meninggalkan Pekerjaan"
  },
  {
    id: "sop-12",
    title: "SOP K3",
    category: "SOP K3",
    purpose: "Menciptakan lingkungan kerja nihil kecelakaan (Zero Accident) dan memastikan perlindungan kesehatan, keselamatan kerja seluruh personil di lokasi konstruksi.",
    scope: "Berlaku wajib bagi seluruh karyawan, subkontraktor, pemasok material, dan tamu proyek yang berada di area konstruksi.",
    responsibility: "K3/HSE Officer, Project Manager, Seluruh Pekerja Lapangan.",
    procedure: "1. Melakukan Safety Induction untuk seluruh pekerja baru dan tamu proyek.\n2. Melaksanakan toolbox meeting harian tentang potensi bahaya kerja di lokasi kerja spesifik.\n3. Menyediakan, memasang, dan merawat rambu peringatan, barikade, jaring pengaman, dan APAR.\n4. Memastikan penggunaan Alat Pelindung Diri (APD) standar: helm proyek, safety shoes, rompi reflektor, kacamata kerja, dan harness tali pengaman kerja diketinggian.\n5. Menyiapkan kotak P3K dan kendaraan evakuasi medis darurat.",
    checklist: "- Helm proyek, safety shoes wajib dipakai selama berada dalam pagar proyek\n- Barikade diletakkan di dekat area galian/lubang dalam\n- Pengecekan scaffolding / perancah sebelum digunakan bekerja\n- Rambu evakuasi darurat terlihat dengan jelas",
    supportForms: "- Form Laporan Kecelakaan Kerja Harian\n- Checklist Bulanan Inspeksi APAR\n- Surat Izin Kerja Khusus (Sertifikasi Hot Work/Ketinggian)"
  },
  {
    id: "sop-13",
    title: "SOP Quality Control",
    category: "SOP Quality Control",
    purpose: "Memastikan seluruh material, detail struktur, finishing properti dibangun sesuai gambar rencana draf kerja, standar SNI, dan spesifikasi RKS proyek.",
    scope: "Meliputi tes bahan material (kubus beton, besi tulangan) hingga inspeksi visual pekerjaan arsitektural.",
    responsibility: "QC Engineer, Site Engineer, Supervisor Konstruksi.",
    procedure: "1. Melakukan inspeksi material masuk ke lokasi kerja bersama Logistik.\n2. Melakukan tes tekan kubus/silinder beton dari truk mixer di lapangan.\n3. Melakukan pemeriksaan penulangan besi beton sebelum pengecoran dilakukan.\n4. Menguji kualitas finishing (kerataan dinding, kemiringan keramik, kekuatan cat tembok).\n5. Menerbitkan lembar ketetapan perbaikan (Defect List) jika kualitas tidak sesuai.",
    checklist: "- Besi tulangan terpasang rapat dan bersih dari karat minyak bumi\n- Uji slump beton berada pada ambang toleransi spesifikasi teknik\n- Kerataan lantai menggunakan alat ukur leveling digital\n- Tidak ada retakan rambut pada permukaan plesteran beton",
    supportForms: "- Checklist Izin Pengecoran Berkas (Cast Sheet)\n- Lembar Hasil Pengujian Beton\n- Berkas Daftar Cacat Pekerjaan (Defect List)"
  },
  {
    id: "sop-14",
    title: "SOP Serah Terima",
    category: "SOP Serah Terima Proyek",
    purpose: "Fase krusial penyerahan aset fisik bangunan dari Kontraktor kepada pemilik proyek (klien) secara hukum pasca proyek selesai terbangun sempurna.",
    scope: "Berlaku sejak pekerjaan konstruksi fisik selesai 100% (Serah Terima Pertama/PHO) hingga akhir Masa Pemeliharaan (Serah Terima Kedua/FHO).",
    responsibility: "Direktur Utama, Project Manager, Site Engineer, Klien, Konsultan MK.",
    procedure: "1. PM mengajukan surat permohonan Pemasangan Berita Acara Handover Pertama (PHO) ke Klien.\n2. Melakukan Joint Inspection (inspeksi bersama) untuk mendeteksi sisa pekerjaan minor (Defect List).\n3. Kontraktor melakukan perbaikan sisa cacat kerja selama tenggat waktu yang ditentukan.\n4. Menandatangani Berita Acara Serah Terima Pertama (BAST 1) yang memulai masa garansi.\n5. Setelah masa pemeliharaan (biasanya 3-6 bulan) usai, menandatangani BAST Kedua (BAST 2 / FHO).",
    checklist: "- Seluruh defect list minor berhasil diperbaiki tuntas\n- Semua kunci pintu gedung dikelompokkan dan diserahkan berlabel\n- Dokumen blueprint As-Built Drawing diserahkan lengkap\n- File garansi peralatan mekanikal elektrikal terlampir asli",
    supportForms: "- Berita Acara Serah Terima I (BAST 1 / PHO)\n- Checklist Verifikasi Pembenahan Defect\n- Berita Acara Serah Terima II (BAST 2 / FHO)"
  },
  {
    id: "sop-15",
    title: "SOP Komplain Klien",
    category: "SOP Pelayanan Klien",
    purpose: "Menangani saran kritis, kecacatan bangunan, atau keluhan dari pemilik proyek secara responsif, sopan, efisien, dan tuntas guna menjaga reputasi profesional perusahaan.",
    scope: "Berlaku dari diterimanya komplain tertulis/telepon pelanggan hingga klarifikasi pembenahan fisik selesai dikerjakan.",
    responsibility: "Customer Relation, PM, Supervisor Pemeliharaan.",
    procedure: "1. Mendaftar dan mengklasifikasikan setiap keluhan di database keluhan klien.\n2. Melakukan survey langsung ke lapangan untuk menilai penyebab kerusakan.\n3. Menentukan apakah kerusakan masuk dalam kompensasi Masa Retensi/Garansi.\n4. Menugaskan tim teknisi/tukang pemeliharaan untuk melakukan restorasi.\n5. Meminta tanda tangan kepuasan Klien setelah restorasi diverifikasi.",
    checklist: "- Komplain direspon maksimal dalam waktu 1x24 jam\n- Analisis penyebab kerusakan dilakukan secara jujur dan objektif\n- Estimasi lama proses perbaikan dikomunikasikan secara jelas ke klien\n- Foto serah terima area yang telah diperbaiki rapi kembali",
    supportForms: "- Lembar Registrasi Pengaduan Klien\n- Form Perintah Kerja Perbaikan Retensi\n- Lembar Persetujuan Penyelesaian Masalah"
  },
  {
    id: "sop-16",
    title: "SOP Tender",
    category: "SOP Tender",
    purpose: "Memperbesar peluang memenangkan tender proyek konstruksi swasta/pemerintah secara legal, kompetitif, dan sesuai kapasitas keuangan dan keahlian kontraktor.",
    scope: "Meliputi pendaftaran pra-kualifikasi tender, penyusunan dokumen teknis & administrasi, aanwijzing (penjelasan proyek), hingga pembukaan amplop harga.",
    responsibility: "Tender Estimator, QS, Koordinator Tender, Direksi.",
    procedure: "1. Mencari informasi tender dari LPSE atau undangan investor swasta.\n2. Melakukan analisis kekuatan pesaing dan kelayakan internal.\n3. Mengikuti rapat penjelasan proyek (Aanwijzing) untuk mencatat poin krusial penjelasan teknis.\n4. Menyusun dokumen administrasi (SIUP, SBU, SPT Pajak), metodologi metodologi teknis, dan portofolio.\n5. Menghitung strategi penawaran harga termurah yang tetap profitabel.\n6. Mengunggah/Memasukkan dokumen tender sebelum batas tenggat waktu.",
    checklist: "- Melampirkan semua sertifikat keahlian yang disyaratkan asli masa berlaku\n- Penghitungan Jaminan Penawaran (Bid Bond) sesuai aturan kepesertaan\n- Keakuratan penulisan surat penawaran harga (tanpa corat-coret)\n- Pengiriman dokumen cadangan rahasia aman",
    supportForms: "- Form Evaluasi Dokumen Tender\n- Lembar Rangkuman Hasil Aanwijzing\n- Surat Pengajuan Penawaran Tender Resmi"
  },
  {
    id: "sop-17",
    title: "SOP Audit Internal",
    category: "SOP Keuangan",
    purpose: "Melakukan verifikasi berkala secara imparsial atas aliran keuangan proyek, kepatuhan alur administrasi kantor, serta keandalan penyimpanan berkas operasional.",
    scope: "Pengauditan bulanan atau per triwulan di kantor pusat dan direksi keet lapangan.",
    responsibility: "Internal Auditor, Auditor Keuangan.",
    procedure: "1. Menyusun jadwal pelaksanaan audit tahunan proyek.\n2. Menugaskan auditor independen perusahaan.\n3. Melakukan pemeriksaan silang kuitansi logistik dengan laporan keuangan kas proyek.\n4. Melakukan wawancara acak dengan subkontraktor/tenaga kerja di lapangan.\n5. Menyusun Laporan Temuan Audit LTA disertai rekomendasi perbaikan.",
    checklist: "- Selisih saldo kas kecil wajib bernilai nol rupiah\n- Seluruh transaksi di atas Rp 5.000.000 bersumber dari persetujuan PM\n- Dokumen kontrak subkontraktor terdokumentasi rapi di folder aman\n- Rekomendasi audit sebelumnya telah ditindaklanjuti",
    supportForms: "- Lembar Rencana Audit Tahunan (RAT)\n- Laporan Temuan Audit Internal (LTA)\n- Lembar Jawaban Tindakan Korektif (JTK)"
  },
  {
    id: "sop-18",
    title: "SOP Arsip Dokumen",
    category: "SOP SDM",
    purpose: "Menjaga keamanan, keutuhan, dan kemudahan pencarian kembali semua jenis arsip penting perusahaan seperti Dokumen Kontrak, Surat Keputusan, Gambar As-Built, dan data Personil.",
    scope: "Penyimpanan dokumen hardcopy di lemari arsip baja tahan api dan softcopy di folder server cloud perusahaan.",
    responsibility: "General Admin, Document Controller, IT Admin.",
    procedure: "1. Meremajakan penomoran indeks dokumen yang masuk dan keluar.\n2. Memindai (scan) dokumen asli menjadi format PDF definisi tinggi.\n3. Menyimpan hardcopy asli didalam folder gantung di lemari berlabel indeks numerik.\n4. Mengunggah file softcopy ke direktori awan perusahaan dengan hak akses terbatas sesuai jabatan.\n5. Membuka form izin peminjaman jika dokumen fisik asli dipinjam.",
    checklist: "- Seluruh dokumen berharga disimpan dalam lemari kedap api dan terkunci\n- Skema penamaan berkas digital standar (TANGGAL_KODE_JUDUL.PDF)\n- Melakukan cadangan backup cloud berkala mingguan secara otomatis\n- Buku register peminjaman diisi tertib oleh peminjam",
    supportForms: "- Lembar Indeks Arsip Perusahaan\n- Buku Log Peminjaman Dokumen Asli\n- Form Deklarasi Pemusnahan Arsip Kedaluwarsa"
  }
];
