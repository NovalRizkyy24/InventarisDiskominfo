import { Outlet } from "react-router-dom";
import { Sidenav, DashboardNavbar, Footer, Configurator } from "@/widgets/layout";
import routes from "@/routes";
import { useAuth } from "@/hooks/useAuth"; // Hook kustom yang akan kita buat

export function DashboardLayout() {
  const { user } = useAuth(); // Dapatkan info user yang sedang login

  // Filter rute untuk Sidenav berdasarkan peran pengguna yang login
  const userRoutes = routes.filter(route => route.role === user?.role);

  return (
    <div className="min-h-screen bg-blue-gray-50/50">
      <Sidenav routes={userRoutes} />
      <div className="p-4 xl:ml-80">
        <DashboardNavbar />
        <Outlet />
        <div className="text-blue-gray-600">
          <Footer />
        </div>
      </div>
      <Configurator />
    </div>
  );
}

export default DashboardLayout;
