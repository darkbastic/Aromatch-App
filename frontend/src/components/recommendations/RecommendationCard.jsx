import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Heart, Sparkles, Star } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useFavorites } from "../../hooks/useFavorites";
import { getPerfumeFallbackImage } from "../../utils/helpers";

export default function RecommendationCard({ perfume }) {
  const { isAuthenticated } = useAuth();
  const { isFavorite, isPendingFavorite, toggleFavorite } = useFavorites();
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  if (!perfume) return null;

  const brandName = perfume.brand?.name || "Maison de Parfum";
  const fallbackSrc = getPerfumeFallbackImage(perfume.name, brandName);
  const imageSrc = !imgError && perfume.image_url ? perfume.image_url : fallbackSrc;
  const isFav = isFavorite(perfume.id);
  const pendingFav = isPendingFavorite(perfume.id);

  const handleFavorite = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    await toggleFavorite(perfume.id);
  };

  return (
    <article className="recommendation-card">
      <div className="recommendation-card-media">
        <Link to={`/perfume/${perfume.id}`}>
          <img
            src={imageSrc}
            alt={perfume.name}
            className="recommendation-card-img"
            onError={() => setImgError(true)}
          />
        </Link>
        <div className="recommendation-match-pill">
          <Sparkles size={14} />
          <span>{Number(perfume.match_percentage || 0).toFixed(0)}% coincidencia</span>
        </div>
        <button
          type="button"
          className={`perfume-card-fav ${isFav ? "is-active" : ""}`}
          onClick={handleFavorite}
          disabled={pendingFav}
          title={isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
        >
          <Heart size={18} fill={isFav ? "#B89B69" : "transparent"} />
        </button>
      </div>

      <div className="recommendation-card-content">
        <div className="recommendation-card-top">
          <span className="perfume-card-brand">{brandName}</span>
          <span className="badge badge-concentration">
            {perfume.concentration_display || perfume.concentration}
          </span>
        </div>

        <h3 className="recommendation-card-title">
          <Link to={`/perfume/${perfume.id}`}>{perfume.name}</Link>
        </h3>

        {perfume.description && (
          <p className="recommendation-card-desc">{perfume.description}</p>
        )}

        <div className="recommendation-match-box">
          <div className="recommendation-match-header">
            <CheckCircle2 size={16} color="#B89B69" />
            <span>
              <strong>{perfume.matched_notes_count}</strong>{" "}
              {perfume.matched_notes_count === 1
                ? "nota coincide con tu perfil"
                : "notas coinciden con tu perfil"}
            </span>
          </div>

          <div className="recommendation-matched-notes">
            {(perfume.matched_notes || []).map((note) => (
              <span key={`${note.id}-${note.note_type}`} className="matched-note-chip">
                <strong>{note.name}</strong>
                <small>{note.note_type_display || note.note_type}</small>
              </span>
            ))}
          </div>
        </div>

        <div className="recommendation-card-footer">
          <div className="perfume-card-rating">
            {perfume.average_rating !== null && perfume.average_rating !== undefined ? (
              <>
                <Star size={15} fill="#B89B69" color="#B89B69" />
                <span className="rating-score">
                  {Number(perfume.average_rating).toFixed(1)}
                </span>
                <span className="rating-count">
                  ({perfume.reviews_count || 0})
                </span>
              </>
            ) : (
              <span className="rating-empty">Nueva en comunidad</span>
            )}
          </div>

          <Link to={`/perfume/${perfume.id}`} className="btn btn-primary btn-sm">
            Ver ficha olfativa
          </Link>
        </div>
      </div>
    </article>
  );
}

