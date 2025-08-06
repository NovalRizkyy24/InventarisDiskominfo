import { Routes, Route } from "react-router-dom";
import { Cog6ToothIcon } from "@heroicons/react/24/solid";
import { IconButton } from "@material-tailwind/react";
import {
  Sidenav,
  DashboardNavbar,
  Configurator,
  Footer,
} from "@/widgets/layout";
import routes from "@/routes";
import { useMaterialTailwindController, setOpenConfigurator } from "@/context";
import { useLocation } from "react-router-dom"; // Impor useLocation

export function Dashboard() {
  const [controller, dispatch] = useMaterialTailwindController();
  const { sidenavType } = controller;
  const { pathname } = useLocation(); // Dapatkan path URL saat ini

  // Tentukan layout yang aktif dari URL
  // Contoh: jika URL adalah "/admin/home", layoutnya adalah "admin"
  const activeLayout = pathname.split('/')[1];

  return (
    <div className="min-h-screen bg-blue-gray-50/50">
      <Sidenav
        routes={routes}
        brandImg={
          sidenavType === "dark" ? "/img/logo-ct.png" : "/img/logo-ct-dark.png"
        }
      />
      <div className="p-4 xl:ml-80">
        <DashboardNavbar />
        <Configurator />
        <IconButton
          size="lg"
          color="white"
          className="fixed bottom-8 right-8 z-40 rounded-full shadow-blue-gray-900/10"
          ripple={false}
          onClick={() => setOpenConfigurator(dispatch, true)}
        >
          <Cog6ToothIcon className="h-5 w-5" />
        </IconButton>
        <Routes>
          {routes.map(
            ({ layout, pages }) =>
              // Ganti kondisi ini: render halaman jika layout-nya cocok dengan layout yang aktif di URL
              layout === activeLayout &&
              pages.map(({ path, element }) => {
                // Hapus garis miring di awal untuk membuat path menjadi relatif
                const relativePath = path.startsWith('/') ? path.substring(1) : path;
                return <Route key={relativePath} path={relativePath} element={element} />;
              })
          )}
        </Routes>
        <div className="text-blue-gray-600">
          <Footer />
        </div>
      </div>
    </div>
  );
}

Dashboard.displayName = "/src/layout/dashboard.jsx";

export default Dashboard;
