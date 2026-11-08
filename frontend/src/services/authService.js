import api, { clearAuthTokens, getRefreshToken, setAuthTokens } from "./api";

/**
 * Servicios de Autenticación y Perfil (/api/users/)
 * Contrato: docs/API_BACKEND.md — Sección 3
 */
export const authService = {
  /**
   * POST /api/users/register/
   * Body: { username, email, first_name, last_name, password, password_confirm }
   */
  async register(userData) {
    const response = await api.post("/users/register/", userData);
    return response.data;
  },

  /**
   * POST /api/users/login/
   * Body: { username, password }
   * Respuesta: { access, refresh }
   */
  async login(credentials) {
    const response = await api.post("/users/login/", credentials);
    const { access, refresh } = response.data;
    setAuthTokens({ access, refresh });
    return response.data;
  },

  /**
   * POST /api/users/logout/
   * Body: { refresh } (requiere Authorization: Bearer <access_token>)
   */
  async logout() {
    const refresh = getRefreshToken();
    try {
      if (refresh) {
        await api.post("/users/logout/", { refresh });
      }
    } finally {
      clearAuthTokens();
    }
  },

  /**
   * GET /api/users/me/
   */
  async getProfile() {
    const response = await api.get("/users/me/");
    return response.data;
  },

  /**
   * PATCH /api/users/me/
   * Body: { first_name, last_name, email }
   */
  async updateProfile(profileData) {
    const response = await api.patch("/users/me/", profileData);
    return response.data;
  },
};

