import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Compass, SlidersHorizontal, Sparkles } from "lucide-react";
import { recommendationsService } from "../../services/recommendationsService";
import { useAuth } from "../../hooks/useAuth";
import { extractApiError } from "../../utils/helpers";
import RecommendationCard from "../../components/recommendations/RecommendationCard";
import Loader from "../../components/common/Loader";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";

export default function RecommendationsPage() {
  const { user } = useAuth();
  const [data, setData] = useState({
    has_preferences: false,
    preferred_notes_count: 0,
    count: 0,
    detail: "",
    results: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await recommendationsService.getRecommendations();
      setData({
        has_preferences: Boolean(response.has_preferences),
        preferred_notes_count: response.preferred_notes_count || 0,
        count: response.count || (response.results ? response.results.length : 0),
        detail: response.detail || "",
        results: response.results || [],
      });
    } catch (err) {
      setError(
        extractApiError(
          err,
          "No fue posible obtener tus recomendaciones personalizadas desde el servidor."
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  return (
    <div className="recommendations-page section">
      <div className="container">
        <div className="recommendations-hero">
          <div>
            <span className="section-eyebrow">Afinidad Olfativa</span>
            <h1 className="page-title">
              Recomendaciones para {user?.first_name || user?.username}
            </h1>
            <p className="page-subtitle">
              {data.detail ||
                "Selección calculada por el motor de Aromatch a partir de tus notas olfativas preferidas."}
            </p>
          </div>

          <div className="recommendations-hero-stats">
            <div className="stat-box">
              <span className="stat-number">{data.preferred_notes_count}</span>
              <span className="stat-label">Notas en tu perfil</span>
            </div>
            <Link to="/preferencias" className="btn btn-outline">
              <SlidersHorizontal size={16} />
              <span>Ajustar mis notas</span>
            </Link>
          </div>
        </div>

        {loading ? (
          <Loader message="Analizando pirámides olfativas y calculando afinidad..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={loadRecommendations} />
        ) : !data.has_preferences ? (
          <EmptyState
            icon={SlidersHorizontal}
            title="Aún no has configurado tus preferencias olfativas"
            description="Selecciona tus notas favoritas (como Bergamota, Lavanda, Vainilla o Cedro) para que Aromatch pueda calcular tu porcentaje de coincidencia con cada fragancia."
            action={
              <Link to="/preferencias" className="btn btn-primary btn-lg">
                <Sparkles size={18} />
                <span>Configurar mis notas preferidas</span>
              </Link>
            }
          />
        ) : data.results.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No encontramos nuevas fragancias por descubrir con estas notas"
            description="Recuerda que Aromatch excluye automáticamente los perfumes que ya tienes en tus Favoritos o que ya has reseñado. Prueba agregando más notas olfativas a tu perfil."
            action={
              <div className="empty-actions-row">
                <Link to="/preferencias" className="btn btn-primary">
                  <SlidersHorizontal size={16} />
                  <span>Agregar más notas preferidas</span>
                </Link>
                <Link to="/catalogo" className="btn btn-outline">
                  <Compass size={16} />
                  <span>Ver catálogo completo</span>
                </Link>
              </div>
            }
          />
        ) : (
          <div className="recommendations-list">
            {data.results.map((perfume) => (
              <RecommendationCard key={perfume.id} perfume={perfume} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

