import axios from "axios";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api"
).replace(/\/+$/, "");

export const TOKEN_STORAGE_KEYS = {
  ACCESS: "aromatch_access_token",
  REFRESH: "aromatch_refresh_token",
};

export function getAccessToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEYS.ACCESS);
}

export function getRefreshToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEYS.REFRESH);
}

export function setAuthTokens({ access, refresh }) {
  if (access) {
    localStorage.setItem(TOKEN_STORAGE_KEYS.ACCESS, access);
  }
  if (refresh) {
    localStorage.setItem(TOKEN_STORAGE_KEYS.REFRESH, refresh);
  }
}

export function clearAuthTokens() {
  localStorage.removeItem(TOKEN_STORAGE_KEYS.ACCESS);
  localStorage.removeItem(TOKEN_STORAGE_KEYS.REFRESH);
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000,
});

// Interceptor de petición: adjunta el Access Token JWT si existe
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Control de cola para evitar múltiples solicitudes simultáneas de refresh ante varios 401
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      return Promise.reject(error);
    }

    const status = error.response.status;
    const requestUrl = originalRequest?.url || "";

    // No intentar refrescar token si el 401 proviene de login o del propio refresh
    const isAuthEndpoint =
      requestUrl.includes("/users/login/") ||
      requestUrl.includes("/users/token/refresh/") ||
      requestUrl.includes("/users/register/");

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        clearAuthTokens();
        window.dispatchEvent(new CustomEvent("aromatch:auth-expired"));
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/users/token/refresh/`,
          { refresh: refreshToken },
          { headers: { "Content-Type": "application/json" } }
        );

        const newAccessToken = refreshResponse.data.access;
        setAuthTokens({
          access: newAccessToken,
          refresh: refreshResponse.data.refresh || refreshToken,
        });

        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthTokens();
        window.dispatchEvent(new CustomEvent("aromatch:auth-expired"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

