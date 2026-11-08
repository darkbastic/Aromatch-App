import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Award,
  Droplets,
  ExternalLink,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const SECTION_TITLES = {
  "/admin": {
    eyebrow: "Centro de Control",
    title: "Dashboard Administrativo",
    subtitle: "Resumen general y métricas en tiempo real del catálogo de Aromatch.",
  },
  "/admin/perfumes": {
    eyebrow: "Catálogo Maestro",
    title: "Gestión de Perfumes",
    subtitle: "Administra las fragancias del catálogo y su pirámide olfativa.",
  },
  "/admin/marcas": {
    eyebrow: "Casas Perfumistas",
    title: "Gestión de Marcas",
    subtitle: "Administra las casas perfumistas y firmas registradas.",
  },
  "/admin/notas": {
    eyebrow: "Biblioteca Olfativa",
    title: "Gestión de Notas Olfativas",
    subtitle: "Administra los ingredientes y familias aromáticas del catálogo maestro.",
  },
  "/admin/administradores": {
    eyebrow: "Seguridad y Roles",
    title: "Gestión de Administradores",
    subtitle: "Consulta y registra cuentas con acceso administrativo al catálogo.",
  },
};

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const currentSection = SECTION_TITLES[location.pathname] || SECTION_TITLES["/admin"];

  return (
    <div className="admin-shell">
      {/* SIDEBAR LATERAL FIJO EN ESCRITORIO / BARRA SUPERIOR EN MÓVIL */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <Link to="/admin" className="admin-brand">
            <span className="admin-brand-icon" aria-hidden="true">
              <Sparkles size={18} />
            </span>
            <div className="admin-brand-text">
              <span className="admin-brand-title">AROMATCH</span>
              <span className="admin-brand-subtitle">Panel de Control</span>
            </div>
          </Link>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Menú de administración">
          <span className="admin-nav-label">Catálogo y Gestión</span>

          <NavLink
            to="/admin"
            end
            className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/admin/perfumes"
            className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
          >
            <FlaskConical size={18} />
            <span>Perfumes</span>
          </NavLink>

          <NavLink
            to="/admin/marcas"
            className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
          >
            <Award size={18} />
            <span>Marcas</span>
          </NavLink>

          <NavLink
            to="/admin/notas"
            className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
          >
            <Droplets size={18} />
            <span>Notas olfativas</span>
          </NavLink>

          {user?.is_superuser && (
            <>
              <span className="admin-nav-label admin-nav-label-spaced">
                Seguridad y Accesos
              </span>
              <NavLink
                to="/admin/administradores"
                className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
              >
                <ShieldCheck size={18} />
                <span>Administradores</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-storefront-link">
            <ExternalLink size={15} />
            <span>Ver plataforma pública</span>
          </Link>

          <button
            type="button"
            className="admin-logout-btn"
            onClick={handleLogout}
          >
            <LogOut size={15} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL DE CONTENIDO */}
      <div className="admin-main-wrapper">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <span className="admin-topbar-eyebrow">{currentSection.eyebrow}</span>
            <h1 className="admin-topbar-title">{currentSection.title}</h1>
            <p className="admin-topbar-subtitle">{currentSection.subtitle}</p>
          </div>

          <div className="admin-topbar-user">
            <div className="admin-user-avatar">
              {(user?.first_name?.[0] || user?.username?.[0] || "A").toUpperCase()}
            </div>
            <div className="admin-user-details">
              <strong className="admin-user-name">
                {user?.first_name
                  ? `${user.first_name} ${user.last_name || ""}`.trim()
                  : `@${user?.username}`}
              </strong>
              <span className="admin-user-email">{user?.email}</span>
            </div>
            <span
              className={`admin-role-badge ${
                user?.is_superuser ? "role-super" : "role-staff"
              }`}
            >
              <ShieldCheck size={14} />
              <span>
                {user?.is_superuser ? "Superadministrador" : "Administrador"}
              </span>
            </span>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
