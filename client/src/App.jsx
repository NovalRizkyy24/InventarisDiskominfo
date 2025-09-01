import { Routes, Route, Navigate } from "react-router-dom";
import { Auth } from "@/layouts";
import DashboardLayout from "@/layouts/DashboardLayout";
import ProtectedRoute from "@/layouts/ProtectedRoute";
import routes from "@/routes";
import { DetailBarangPublik } from "@/pages/public/DetailBarangPublik"; 

function App() {
  return (
    <Routes>
      <Route path="/auth/*" element={<Auth />} />
      <Route path="/public/barang/:id" element={<DetailBarangPublik />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {routes
            .filter((route) => route.layout !== "auth")
            .map(({ layout, pages }) =>
              pages.map((page) => {
                if (page.subRoutes) {
                  return page.subRoutes.map(({ path, element }) => (
                    <Route
                      key={`${layout}${path}`}
                      path={`/${layout}${path}`}
                      element={element}
                    />
                  ));
                }
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

      <Route path="*" element={<Navigate to="/auth/sign-in" replace />} />
    </Routes>
  );
}

export default App;