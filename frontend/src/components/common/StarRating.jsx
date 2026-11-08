import { useState } from "react";
import { Star } from "lucide-react";

export default function StarRating({
  value = 0,
  onChange,
  interactive = false,
  size = 18,
  showValue = false,
}) {
  const [hoverRating, setHoverRating] = useState(0);
  const displayRating = interactive && hoverRating > 0 ? hoverRating : Number(value) || 0;

  return (
    <div
      className={`star-rating ${interactive ? "is-interactive" : ""}`}
      role={interactive ? "radiogroup" : undefined}
      aria-label={interactive ? "Calificación en estrellas" : `Calificación ${displayRating} de 5`}
    >
      <div className="star-rating-icons">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = displayRating >= star - 0.25;
          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              className={`star-btn ${filled ? "filled" : ""}`}
              onClick={() => interactive && onChange && onChange(star)}
              onMouseEnter={() => interactive && setHoverRating(star)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              aria-label={`${star} ${star === 1 ? "estrella" : "estrellas"}`}
            >
              <Star
                size={size}
                fill={filled ? "#B89B69" : "transparent"}
                color={filled ? "#B89B69" : "#C9C0B1"}
              />
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className="star-rating-number">
          {value ? Number(value).toFixed(1) : "Sin reseñas"}
        </span>
      )}
    </div>
  );
}

