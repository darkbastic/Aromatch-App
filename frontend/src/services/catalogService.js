import api from "./api";

/**
 * Servicios del Catálogo (/api/catalog/)
 * Incluye operaciones de lectura pública y CRUD administrativo (is_staff=True).
 */
export const catalogService = {
  /**
   * GET /api/catalog/perfumes/
   */
  async getPerfumes(params = {}) {
    const cleanParams = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        cleanParams[key] = value;
      }
    });
    const response = await api.get("/catalog/perfumes/", { params: cleanParams });
    return response.data;
  },

  /**
   * GET /api/catalog/perfumes/{id}/
   */
  async getPerfumeById(id) {
    const response = await api.get(`/catalog/perfumes/${id}/`);
    return response.data;
  },

  /**
   * POST /api/catalog/perfumes/ (Solo Administradores)
   */
  async createPerfume(perfumeData) {
    const response = await api.post("/catalog/perfumes/", perfumeData);
    return response.data;
  },

  /**
   * PATCH /api/catalog/perfumes/{id}/ (Solo Administradores)
   */
  async updatePerfume(id, perfumeData) {
    const response = await api.patch(`/catalog/perfumes/${id}/`, perfumeData);
    return response.data;
  },

  /**
   * DELETE /api/catalog/perfumes/{id}/ (Solo Administradores)
   */
  async deletePerfume(id) {
    await api.delete(`/catalog/perfumes/${id}/`);
  },

  /**
   * GET /api/catalog/brands/
   */
  async getBrands(params = {}) {
    const cleanParams = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        cleanParams[key] = value;
      }
    });
    const response = await api.get("/catalog/brands/", { params: cleanParams });
    return response.data;
  },

  /**
   * Obtiene todas las marcas disponibles en el catálogo (desempaquetando paginación).
   */
  async getAllBrands() {
    let allBrands = [];
    let page = 1;
    let hasNext = true;

    while (hasNext) {
      const data = await this.getBrands({ page, ordering: "name" });
      if (Array.isArray(data)) {
        return data;
      }
      allBrands = [...allBrands, ...(data.results || [])];
      hasNext = Boolean(data.next);
      page += 1;
    }
    return allBrands;
  },

  /**
   * POST /api/catalog/brands/ (Solo Administradores)
   */
  async createBrand(brandData) {
    const response = await api.post("/catalog/brands/", brandData);
    return response.data;
  },

  /**
   * PATCH /api/catalog/brands/{id}/ (Solo Administradores)
   */
  async updateBrand(id, brandData) {
    const response = await api.patch(`/catalog/brands/${id}/`, brandData);
    return response.data;
  },

  /**
   * DELETE /api/catalog/brands/{id}/ (Solo Administradores)
   */
  async deleteBrand(id) {
    await api.delete(`/catalog/brands/${id}/`);
  },

  /**
   * GET /api/catalog/notes/
   */
  async getNotes(params = {}) {
    const cleanParams = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        cleanParams[key] = value;
      }
    });
    const response = await api.get("/catalog/notes/", { params: cleanParams });
    return response.data;
  },

  /**
   * Obtiene todas las notas olfativas del catálogo recorriendo las páginas si hay más de 12.
   */
  async getAllNotes(params = {}) {
    let allNotes = [];
    let page = 1;
    let hasNext = true;

    while (hasNext) {
      const data = await this.getNotes({ ...params, page, ordering: "name" });
      if (Array.isArray(data)) {
        return data;
      }
      allNotes = [...allNotes, ...(data.results || [])];
      hasNext = Boolean(data.next);
      page += 1;
    }
    return allNotes;
  },

  /**
   * POST /api/catalog/notes/ (Solo Administradores)
   */
  async createNote(noteData) {
    const response = await api.post("/catalog/notes/", noteData);
    return response.data;
  },

  /**
   * PATCH /api/catalog/notes/{id}/ (Solo Administradores)
   */
  async updateNote(id, noteData) {
    const response = await api.patch(`/catalog/notes/${id}/`, noteData);
    return response.data;
  },

  /**
   * DELETE /api/catalog/notes/{id}/ (Solo Administradores)
   */
  async deleteNote(id) {
    await api.delete(`/catalog/notes/${id}/`);
  },
};
