import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand-col">
          <Link to="/" className="navbar-brand footer-brand">
            <span className="navbar-brand-mark" aria-hidden="true">
              <Sparkles size={18} />
            </span>
            <div className="navbar-brand-text">
              <span className="navbar-brand-title">AROMATCH</span>
              <span className="navbar-brand-subtitle">Haute Parfumerie & Discovery</span>
            </div>
          </Link>
          <p className="footer-description">
            Descubre, explora y comprende el arte de la perfumería a través de sus pirámides
            olfativas, familias aromáticas y recomendaciones personalizadas.
          </p>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">Explorar</h4>
          <ul className="footer-links">
            <li>
              <Link to="/">Inicio</Link>
            </li>
            <li>
              <Link to="/catalogo">Catálogo de Perfumes</Link>
            </li>
            <li>
              <Link to="/recomendaciones">Recomendaciones</Link>
            </li>
            <li>
              <Link to="/preferencias">Preferencias Olfativas</Link>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">Tu Espacio</h4>
          <ul className="footer-links">
            <li>
              <Link to="/favoritos">Mis Favoritos</Link>
            </li>
            <li>
              <Link to="/perfil">Mi Perfil</Link>
            </li>
            <li>
              <Link to="/login">Iniciar Sesión</Link>
            </li>
            <li>
              <Link to="/registro">Crear Cuenta</Link>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">Filosofía Olfativa</h4>
          <p className="footer-note">
            Aromatch es una plataforma dedicada exclusivamente al descubrimiento y curaduría
            olfativa, conectando tus notas preferidas con creaciones icónicas de la perfumería.
          </p>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>© {currentYear} Aromatch. Todos los derechos reservados.</p>
        <p className="footer-tagline">Encuentra la fragancia que habla de ti.</p>
      </div>
    </footer>
  );
}

