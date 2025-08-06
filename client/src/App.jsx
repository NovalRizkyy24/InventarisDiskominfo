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
            .filter(route => route.layout !== 'auth') // Ambil semua rute selain auth
            .map(({ layout, pages }) =>
              pages.map(({ path, element }) => (
                <Route
                  key={`${layout}${path}`}
                  path={`/${layout}${path}`}
                  element={element}
                />
              ))
            )}
        </Route>
      </Route>

      {/* Rute Default */}
      <Route path="*" element={<Navigate to="/auth/sign-in" replace />} />
    </Routes>
  );
}

export default App;
