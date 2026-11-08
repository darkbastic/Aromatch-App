import api from "./api";

/**
 * Servicios de Reseñas y Calificaciones (/api/reviews/)
 * Contrato: docs/API_BACKEND.md — Sección 6
 */
export const reviewsService = {
  /**
   * GET /api/reviews/
   */
  async getReviews(params = {}) {
    const response = await api.get("/reviews/", { params });
    return response.data;
  },

  /**
   * GET /api/reviews/perfume/{perfume_id}/
   */
  async getReviewsByPerfume(perfumeId, params = {}) {
    const response = await api.get(`/reviews/perfume/${perfumeId}/`, { params });
    return response.data;
  },

  /**
   * GET /api/reviews/my-reviews/
   */
  async getMyReviews(params = {}) {
    const response = await api.get("/reviews/my-reviews/", { params });
    return response.data;
  },

  /**
   * POST /api/reviews/
   * Body: { perfume, rating, comment }
   */
  async createReview({ perfume, rating, comment }) {
    const response = await api.post("/reviews/", {
      perfume: Number(perfume),
      rating: Number(rating),
      comment,
    });
    return response.data;
  },

  /**
   * PATCH /api/reviews/{id}/
   * Body: { rating, comment }
   */
  async updateReview(reviewId, { rating, comment }) {
    const response = await api.patch(`/reviews/${reviewId}/`, {
      rating: Number(rating),
      comment,
    });
    return response.data;
  },

  /**
   * DELETE /api/reviews/{id}/
   */
  async deleteReview(reviewId) {
    await api.delete(`/reviews/${reviewId}/`);
  },
};

