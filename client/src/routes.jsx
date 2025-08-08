import {
  HomeIcon,
  UserCircleIcon,
  TableCellsIcon,
  InformationCircleIcon,
  ServerStackIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/solid";

// Impor halaman dari folder masing-masing
import { 
  Home as AdminHome, 
  DataPengguna, 
  DataBarang, 
  Notifikasi, 
  Profil, 
  EditPengguna,
  TambahPengguna,
  TambahBarang,  
  EditBarang  
} from "@/pages/admin";
import { Home as PengurusBarangHome } from "@/pages/pengurus-barang";
import { Home as PenataUsahaBarangHome } from "@/pages/penata-usaha-barang";
import { Home as PpkHome } from "@/pages/ppk";
import { Home as KabidHome } from "@/pages/kepala-bidang";
import { Home as KadisHome } from "@/pages/kepala-dinas";
import { SignIn, SignUp } from "@/pages/auth";

const icon = { className: "w-5 h-5 text-inherit" };

const routes = [
  // --- Rute untuk Admin ---
  {
    layout: "admin",
    role: "Admin",
    pages: [
      { 
        icon: <HomeIcon {...icon} />, 
        name: "Dashboard", 
        path: "/home", 
        element: <AdminHome /> 
      },
      {
        icon: <ServerStackIcon {...icon} />,
        name: "Data Master",
        subRoutes: [
          { 
            icon: <UserCircleIcon {...icon} />, 
            name: "Data Pengguna", 
            path: "/data-pengguna", 
            element: <DataPengguna /> 
          },
          { 
            icon: <TableCellsIcon {...icon} />, 
            name: "Data Barang", 
            path: "/data-barang", 
            element: <DataBarang /> 
          },
        ],
      },
      { 
        icon: <InformationCircleIcon {...icon} />, 
        name: "Notifikasi", 
        path: "/notifikasi", 
        element: <Notifikasi /> 
      },
      { 
        icon: <RectangleStackIcon {...icon} />, 
        name: "Profil", 
        path: "/profil", 
        element: <Profil /> 
      },
      // Rute ini tidak akan muncul di navigasi, hanya untuk routing halaman
      { 
        path: "/edit-pengguna/:id", 
        element: <EditPengguna /> 
      },
      {
        path: "/tambah-pengguna",
        element: <TambahPengguna />
      },
      { path: "/tambah-barang", 
        element: <TambahBarang /> 
      }, 
      { path: "/edit-barang/:id", 
        element: <EditBarang /> 
      }, 
    ],
  },
  // --- Rute untuk Pengurus Barang ---
  {
    layout: "pengurus-barang",
    role: "Pengurus Barang",
    pages: [
      { 
        icon: <HomeIcon {...icon} />, 
        name: "Dashboard", 
        path: "/home", 
        element: <PengurusBarangHome /> 
      },
    ],
  },
  // --- Rute untuk Penata Usaha Barang ---
  {
    layout: "penata-usaha-barang",
    role: "Penata Usaha Barang",
    pages: [
      { 
        icon: <HomeIcon {...icon} />, 
        name: "Dashboard", 
        path: "/home", 
        element: <PenataUsahaBarangHome /> 
      },
    ],
  },
  // --- Rute untuk PPK ---
  {
    layout: "ppk",
    role: "PPK",
    pages: [
      { 
        icon: <HomeIcon {...icon} />, 
        name: "Dashboard", 
        path: "/home", 
        element: <PpkHome /> 
      },
    ],
  },
  // --- Rute untuk Kepala Bidang ---
  {
    layout: "kepala-bidang",
    role: "Kepala Bidang",
    pages: [
      { 
        icon: <HomeIcon {...icon} />, 
        name: "Dashboard", 
        path: "/home", 
        element: <KabidHome /> 
      },
    ],
  },
  // --- Rute untuk Kepala Dinas ---
  {
    layout: "kepala-dinas",
    role: "Kepala Dinas",
    pages: [
      { 
        icon: <HomeIcon {...icon} />, 
        name: "Dashboard", 
        path: "/home", 
        element: <KadisHome /> 
      },
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