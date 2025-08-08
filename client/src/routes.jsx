import {
  HomeIcon,
  UserCircleIcon,
  TableCellsIcon,
  ServerStackIcon,
  RectangleStackIcon,
  DocumentPlusIcon,
  ClipboardDocumentListIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";

// Impor Halaman Umum dan Autentikasi
import { SignIn, SignUp } from "@/pages/auth";

// Impor Semua Halaman Admin
import { 
  Home as AdminHome, 
  DataPengguna, 
  DataBarang, 
  Profil, 
  EditPengguna,
  TambahPengguna,
  TambahBarang,
  EditBarang,
  DataPengadaan,
  DetailPengadaan,
  DataPeminjaman,
  DetailPeminjaman
  // Tambahkan DataPenghapusan & DetailPenghapusan setelah dibuat
} from "@/pages/admin";

// Impor Halaman Peran Lainnya
import { Home as PengurusBarangHome } from "@/pages/pengurus-barang";
import { Home as PenataUsahaBarangHome } from "@/pages/penata-usaha-barang";
import { Home as PpkHome, TambahPengadaan, TambahPeminjaman } from "@/pages/ppk";
import { Home as KabidHome } from "@/pages/kepala-bidang";
import { Home as KadisHome } from "@/pages/kepala-dinas";

const icon = { className: "w-5 h-5 text-inherit" };

const routes = [
  // --- Rute untuk Admin ---
  {
    layout: "admin",
    role: "Admin",
    pages: [
      { icon: <HomeIcon {...icon} />, name: "Dashboard", path: "/home", element: <AdminHome /> },
      {
        icon: <ServerStackIcon {...icon} />,
        name: "Data Master",
        subRoutes: [
          { icon: <UserCircleIcon {...icon} />, name: "Data Pengguna", path: "/data-pengguna", element: <DataPengguna /> },
          { icon: <TableCellsIcon {...icon} />, name: "Data Barang", path: "/data-barang", element: <DataBarang /> },
        ],
      },
      { icon: <DocumentPlusIcon {...icon} />, name: "Rencana Pengadaan", path: "/data-pengadaan", element: <DataPengadaan /> },
      { icon: <ClipboardDocumentListIcon {...icon} />, name: "Data Peminjaman", path: "/data-peminjaman", element: <DataPeminjaman /> },
      { icon: <TrashIcon {...icon} />, name: "Data Penghapusan", path: "/data-penghapusan", element: <div /> }, // Placeholder
      { icon: <RectangleStackIcon {...icon} />, name: "Profil", path: "/profil", element: <Profil /> },
      // Rute tanpa navigasi
      { path: "/edit-pengguna/:id", element: <EditPengguna /> },
      { path: "/tambah-pengguna", element: <TambahPengguna /> },
      { path: "/tambah-barang", element: <TambahBarang /> },
      { path: "/edit-barang/:id", element: <EditBarang /> },
      { path: "/detail-pengadaan/:id", element: <DetailPengadaan /> },
      { path: "/detail-peminjaman/:id", element: <DetailPeminjaman /> },
      // { path: "/detail-penghapusan/:id", element: <DetailPenghapusan /> },
    ],
  },
  // --- Rute untuk Pengurus Barang ---
  {
    layout: "pengurus-barang",
    role: "Pengurus Barang",
    pages: [
      { icon: <HomeIcon {...icon} />, name: "Dashboard", path: "/home", element: <PengurusBarangHome /> },
      { icon: <DocumentPlusIcon {...icon} />, name: "Validasi Pengadaan", path: "/data-pengadaan", element: <DataPengadaan /> },
      { icon: <ClipboardDocumentListIcon {...icon} />, name: "Validasi Peminjaman", path: "/data-peminjaman", element: <DataPeminjaman /> },
      { icon: <TrashIcon {...icon} />, name: "Validasi Penghapusan", path: "/data-penghapusan", element: <div /> }, // Placeholder
      // Rute detail untuk peran ini
      { path: "/detail-pengadaan/:id", element: <DetailPengadaan /> },
      { path: "/detail-peminjaman/:id", element: <DetailPeminjaman /> },
    ],
  },
  // --- Rute untuk Penata Usaha Barang ---
  {
    layout: "penata-usaha-barang",
    role: "Penata Usaha Barang",
    pages: [
      { icon: <HomeIcon {...icon} />, name: "Dashboard", path: "/home", element: <PenataUsahaBarangHome /> },
      { icon: <DocumentPlusIcon {...icon} />, name: "Validasi Pengadaan", path: "/data-pengadaan", element: <DataPengadaan /> },
      { path: "/detail-pengadaan/:id", element: <DetailPengadaan /> },
    ],
  },
  // --- Rute untuk PPK ---
  {
    layout: "ppk",
    role: "PPK",
    pages: [
      { icon: <HomeIcon {...icon} />, name: "Dashboard", path: "/home", element: <PpkHome /> },
      { icon: <DocumentPlusIcon {...icon} />, name: "Buat Usulan Pengadaan", path: "/tambah-pengadaan", element: <TambahPengadaan /> },
      { icon: <ClipboardDocumentListIcon {...icon} />, name: "Ajukan Peminjaman", path: "/tambah-peminjaman", element: <TambahPeminjaman /> },
      { icon: <TrashIcon {...icon} />, name: "Ajukan Penghapusan", path: "/tambah-penghapusan", element: <div /> }, // Placeholder
    ],
  },
  // --- Rute untuk Kepala Bidang ---
  {
    layout: "kepala-bidang",
    role: "Kepala Bidang",
    pages: [
      { icon: <HomeIcon {...icon} />, name: "Dashboard", path: "/home", element: <KabidHome /> },
    ],
  },
  // --- Rute untuk Kepala Dinas ---
  {
    layout: "kepala-dinas",
    role: "Kepala Dinas",
    pages: [
      { icon: <HomeIcon {...icon} />, name: "Dashboard", path: "/home", element: <KadisHome /> },
      { icon: <DocumentPlusIcon {...icon} />, name: "Persetujuan Pengadaan", path: "/data-pengadaan", element: <DataPengadaan /> },
      { path: "/detail-pengadaan/:id", element: <DetailPengadaan /> },
    ],
  },
  // --- Rute untuk Autentikasi (Publik) ---
  {
    layout: "auth",
    pages: [
      { name: "Sign In", path: "/sign-in", element: <SignIn /> },
      { name: "Sign Up", path: "/sign-up", element: <SignUp /> },
    ],
  },
];

export default routes;