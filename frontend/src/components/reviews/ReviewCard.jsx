import { Link } from "react-router-dom";
import { Edit3, Trash2, User } from "lucide-react";
import StarRating from "../common/StarRating";
import { formatDate } from "../../utils/helpers";

export default function ReviewCard({
  review,
  currentUserId,
  onEdit,
  onDelete,
  showPerfumeLink = false,
}) {
  if (!review) return null;

  const isOwner =
    currentUserId && Number(review.user?.id) === Number(currentUserId);

  const authorName =
    review.user?.first_name || review.user?.last_name
      ? `${review.user.first_name || ""} ${review.user.last_name || ""}`.trim()
      : review.user?.username || "Amante de la perfumería";

  return (
    <article className="review-card">
      <div className="review-card-header">
        <div className="review-author">
          <div className="review-avatar" aria-hidden="true">
            <User size={18} />
          </div>
          <div>
            <h4 className="review-author-name">
              {authorName}
              {isOwner && <span className="review-owner-tag">Tu reseña</span>}
            </h4>
            <span className="review-date">{formatDate(review.created_at)}</span>
          </div>
        </div>

        <div className="review-card-right">
          <StarRating value={review.rating} size={16} />
          {isOwner && (
            <div className="review-actions">
              {onEdit && (
                <button
                  type="button"
                  className="icon-action-btn"
                  onClick={() => onEdit(review)}
                  title="Editar mi reseña"
                >
                  <Edit3 size={15} />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  className="icon-action-btn danger"
                  onClick={() => onDelete(review.id)}
                  title="Eliminar mi reseña"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showPerfumeLink && review.perfume && (
        <div className="review-perfume-ref">
          <Link to={`/perfume/${review.perfume}`}>
            {review.brand_name ? `${review.brand_name} — ` : ""}
            <strong>{review.perfume_name || `Perfume #${review.perfume}`}</strong>
          </Link>
        </div>
      )}

      <p className="review-comment">{review.comment}</p>
    </article>
  );
}

