import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Heart,
  MessageSquarePlus,
  Send,
  Sparkles,
  Sun,
  Users,
  Wind,
} from "lucide-react";
import { catalogService } from "../../services/catalogService";
import { reviewsService } from "../../services/reviewsService";
import { useAuth } from "../../hooks/useAuth";
import { useFavorites } from "../../hooks/useFavorites";
import { SEASON_LABELS } from "../../utils/constants";
import { extractApiError, getPerfumeFallbackImage } from "../../utils/helpers";
import OlfactoryPyramid from "../../components/perfumes/OlfactoryPyramid";
import StarRating from "../../components/common/StarRating";
import ReviewCard from "../../components/reviews/ReviewCard";
import Loader from "../../components/common/Loader";
import ErrorMessage from "../../components/common/ErrorMessage";
import Button from "../../components/common/Button";

export default function PerfumeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { isFavorite, isPendingFavorite, toggleFavorite } = useFavorites();

  const [perfume, setPerfume] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgError, setImgError] = useState(false);

  // Estado del formulario de reseña (crear o editar)
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(null);

  const loadPerfumeAndReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [perfumeDetail, reviewsResponse] = await Promise.all([
        catalogService.getPerfumeById(id),
        reviewsService.getReviewsByPerfume(id),
      ]);

      setPerfume(perfumeDetail);
      const reviewItems = Array.isArray(reviewsResponse)
        ? reviewsResponse
        : reviewsResponse.results || [];
      setReviews(reviewItems);
    } catch (err) {
      setError(
        extractApiError(
          err,
          "No se encontró la fragancia solicitada o no fue posible cargarla."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPerfumeAndReviews();
  }, [loadPerfumeAndReviews]);

  const userExistingReview = useMemo(() => {
    if (!user) return null;
    return reviews.find((r) => Number(r.user?.id) === Number(user.id)) || null;
  }, [reviews, user]);

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    await toggleFavorite(perfume.id);
  };

  const handleStartEditReview = (review) => {
    setEditingReviewId(review.id);
    setRatingInput(review.rating);
    setCommentInput(review.comment);
    setReviewError(null);
    setReviewSuccess(null);
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setRatingInput(5);
    setCommentInput("");
    setReviewError(null);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError(null);
    setReviewSuccess(null);

    if (!commentInput.trim()) {
      setReviewError("Por favor escribe tu apreciación olfativa antes de publicar.");
      return;
    }

    setSubmittingReview(true);
    try {
      if (editingReviewId) {
        await reviewsService.updateReview(editingReviewId, {
          rating: ratingInput,
          comment: commentInput.trim(),
        });
        setReviewSuccess("Tu reseña ha sido actualizada correctamente.");
        setEditingReviewId(null);
      } else {
        await reviewsService.createReview({
          perfume: perfume.id,
          rating: ratingInput,
          comment: commentInput.trim(),
        });
        setReviewSuccess("¡Gracias por compartir tu reseña olfativa!");
      }
      setCommentInput("");
      setRatingInput(5);
      await loadPerfumeAndReviews();
    } catch (err) {
      setReviewError(extractApiError(err, "No fue posible guardar tu reseña."));
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("¿Deseas eliminar tu reseña de este perfume?")) return;
    setReviewError(null);
    setReviewSuccess(null);
    try {
      await reviewsService.deleteReview(reviewId);
      if (editingReviewId === reviewId) {
        handleCancelEdit();
      }
      setReviewSuccess("Reseña eliminada correctamente.");
      await loadPerfumeAndReviews();
    } catch (err) {
      setReviewError(extractApiError(err, "No se pudo eliminar la reseña."));
    }
  };

  if (loading) {
    return (
      <div className="section container">
        <Loader message="Desplegando ficha olfativa..." />
      </div>
    );
  }

  if (error || !perfume) {
    return (
      <div className="section container">
        <ErrorMessage
          title="Fragancia no disponible"
          message={error || "El perfume solicitado no existe."}
          onRetry={loadPerfumeAndReviews}
        />
        <div style={{ marginTop: "1.5rem" }}>
          <Link to="/catalogo" className="btn btn-outline">
            <ArrowLeft size={16} />
            <span>Volver al catálogo</span>
          </Link>
        </div>
      </div>
    );
  }

  const brandName = perfume.brand?.name || "Maison de Parfum";
  const fallbackSrc = getPerfumeFallbackImage(perfume.name, brandName);
  const imageSrc = !imgError && perfume.image_url ? perfume.image_url : fallbackSrc;
  const isFav = isFavorite(perfume.id);
  const pendingFav = isPendingFavorite(perfume.id);

  return (
    <div className="perfume-detail-page">
      <div className="container">
        <div className="detail-breadcrumb">
          <Link to="/catalogo" className="back-link">
            <ArrowLeft size={16} />
            <span>Volver al catálogo</span>
          </Link>
        </div>

        {/* FICHA PRINCIPAL DEL PERFUME */}
        <section className="detail-hero-card">
          <div className="detail-media-col">
            <div className="detail-image-frame">
              <img
                src={imageSrc}
                alt={`${perfume.name} de ${brandName}`}
                className="detail-image"
                onError={() => setImgError(true)}
              />
            </div>
          </div>

          <div className="detail-info-col">
            <div className="detail-brand-row">
              <Link
                to={`/catalogo?brand=${perfume.brand?.id || ""}`}
                className="detail-brand-name"
              >
                {brandName}
              </Link>
              {perfume.brand?.country && (
                <span className="detail-brand-country">{perfume.brand.country}</span>
              )}
            </div>

            <h1 className="detail-title">{perfume.name}</h1>

            <div className="detail-rating-row">
              <StarRating value={perfume.average_rating || 0} size={20} />
              <span className="detail-rating-value">
                {perfume.average_rating !== null && perfume.average_rating !== undefined
                  ? `${Number(perfume.average_rating).toFixed(1)} / 5.0`
                  : "Sin calificación aún"}
              </span>
              <span className="detail-reviews-count">
                ({perfume.reviews_count || 0}{" "}
                {perfume.reviews_count === 1 ? "reseña" : "reseñas"})
              </span>
            </div>

            <p className="detail-description">
              {perfume.description ||
                "Una composición distinguida diseñada para dejar una impronta inolvidable."}
            </p>

            {/* ATRIBUTOS TÉCNICOS */}
            <div className="detail-specs-grid">
              <div className="spec-item">
                <span className="spec-icon">
                  <Sparkles size={18} />
                </span>
                <div>
                  <span className="spec-label">Concentración</span>
                  <strong className="spec-value">
                    {perfume.concentration_display || perfume.concentration}
                  </strong>
                </div>
              </div>

              <div className="spec-item">
                <span className="spec-icon">
                  <Users size={18} />
                </span>
                <div>
                  <span className="spec-label">Público / Género</span>
                  <strong className="spec-value">
                    {perfume.gender_display || perfume.gender}
                  </strong>
                </div>
              </div>

              <div className="spec-item">
                <span className="spec-icon">
                  <Calendar size={18} />
                </span>
                <div>
                  <span className="spec-label">Año de Lanzamiento</span>
                  <strong className="spec-value">
                    {perfume.release_year || "Edición Clásica"}
                  </strong>
                </div>
              </div>

              <div className="spec-item">
                <span className="spec-icon">
                  <Clock size={18} />
                </span>
                <div>
                  <span className="spec-label">Duración Estimada</span>
                  <strong className="spec-value">
                    {perfume.estimated_duration_display || perfume.estimated_duration}
                  </strong>
                </div>
              </div>

              <div className="spec-item">
                <span className="spec-icon">
                  <Wind size={18} />
                </span>
                <div>
                  <span className="spec-label">Proyección</span>
                  <strong className="spec-value">
                    {perfume.projection_display || perfume.projection}
                  </strong>
                </div>
              </div>

              <div className="spec-item">
                <span className="spec-icon">
                  <Sun size={18} />
                </span>
                <div>
                  <span className="spec-label">Estaciones Recomendadas</span>
                  <div className="spec-seasons">
                    {(perfume.recommended_seasons || []).length > 0 ? (
                      perfume.recommended_seasons.map((seasonKey) => (
                        <span key={seasonKey} className="season-chip">
                          {SEASON_LABELS[seasonKey] || seasonKey}
                        </span>
                      ))
                    ) : (
                      <strong className="spec-value">Todo el año</strong>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="detail-actions">
              <Button
                variant={isFav ? "primary" : "outline"}
                size="lg"
                onClick={handleFavoriteToggle}
                loading={pendingFav}
              >
                <Heart size={18} fill={isFav ? "#FFFFFF" : "transparent"} />
                <span>
                  {isFav ? "Guardado en tus Favoritos" : "Agregar a Favoritos"}
                </span>
              </Button>
            </div>
          </div>
        </section>

        {/* PIRÁMIDE OLFATIVA */}
        <OlfactoryPyramid pyramid={perfume.olfactory_pyramid} />

        {/* SECCIÓN DE RESEÑAS Y CALIFICACIONES */}
        <section className="detail-reviews-section">
          <div className="reviews-header">
            <div>
              <span className="section-eyebrow">Comunidad Olfativa</span>
              <h2 className="section-title">Reseñas y Experiencias</h2>
            </div>
            <div className="reviews-summary-badge">
              <StarRating value={perfume.average_rating || 0} size={18} />
              <strong>
                {perfume.average_rating !== null && perfume.average_rating !== undefined
                  ? Number(perfume.average_rating).toFixed(1)
                  : "—"}
              </strong>
              <span>({reviews.length} reseñas)</span>
            </div>
          </div>

          {reviewError && <ErrorMessage message={reviewError} />}
          {reviewSuccess && (
            <div className="success-banner" role="status">
              {reviewSuccess}
            </div>
          )}

          <div className="reviews-layout">
            {/* COLUMNA DE FORMULARIO DE RESEÑA */}
            <div className="review-form-col">
              <div className="review-form-card">
                <div className="review-form-title">
                  <MessageSquarePlus size={20} color="#B89B69" />
                  <h3>
                    {editingReviewId
                      ? "Editar tu reseña"
                      : userExistingReview
                      ? "Ya has calificado esta fragancia"
                      : "Comparte tu reseña"}
                  </h3>
                </div>

                {!isAuthenticated ? (
                  <div className="review-auth-prompt">
                    <p>
                      Inicia sesión para calificar esta fragancia y compartir cómo evoluciona en tu
                      piel.
                    </p>
                    <Link to="/login" className="btn btn-primary btn-full">
                      Iniciar sesión para reseñar
                    </Link>
                  </div>
                ) : userExistingReview && !editingReviewId ? (
                  <div className="review-already-box">
                    <p>
                      Ya publicaste una reseña para <strong>{perfume.name}</strong>. Puedes
                      modificarla o eliminarla cuando quieras.
                    </p>
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => handleStartEditReview(userExistingReview)}
                    >
                      Editar mi reseña
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="review-form">
                    <div className="form-field">
                      <label className="form-label">Tu calificación (1 a 5 estrellas)</label>
                      <StarRating
                        value={ratingInput}
                        onChange={setRatingInput}
                        interactive
                        size={26}
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor="review-comment" className="form-label">
                        Tu experiencia olfativa
                      </label>
                      <textarea
                        id="review-comment"
                        rows={4}
                        className="form-textarea"
                        placeholder="Describe el aroma, su fijación, proyección y en qué ocasión la recomiendas..."
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        required
                      />
                    </div>

                    <div className="review-form-buttons">
                      <Button
                        type="submit"
                        variant="primary"
                        loading={submittingReview}
                        fullWidth
                      >
                        <Send size={16} />
                        <span>
                          {editingReviewId ? "Guardar cambios" : "Publicar reseña"}
                        </span>
                      </Button>

                      {editingReviewId && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          fullWidth
                        >
                          Cancelar edición
                        </Button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* COLUMNA DE LISTADO DE RESEÑAS */}
            <div className="reviews-list-col">
              {reviews.length > 0 ? (
                <div className="reviews-list">
                  {reviews.map((rev) => (
                    <ReviewCard
                      key={rev.id}
                      review={rev}
                      currentUserId={user?.id}
                      onEdit={handleStartEditReview}
                      onDelete={handleDeleteReview}
                    />
                  ))}
                </div>
              ) : (
                <div className="reviews-empty-box">
                  <h4>Sé el primero en opinar sobre {perfume.name}</h4>
                  <p>
                    Aún no hay reseñas publicadas para esta fragancia. Comparte tu experiencia con
                    la comunidad de Aromatch.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

