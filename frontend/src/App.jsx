import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AdminRoute from "./components/common/AdminRoute";
import HomePage from "./pages/Home/HomePage";
import CatalogPage from "./pages/Catalog/CatalogPage";
import PerfumeDetailPage from "./pages/PerfumeDetail/PerfumeDetailPage";
import FavoritesPage from "./pages/Favorites/FavoritesPage";
import RecommendationsPage from "./pages/Recommendations/RecommendationsPage";
import PreferencesPage from "./pages/Preferences/PreferencesPage";
import LoginPage from "./pages/Login/LoginPage";
import RegisterPage from "./pages/Register/RegisterPage";
import ProfilePage from "./pages/Profile/ProfilePage";
import AdminDashboardPage from "./pages/Admin/AdminDashboardPage";
import AdminPerfumesPage from "./pages/Admin/AdminPerfumesPage";
import AdminBrandsPage from "./pages/Admin/AdminBrandsPage";
import AdminNotesPage from "./pages/Admin/AdminNotesPage";
import AdminUsersPage from "./pages/Admin/AdminUsersPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FavoritesProvider>
          <Routes>
            {/* PANEL DE ADMINISTRACIÓN (/admin) — Interfaz independiente */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboardPage />} />
              <Route path="perfumes" element={<AdminPerfumesPage />} />
              <Route path="marcas" element={<AdminBrandsPage />} />
              <Route path="notas" element={<AdminNotesPage />} />
              <Route
                path="administradores"
                element={
                  <AdminRoute requireSuperuser>
                    <AdminUsersPage />
                  </AdminRoute>
                }
              />
            </Route>

            {/* PLATAFORMA PÚBLICA Y DE USUARIO */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/catalogo" element={<CatalogPage />} />
              <Route path="/perfume/:id" element={<PerfumeDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/registro" element={<RegisterPage />} />

              {/* Rutas Protegidas (requieren JWT) */}
              <Route
                path="/favoritos"
                element={
                  <ProtectedRoute>
                    <FavoritesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recomendaciones"
                element={
                  <ProtectedRoute>
                    <RecommendationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/preferencias"
                element={
                  <ProtectedRoute>
                    <PreferencesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/perfil"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Redirección por defecto */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </FavoritesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
