import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Loader from "./Loader";

/**
 * Guard de seguridad para el Panel de Administración (/admin).
 * - Si el usuario no ha iniciado sesión -> redirige a /login.
 * - Si el usuario es un usuario normal (!user.is_staff) -> redirige a /.
 * - Si la ruta requiere superadministrador (requireSuperuser) y !user.is_superuser -> redirige a /admin.
 */
export default function AdminRoute({ children, requireSuperuser = false }) {
  const { user, isAuthenticated, loadingAuth } = useAuth();
  const location = useLocation();

  if (loadingAuth) {
    return (
      <Loader
        fullScreen
        message="Verificando credenciales administrativas..."
      />
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user?.is_staff) {
    return <Navigate to="/" replace />;
  }

  if (requireSuperuser && !user?.is_superuser) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

