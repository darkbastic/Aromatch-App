import api from "./api";

/**
 * Servicios del Panel de Administración (/api/users/admin/stats/ y /api/users/admins/)
 */
export const adminService = {
  /**
   * GET /api/users/admin/stats/
   * Requiere: is_staff=True (Administrador o Superadministrador)
   */
  async getDashboardStats() {
    const response = await api.get("/users/admin/stats/");
    return response.data;
  },

  /**
   * GET /api/users/admins/
   * Requiere: is_superuser=True (Solo Superadministrador)
   */
  async getAdmins(params = {}) {
    const cleanParams = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        cleanParams[key] = value;
      }
    });
    const response = await api.get("/users/admins/", { params: cleanParams });
    return response.data;
  },

  /**
   * POST /api/users/admins/
   * Requiere: is_superuser=True (Solo Superadministrador)
   * Body: { username, email, first_name, last_name, password, password_confirm }
   */
  async createAdmin(adminData) {
    const response = await api.post("/users/admins/", adminData);
    return response.data;
  },
};

