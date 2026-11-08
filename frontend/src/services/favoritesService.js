import api from "./api";

/**
 * Servicios de Favoritos (/api/favorites/)
 * Contrato: docs/API_BACKEND.md — Sección 5
 */
export const favoritesService = {
  /**
   * GET /api/favorites/
   */
  async getFavorites(params = {}) {
    const response = await api.get("/favorites/", { params });
    return response.data;
  },

  /**
   * Obtiene todos los favoritos del usuario autenticado (todas las páginas).
   */
  async getAllFavorites() {
    let allFavorites = [];
    let page = 1;
    let hasNext = true;

    while (hasNext) {
      const data = await this.getFavorites({ page });
      if (Array.isArray(data)) {
        return data;
      }
      allFavorites = [...allFavorites, ...(data.results || [])];
      hasNext = Boolean(data.next);
      page += 1;
    }
    return allFavorites;
  },

  /**
   * POST /api/favorites/
   * Body: { perfume_id }
   */
  async addFavorite(perfumeId) {
    const response = await api.post("/favorites/", { perfume_id: Number(perfumeId) });
    return response.data;
  },

  /**
   * DELETE /api/favorites/{id}/
   */
  async removeFavoriteById(favoriteId) {
    await api.delete(`/favorites/${favoriteId}/`);
  },

  /**
   * DELETE /api/favorites/perfume/{perfume_id}/
   */
  async removeFavoriteByPerfumeId(perfumeId) {
    await api.delete(`/favorites/perfume/${perfumeId}/`);
  },
};

