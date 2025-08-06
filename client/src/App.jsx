import { Routes, Route, Navigate } from "react-router-dom";
import { Auth } from "@/layouts";
import DashboardLayout from "@/layouts/DashboardLayout";
import ProtectedRoute from "@/layouts/ProtectedRoute";
import routes from "@/routes";

function App() {
  return (
    <Routes>
      {/* Rute Publik */}
      <Route path="/auth/*" element={<Auth />} />

      {/* Grup Rute yang Dilindungi */}
      <Route element={<ProtectedRoute />}>
        {/* Gunakan DashboardLayout sebagai cangkang untuk semua peran */}
        <Route element={<DashboardLayout />}>
          {routes
            .filter((route) => route.layout !== "auth")
            .map(({ layout, pages }) =>
              pages.map((page) => {
                // Jika halaman memiliki sub-rute (seperti Data Master)
                if (page.subRoutes) {
                  return page.subRoutes.map(({ path, element }) => (
                    <Route
                      key={`${layout}${path}`}
                      path={`/${layout}${path}`}
                      element={element}
                    />
                  ));
                }
                // Jika halaman adalah rute biasa tanpa submenu
                if (page.path) {
                  return (
                    <Route
                      key={`${layout}${page.path}`}
                      path={`/${layout}${page.path}`}
                      element={page.element}
                    />
                  );
                }
                return null;
              })
            )}
        </Route>
      </Route>

      {/* Rute Default */}
      <Route path="*" element={<Navigate to="/auth/sign-in" replace />} />
    </Routes>
  );
}

export default App;