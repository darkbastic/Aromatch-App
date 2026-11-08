# Aromatch

Plataforma web de descubrimiento, catálogo, pirámides olfativas, reseñas y recomendaciones personalizadas de perfumes.

> **Importante:** Aromatch es una plataforma de descubrimiento y comunidad olfativa, no una tienda online (no incluye carrito de compras, pasarela de pagos ni gestión de inventario).

---

## Arquitectura del Proyecto

```text
aromatch/
├── backend/                  # API REST en Django 5.2 + Django REST Framework + SimpleJWT
│   ├── catalog/              # Marcas, notas olfativas, perfumes y pirámides olfativas
│   ├── favorites/            # Colección de perfumes favoritos por usuario
│   ├── reviews/              # Calificaciones (1 a 5 estrellas) y reseñas
│   ├── recommendations/      # Preferencias olfativas y motor de recomendaciones
│   ├── users/                # Registro, autenticación JWT (con blacklist) y perfil
│   ├── config/               # Configuración global de Django y CORS
│   ├── .env.example          # Plantilla de variables de entorno del backend
│   └── manage.py
├── frontend/                 # Aplicación SPA en React 18 + Vite + React Router + Axios
│   ├── src/
│   │   ├── components/       # Componentes reutilizables (common, layout, perfumes, reviews, recommendations)
│   │   ├── context/          # AuthContext y FavoritesContext
│   │   ├── hooks/            # Custom hooks (useAuth, useFavorites)
│   │   ├── layouts/          # MainLayout (Navbar + Outlet + Footer)
│   │   ├── pages/            # Home, Catalog, PerfumeDetail, Favorites, Recommendations, Preferences, Login, Register, Profile
│   │   ├── services/         # Cliente Axios con interceptor JWT y servicios por módulo
│   │   ├── styles/           # Sistema de diseño CSS3 (identidad editorial Aromatch)
│   │   └── utils/            # Constantes controladas, formateadores y fallbacks SVG
│   ├── .env.example          # Plantilla de variables de entorno del frontend
│   ├── package.json
│   └── vite.config.js
└── docs/
    └── API_BACKEND.md        # Contrato técnico completo de los 31 endpoints REST
```

---

## 1. Configuración y Ejecución del Backend (Django + Supabase)

1. **Abrir terminal en `backend/`, activar el entorno virtual e instalar dependencias:**
   ```powershell
   cd backend
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

2. **Configurar variables de entorno:**
   Copia `backend/.env.example` a `backend/.env` y completa las credenciales de conexión a **Supabase PostgreSQL**.

3. **Verificar el proyecto, aplicar migraciones y poblar catálogo base (idempotente):**
   ```powershell
   python manage.py check
   python manage.py migrate
   python manage.py seed_catalog
   ```

4. **Crear cuenta de Superadministrador inicial (para acceder a `/admin`):**
   ```powershell
   python manage.py createsuperuser
   ```
   *(Ingresa `username`, `email` y `password` cuando el asistente interactivo lo solicite).*

5. **Iniciar el servidor de desarrollo del Backend (`http://127.0.0.1:8000`):**
   ```powershell
   python manage.py runserver
   ```
   *(Si no activaste `.venv`, también puedes ejecutar directamente: `.\.venv\Scripts\python.exe manage.py runserver`).*

---

## 2. Configuración y Ejecución del Frontend (React + Vite)

1. **Abrir una nueva terminal en `frontend/` e instalar dependencias:**
   ```powershell
   cd frontend
   npm install
   ```

2. **Configurar variables de entorno:**
   Verifica el archivo `frontend/.env` (o copia `frontend/.env.example` a `frontend/.env`):
   ```env
   VITE_API_URL=http://127.0.0.1:8000/api
   ```

3. **Iniciar el servidor de desarrollo de Vite (`http://localhost:5173`):**
   ```powershell
   npm run dev
   ```

4. **Compilar para producción (verificación de build):**
   ```powershell
   npm run build
   ```

---

## 3. Rutas del Frontend y Endpoints Conectados

| Ruta en React | Página | Acceso | Endpoints del Backend Consumidos |
| :--- | :--- | :---: | :--- |
| `/` | Inicio (`HomePage`) | Público | `GET /api/catalog/perfumes/`, `GET /api/catalog/notes/` |
| `/catalogo` | Catálogo (`CatalogPage`) | Público | `GET /api/catalog/perfumes/` (búsqueda, filtros y paginación), `GET /api/catalog/brands/`, `GET /api/catalog/notes/` |
| `/perfume/:id` | Detalle (`PerfumeDetailPage`) | Público / Mixto | `GET /api/catalog/perfumes/{id}/`, `GET /api/reviews/perfume/{id}/`, `POST/PATCH/DELETE /api/reviews/`, `POST/DELETE /api/favorites/` |
| `/favoritos` | Favoritos (`FavoritesPage`) | Protegido (`JWT`) | `GET /api/favorites/`, `DELETE /api/favorites/{id}/`, `DELETE /api/favorites/perfume/{perfume_id}/` |
| `/recomendaciones` | Recomendaciones (`RecommendationsPage`) | Protegido (`JWT`) | `GET /api/recommendations/` |
| `/preferencias` | Preferencias (`PreferencesPage`) | Protegido (`JWT`) | `GET /api/recommendations/preferences/`, `POST /api/recommendations/preferences/`, `DELETE /api/recommendations/preferences/{id}/`, `GET /api/catalog/notes/` |
| `/login` | Login (`LoginPage`) | Público | `POST /api/users/login/`, `GET /api/users/me/` |
| `/registro` | Registro (`RegisterPage`) | Público | `POST /api/users/register/`, `POST /api/users/login/` |
| `/perfil` | Perfil (`ProfilePage`) | Protegido (`JWT`) | `GET /api/users/me/`, `PATCH /api/users/me/`, `GET /api/reviews/my-reviews/`, `POST /api/users/logout/` |
| `/admin` | Dashboard Administrativo (`AdminDashboardPage`) | Admin (`is_staff=True`) | `GET /api/users/admin/stats/` |
| `/admin/perfumes` | Gestión de Perfumes (`AdminPerfumesPage`) | Admin (`is_staff=True`) | `GET/POST/PATCH/DELETE /api/catalog/perfumes/`, `GET /api/catalog/brands/`, `GET /api/catalog/notes/` |
| `/admin/marcas` | Gestión de Marcas (`AdminBrandsPage`) | Admin (`is_staff=True`) | `GET/POST/PATCH/DELETE /api/catalog/brands/` |
| `/admin/notas` | Gestión de Notas (`AdminNotesPage`) | Admin (`is_staff=True`) | `GET/POST/PATCH/DELETE /api/catalog/notes/` |
| `/admin/administradores` | Gestión de Administradores (`AdminUsersPage`) | Superadmin (`is_superuser=True`) | `GET /api/users/admins/`, `POST /api/users/admins/` |

---

## Documentación Técnica de la API

Consulta la especificación detallada de todos los endpoints, parámetros, payloads y permisos en [`docs/API_BACKEND.md`](docs/API_BACKEND.md).
