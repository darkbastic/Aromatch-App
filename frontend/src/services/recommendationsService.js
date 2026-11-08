import api from "./api";

/**
 * Servicios de Preferencias Olfativas y Recomendaciones (/api/recommendations/)
 * Contrato: docs/API_BACKEND.md — Sección 7
 */
export const recommendationsService = {
  /**
   * GET /api/recommendations/preferences/
   */
  async getPreferences(params = {}) {
    const response = await api.get("/recommendations/preferences/", { params });
    return response.data;
  },

  /**
   * Obtiene todas las notas preferidas del usuario autenticado recorriendo páginas si aplica.
   */
  async getAllPreferences() {
    let allPrefs = [];
    let page = 1;
    let hasNext = true;

    while (hasNext) {
      const data = await this.getPreferences({ page });
      if (Array.isArray(data)) {
        return data;
      }
      allPrefs = [...allPrefs, ...(data.results || [])];
      hasNext = Boolean(data.next);
      page += 1;
    }
    return allPrefs;
  },

  /**
   * POST /api/recommendations/preferences/
   * Body: { note_id }
   */
  async addPreference(noteId) {
    const response = await api.post("/recommendations/preferences/", {
      note_id: Number(noteId),
    });
    return response.data;
  },

  /**
   * DELETE /api/recommendations/preferences/{id}/
   */
  async removePreference(preferenceId) {
    await api.delete(`/recommendations/preferences/${preferenceId}/`);
  },

  /**
   * GET /api/recommendations/
   * Devuelve: { has_preferences, preferred_notes_count, count, detail, results }
   */
  async getRecommendations() {
    const response = await api.get("/recommendations/");
    return response.data;
  },
};

