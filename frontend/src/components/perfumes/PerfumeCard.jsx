import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Sparkles, Star } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useFavorites } from "../../hooks/useFavorites";
import { getPerfumeFallbackImage } from "../../utils/helpers";

export default function PerfumeCard({ perfume, matchBadge = null, onRemovedFavorite }) {
  const { isAuthenticated } = useAuth();
  const { isFavorite, isPendingFavorite, toggleFavorite } = useFavorites();
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  if (!perfume) return null;

  const brandName = perfume.brand?.name || "Maison de Parfum";
  const isFav = isFavorite(perfume.id);
  const pendingFav = isPendingFavorite(perfume.id);

  const fallbackSrc = getPerfumeFallbackImage(perfume.name, brandName);
  const imageSrc = !imgError && perfume.image_url ? perfume.image_url : fallbackSrc;

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    const stillFav = await toggleFavorite(perfume.id);
    if (!stillFav && onRemovedFavorite) {
      onRemovedFavorite(perfume.id);
    }
  };

  return (
    <article className="perfume-card">
      <div className="perfume-card-media">
        <Link to={`/perfume/${perfume.id}`} className="perfume-card-image-link">
          <img
            src={imageSrc}
            alt={`${perfume.name} de ${brandName}`}
            className="perfume-card-image"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        </Link>

        <div className="perfume-card-badges">
          <span className="badge badge-concentration">
            {perfume.concentration_display || perfume.concentration}
          </span>
          {matchBadge !== null && (
            <span className="badge badge-match">
              <Sparkles size={12} />
              <span>{matchBadge}% afinidad</span>
            </span>
          )}
        </div>

        <button
          type="button"
          className={`perfume-card-fav ${isFav ? "is-active" : ""}`}
          onClick={handleFavoriteClick}
          disabled={pendingFav}
          title={
            isAuthenticated
              ? isFav
                ? "Quitar de favoritos"
                : "Guardar en favoritos"
              : "Inicia sesión para guardar en favoritos"
          }
          aria-label={isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
        >
          <Heart size={18} fill={isFav ? "#B89B69" : "transparent"} />
        </button>
      </div>

      <div className="perfume-card-body">
        <div className="perfume-card-meta">
          <span className="perfume-card-brand">{brandName}</span>
          {perfume.gender_display && (
            <span className="perfume-card-gender">{perfume.gender_display}</span>
          )}
        </div>

        <h3 className="perfume-card-title">
          <Link to={`/perfume/${perfume.id}`}>{perfume.name}</Link>
        </h3>

        <div className="perfume-card-rating">
          {perfume.average_rating !== null && perfume.average_rating !== undefined ? (
            <>
              <Star size={15} fill="#B89B69" color="#B89B69" />
              <span className="rating-score">
                {Number(perfume.average_rating).toFixed(1)}
              </span>
              <span className="rating-count">
                ({perfume.reviews_count || 0}{" "}
                {perfume.reviews_count === 1 ? "reseña" : "reseñas"})
              </span>
            </>
          ) : (
            <span className="rating-empty">Sin calificaciones aún</span>
          )}
        </div>

        <div className="perfume-card-footer">
          <Link to={`/perfume/${perfume.id}`} className="btn btn-outline btn-sm btn-full">
            Explorar fragancia
          </Link>
        </div>
      </div>
    </article>
  );
}

