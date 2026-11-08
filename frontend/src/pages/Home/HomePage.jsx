import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Compass,
  Droplets,
  Heart,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { catalogService } from "../../services/catalogService";
import { extractApiError } from "../../utils/helpers";
import SearchBar from "../../components/perfumes/SearchBar";
import PerfumeGrid from "../../components/perfumes/PerfumeGrid";
import Loader from "../../components/common/Loader";
import ErrorMessage from "../../components/common/ErrorMessage";

export default function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredPerfumes, setFeaturedPerfumes] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHomeData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [perfumesData, notesData] = await Promise.all([
        catalogService.getPerfumes({ ordering: "-average_rating" }),
        catalogService.getNotes({ ordering: "name" }),
      ]);

      const perfumeList = Array.isArray(perfumesData)
        ? perfumesData
        : perfumesData.results || [];
      const noteList = Array.isArray(notesData)
        ? notesData
        : notesData.results || [];

      setFeaturedPerfumes(perfumeList.slice(0, 4));
      setNotes(noteList.slice(0, 12));
    } catch (err) {
      setError(extractApiError(err, "No fue posible cargar los datos iniciales del catálogo."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  const handleSearchSubmit = (query) => {
    const trimmed = (query || "").trim();
    if (trimmed) {
      navigate(`/catalogo?search=${encodeURIComponent(trimmed)}`);
    } else {
      navigate("/catalogo");
    }
  };

  return (
    <div className="home-page">
      {/* HERO PRINCIPAL */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-content">
            <span className="hero-eyebrow">
              <Sparkles size={15} />
              <span>Curaduría & Descubrimiento Olfativo</span>
            </span>

            <h1 className="hero-title">Encuentra la fragancia que habla de ti.</h1>

            <p className="hero-subtitle">
              Explora la arquitectura de las grandes creaciones de la perfumería, comprende sus
              notas de salida, corazón y fondo, y descubre fragancias afines a tu identidad.
            </p>

            <div className="hero-search-wrapper">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={handleSearchSubmit}
                placeholder="Busca por nombre de perfume, casa perfumista o acorde..."
                buttonText="Explorar"
              />
            </div>

            <div className="hero-cta-group">
              <Link to="/catalogo" className="btn btn-primary btn-lg">
                <Compass size={18} />
                <span>Explorar el catálogo</span>
              </Link>
              <Link to="/recomendaciones" className="btn btn-outline btn-lg">
                <Sparkles size={18} />
                <span>Recomendaciones personalizadas</span>
              </Link>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="hero-card-showcase">
              <div className="hero-arch">
                <div className="hero-arch-inner">
                  <span className="hero-arch-tag">PIRÁMIDE OLFATIVA</span>
                  <h3>Salida · Corazón · Fondo</h3>
                  <p>
                    Cada fragancia cuenta una historia en tres actos sobre la piel. Descubre las
                    notas que resuenan contigo.
                  </p>
                  <div className="hero-arch-pills">
                    <span>Bergamota</span>
                    <span>Lavanda</span>
                    <span>Vainilla</span>
                    <span>Cedro</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN DE PERFUMES DESTACADOS */}
      <section className="section">
        <div className="container">
          <div className="section-header-row">
            <div>
              <span className="section-eyebrow">Selección de la Comunidad</span>
              <h2 className="section-title">Fragancias Destacadas</h2>
              <p className="section-subtitle">
                Creaciones emblemáticas del catálogo valoradas por nuestra comunidad olfativa.
              </p>
            </div>
            <Link to="/catalogo" className="section-link">
              <span>Ver todo el catálogo</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <Loader message="Cargando fragancias destacadas..." />
          ) : error ? (
            <ErrorMessage message={error} onRetry={fetchHomeData} />
          ) : featuredPerfumes.length > 0 ? (
            <PerfumeGrid perfumes={featuredPerfumes} />
          ) : (
            <p className="empty-inline">No hay perfumes registrados en el catálogo aún.</p>
          )}
        </div>
      </section>

      {/* SECCIÓN DE EXPLORACIÓN POR NOTAS OLFATIVAS */}
      <section className="section section-beige">
        <div className="container">
          <div className="section-header-center">
            <span className="section-eyebrow">Materias Primas</span>
            <h2 className="section-title">Explora por Notas Olfativas</h2>
            <p className="section-subtitle">
              Selecciona un ingrediente para descubrir todas las fragancias que lo incorporan en
              su pirámide olfativa.
            </p>
          </div>

          {loading ? (
            <Loader message="Cargando notas olfativas..." />
          ) : (
            <div className="notes-cloud">
              {notes.map((note) => (
                <Link
                  key={note.id}
                  to={`/catalogo?note=${note.id}`}
                  className="note-explore-card"
                >
                  <div className="note-explore-top">
                    <span className="note-explore-family">
                      {note.family || "Acorde"}
                    </span>
                    <Droplets size={15} className="note-explore-icon" />
                  </div>
                  <h3 className="note-explore-name">{note.name}</h3>
                  {note.description && (
                    <p className="note-explore-desc">{note.description}</p>
                  )}
                </Link>
              ))}
            </div>
          )}

          <div className="section-footer-center">
            <Link to="/preferencias" className="btn btn-outline">
              <SlidersHorizontal size={16} />
              <span>Configurar mis notas preferidas</span>
            </Link>
          </div>
        </div>
      </section>

      {/* SECCIÓN EXPLICATIVA: CÓMO FUNCIONA AROMATCH */}
      <section className="section">
        <div className="container">
          <div className="section-header-center">
            <span className="section-eyebrow">El Método Aromatch</span>
            <h2 className="section-title">¿Cómo funciona Aromatch?</h2>
            <p className="section-subtitle">
              Un recorrido pensado para conectar tu sensibilidad olfativa con las fragancias ideales.
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <span className="step-number">01</span>
              <div className="step-icon">
                <Compass size={24} />
              </div>
              <h3>Explora el Catálogo</h3>
              <p>
                Filtra fragancias por concentración, estación del año, proyección, duración y
                conoce su pirámide olfativa detallada.
              </p>
            </div>

            <div className="step-card">
              <span className="step-number">02</span>
              <div className="step-icon">
                <SlidersHorizontal size={24} />
              </div>
              <h3>Define tus Notas Preferidas</h3>
              <p>
                Selecciona las notas y familias olfativas que más disfrutas (cítricas, amaderadas,
                orientales, aromáticas o marinas).
              </p>
            </div>

            <div className="step-card">
              <span className="step-number">03</span>
              <div className="step-icon">
                <Heart size={24} />
              </div>
              <h3>Recibe tu Match Olfativo</h3>
              <p>
                Nuestro motor analiza la coincidencia exacta entre tus notas preferidas y el
                catálogo para recomendarte nuevas creaciones.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BANNER DE ACCESO A RECOMENDACIONES PERSONALIZADAS */}
      <section className="section cta-banner-section">
        <div className="container">
          <div className="cta-banner">
            <div className="cta-banner-text">
              <span className="section-eyebrow">Descubrimiento Personalizado</span>
              <h2>¿Listo para conocer tu próxima fragancia insignia?</h2>
              <p>
                Configura tus preferencias olfativas y deja que Aromatch calcule el porcentaje de
                afinidad con cada perfume de nuestra colección.
              </p>
            </div>
            <div className="cta-banner-actions">
              <Link to="/recomendaciones" className="btn btn-primary btn-lg">
                <Sparkles size={18} />
                <span>Ver mis recomendaciones</span>
              </Link>
              <Link to="/preferencias" className="btn btn-outline btn-lg">
                <span>Elegir notas favoritas</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

