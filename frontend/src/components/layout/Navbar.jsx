import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Compass,
  Heart,
  LogOut,
  Menu,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useFavorites } from "../../hooks/useFavorites";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { favorites } = useFavorites();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleLogout = async () => {
    closeMobileMenu();
    await logout();
    navigate("/");
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand" onClick={closeMobileMenu}>
          <span className="navbar-brand-mark" aria-hidden="true">
            <Sparkles size={18} />
          </span>
          <div className="navbar-brand-text">
            <span className="navbar-brand-title">AROMATCH</span>
          </div>
        </Link>

        <nav
          className={`navbar-links ${mobileMenuOpen ? "is-open" : ""}`}
          aria-label="Navegación principal"
        >
          <NavLink
            to="/"
            end
            onClick={closeMobileMenu}
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            Inicio
          </NavLink>

          <NavLink
            to="/catalogo"
            onClick={closeMobileMenu}
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <Compass size={16} />
            <span>Catálogo</span>
          </NavLink>

          <NavLink
            to="/recomendaciones"
            onClick={closeMobileMenu}
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <Sparkles size={16} />
            <span>Recomendaciones</span>
          </NavLink>

          {isAuthenticated && (
            <>
              <NavLink
                to="/preferencias"
                onClick={closeMobileMenu}
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              >
                <SlidersHorizontal size={16} />
                <span>Preferencias</span>
              </NavLink>

              <NavLink
                to="/favoritos"
                onClick={closeMobileMenu}
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              >
                <Heart size={16} />
                <span>Favoritos</span>
                {favorites.length > 0 && (
                  <span className="nav-badge">{favorites.length}</span>
                )}
              </NavLink>
            </>
          )}

          <div className="navbar-mobile-actions">
            {isAuthenticated ? (
              <>
                {user?.is_staff && (
                  <Link
                    to="/admin"
                    onClick={closeMobileMenu}
                    className="btn btn-primary btn-sm btn-full"
                  >
                    <ShieldCheck size={16} />
                    <span>Panel Admin</span>
                  </Link>
                )}
                <Link
                  to="/perfil"
                  onClick={closeMobileMenu}
                  className="btn btn-outline btn-sm btn-full"
                >
                  <User size={16} />
                  <span>{user?.first_name || user?.username}</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-ghost btn-sm btn-full"
                >
                  <LogOut size={16} />
                  <span>Cerrar sesión</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="btn btn-outline btn-sm btn-full"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/registro"
                  onClick={closeMobileMenu}
                  className="btn btn-primary btn-sm btn-full"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </nav>

        <div className="navbar-actions">
          {isAuthenticated ? (
            <>
              {user?.is_staff && (
                <Link to="/admin" className="btn btn-outline btn-sm">
                  <ShieldCheck size={15} />
                  <span>Panel Admin</span>
                </Link>
              )}
              <Link to="/perfil" className="navbar-user-pill">
                <User size={16} />
                <span>{user?.first_name || user?.username}</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-ghost btn-sm"
                title="Cerrar sesión"
              >
                <LogOut size={16} />
                <span>Salir</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">
                Iniciar sesión
              </Link>
              <Link to="/registro" className="btn btn-primary btn-sm">
                Crear cuenta
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="navbar-toggle"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>
  );
}
