import { 
  HomeIcon, 
  ServerStackIcon, 
  RectangleStackIcon, 
  UserIcon, 
  TableCellsIcon 
} from "@heroicons/react/24/solid";

// Impor halaman dari folder masing-masing
import { Home as AdminHome } from "@/pages/admin";
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
      { icon: <HomeIcon {...icon} />, name: "Dashboard", path: "/home", element: <AdminHome /> },
      // Contoh halaman lain untuk admin
      // { icon: <UserIcon {...icon} />, name: "Kelola User", path: "/users", element: <KelolaUser /> },
    ],
  },
  // --- Rute untuk Pengurus Barang ---
  {
    layout: "pengurus-barang",
    role: "Pengurus Barang",
    pages: [
      { icon: <HomeIcon {...icon} />, name: "Dashboard", path: "/home", element: <PengurusBarangHome /> },
    ],
  },
  // --- Rute untuk Penata Usaha Barang ---
  {
    layout: "penata-usaha-barang",
    role: "Penata Usaha Barang",
    pages: [
      { icon: <HomeIcon {...icon} />, name: "Dashboard", path: "/home", element: <PenataUsahaBarangHome /> },
    ],
  },
  // --- Rute untuk PPK ---
  {
    layout: "ppk",
    role: "PPK",
    pages: [
      { icon: <HomeIcon {...icon} />, name: "Dashboard", path: "/home", element: <PpkHome /> },
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
