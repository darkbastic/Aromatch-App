# Documentación Técnica de la API REST — Aromatch Backend (Guía Completa para React)

## 1. Configuración Base para el Frontend (React)

- **Base URL local del Backend:** `http://localhost:8000` (o `http://127.0.0.1:8000`)
- **Panel de Administración (Django Admin):** `http://localhost:8000/admin/`
- **Orígenes CORS permitidos (`CORS_ALLOWED_ORIGINS`):**
  - `http://localhost:5173` (Vite React)
  - `http://localhost:3000` (Create React App / Next.js)
- **Cabeceras estándar para peticiones desde React:**
  ```javascript
  const headers = {
    "Content-Type": "application/json",
    // En endpoints privados o acciones autenticadas:
    "Authorization": `Bearer ${accessToken}`,
  };
  ```
- **Formato de paginación global (`PAGE_SIZE = 12`):**
  Todos los listados paginados (`brands`, `notes`, `perfumes`, `favorites`, `reviews`, `preferences`) devuelven la estructura estándar de DRF:
  ```json
  {
    "count": 25,
    "next": "http://localhost:8000/api/catalog/perfumes/?page=2",
    "previous": null,
    "results": [ ... ]
  }
  ```

---

## 2. Índice General de Endpoints (31 rutas activas)

| Módulo | Método | Endpoint | Permiso | Descripción |
| :--- | :---: | :--- | :--- | :--- |
| **Users** | `POST` | `/api/users/register/` | Público (`AllowAny`) | Registrar nuevo usuario |
| **Users** | `POST` | `/api/users/login/` | Público (`AllowAny`) | Iniciar sesión y obtener par JWT (`access`, `refresh`) |
| **Users** | `POST` | `/api/users/token/refresh/` | Público (`AllowAny`) | Renovar el `access` token usando `refresh` |
| **Users** | `POST` | `/api/users/logout/` | `IsAuthenticated` | Cerrar sesión e invalidar `refresh` token en blacklist |
| **Users** | `GET` | `/api/users/me/` | `IsAuthenticated` | Obtener perfil del usuario autenticado |
| **Users** | `PUT` / `PATCH` | `/api/users/me/` | `IsAuthenticated` | Actualizar datos del perfil autenticado |
| **Catalog** | `GET` | `/api/catalog/brands/` | Público | Listar marcas (paginado, búsqueda y ordenamiento) |
| **Catalog** | `POST` | `/api/catalog/brands/` | Admin (`is_staff`) | Crear una marca |
| **Catalog** | `GET` | `/api/catalog/brands/{id}/` | Público | Obtener detalle de una marca |
| **Catalog** | `PUT` / `PATCH` | `/api/catalog/brands/{id}/` | Admin (`is_staff`) | Actualizar una marca |
| **Catalog** | `DELETE` | `/api/catalog/brands/{id}/` | Admin (`is_staff`) | Eliminar una marca (protegida si tiene perfumes) |
| **Catalog** | `GET` | `/api/catalog/notes/` | Público | Listar notas olfativas (filtro `?family=`, `?search=`) |
| **Catalog** | `POST` | `/api/catalog/notes/` | Admin (`is_staff`) | Crear una nota olfativa |
| **Catalog** | `GET` | `/api/catalog/notes/{id}/` | Público | Obtener detalle de una nota olfativa |
| **Catalog** | `PUT` / `PATCH` | `/api/catalog/notes/{id}/` | Admin (`is_staff`) | Actualizar una nota olfativa |
| **Catalog** | `DELETE` | `/api/catalog/notes/{id}/` | Admin (`is_staff`) | Eliminar una nota (protegida si está en uso) |
| **Catalog** | `GET` | `/api/catalog/perfumes/` | Público | Listar perfumes con búsqueda y filtros avanzados |
| **Catalog** | `POST` | `/api/catalog/perfumes/` | Admin (`is_staff`) | Crear un perfume junto con su pirámide olfativa |
| **Catalog** | `GET` | `/api/catalog/perfumes/{id}/` | Público | Obtener ficha completa y pirámide olfativa del perfume |
| **Catalog** | `PUT` / `PATCH` | `/api/catalog/perfumes/{id}/` | Admin (`is_staff`) | Actualizar un perfume y/o sus notas olfativas |
| **Catalog** | `DELETE` | `/api/catalog/perfumes/{id}/` | Admin (`is_staff`) | Eliminar un perfume |
| **Favorites** | `GET` | `/api/favorites/` | `IsAuthenticated` | Listar colección de favoritos del usuario autenticado |
| **Favorites** | `POST` | `/api/favorites/` | `IsAuthenticated` | Agregar un perfume a favoritos |
| **Favorites** | `GET` | `/api/favorites/{id}/` | `IsAuthenticated` | Consultar un registro de favorito propio por su ID |
| **Favorites** | `DELETE` | `/api/favorites/{id}/` | `IsAuthenticated` | Eliminar un favorito por el ID del registro `Favorite` |
| **Favorites** | `DELETE` | `/api/favorites/perfume/{perfume_id}/` | `IsAuthenticated` | Eliminar un favorito directamente por el ID del perfume |
| **Reviews** | `GET` | `/api/reviews/` | Público | Listar reseñas públicas (filtros `?perfume=`, `?rating=`, `?mine=true`) |
| **Reviews** | `POST` | `/api/reviews/` | `IsAuthenticated` | Publicar una reseña (1 por usuario y perfume, `rating` 1..5) |
| **Reviews** | `GET` | `/api/reviews/{id}/` | Público | Consultar el detalle de una reseña específica |
| **Reviews** | `PUT` / `PATCH` | `/api/reviews/{id}/` | Autor (`IsOwnerOrReadOnly`) | Modificar calificación o comentario de una reseña propia |
| **Reviews** | `DELETE` | `/api/reviews/{id}/` | Autor (`IsOwnerOrReadOnly`) | Eliminar una reseña propia |
| **Reviews** | `GET` | `/api/reviews/perfume/{perfume_id}/` | Público | Listar todas las reseñas de un perfume específico |
| **Reviews** | `GET` | `/api/reviews/my-reviews/` | `IsAuthenticated` | Listar todas las reseñas del usuario autenticado |
| **Recommendations** | `GET` | `/api/recommendations/preferences/` | `IsAuthenticated` | Listar notas olfativas preferidas del usuario autenticado |
| **Recommendations** | `POST` | `/api/recommendations/preferences/` | `IsAuthenticated` | Agregar una nota olfativa a las preferencias del usuario |
| **Recommendations** | `GET` | `/api/recommendations/preferences/{id}/` | `IsAuthenticated` | Consultar el detalle de una preferencia propia por su ID |
| **Recommendations** | `DELETE` | `/api/recommendations/preferences/{id}/` | `IsAuthenticated` | Eliminar una nota preferida por el ID de la preferencia |
| **Recommendations** | `GET` | `/api/recommendations/` | `IsAuthenticated` | Obtener recomendaciones personalizadas basadas en notas |

---

## 3. Autenticación y Usuarios (`/api/users/`)

### 3.1. Registro de usuario
- **Endpoint:** `POST /api/users/register/`
- **Permiso:** Público (`AllowAny`)
- **Body (JSON):**
  ```json
  {
    "username": "camila_aroma",
    "email": "camila@aromatch.cl",
    "first_name": "Camila",
    "last_name": "Soto",
    "password": "MiPasswordSeguro2026!",
    "password_confirm": "MiPasswordSeguro2026!"
  }
  ```
- **Respuesta exitosa (`201 Created`):**
  ```json
  {
    "id": 1,
    "username": "camila_aroma",
    "email": "camila@aromatch.cl",
    "first_name": "Camila",
    "last_name": "Soto"
  }
  ```
- **Errores posibles (`400 Bad Request`):** Email ya registrado, `username` duplicado o `password` y `password_confirm` no coinciden.

### 3.2. Inicio de sesión (Login JWT)
- **Endpoint:** `POST /api/users/login/`
- **Permiso:** Público (`AllowAny`)
- **Body (JSON):**
  ```json
  {
    "username": "camila_aroma",
    "password": "MiPasswordSeguro2026!"
  }
  ```
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "refresh": "eyJhbGciOiJIUzI1NiIs...",
    "access": "eyJhbGciOiJIUzI1NiIs..."
  }
  ```

### 3.3. Refrescar Access Token
- **Endpoint:** `POST /api/users/token/refresh/`
- **Permiso:** Público (`AllowAny`)
- **Body (JSON):**
  ```json
  {
    "refresh": "<refresh_token>"
  }
  ```
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "access": "<nuevo_access_token>"
  }
  ```
- **Errores posibles (`401 Unauthorized`):** Token expirado, inválido o enviado a blacklist tras logout.

### 3.4. Cerrar sesión (Logout con Blacklist)
- **Endpoint:** `POST /api/users/logout/`
- **Permiso:** `IsAuthenticated` (requiere `Authorization: Bearer <access_token>`)
- **Body (JSON):**
  ```json
  {
    "refresh": "<refresh_token>"
  }
  ```
- **Respuesta exitosa (`205 Reset Content`):**
  ```json
  {
    "detail": "Sesión cerrada correctamente."
  }
  ```
- **Errores posibles (`400 Bad Request`):** `{"refresh": ["El token es inválido, ha expirado o ya fue invalidado."]}`.

### 3.5. Consultar y actualizar perfil del usuario autenticado
- **Endpoints:**
  - `GET /api/users/me/` (Consultar perfil)
  - `PATCH /api/users/me/` (Actualización parcial)
  - `PUT /api/users/me/` (Actualización completa de campos editables)
- **Permiso:** `IsAuthenticated`
- **Body para `PATCH` / `PUT` (JSON):**
  ```json
  {
    "first_name": "Camila Andrea",
    "last_name": "Soto",
    "email": "camila@aromatch.cl"
  }
  ```
  *(Nota: `id`, `username`, `is_staff`, `is_superuser` y `date_joined` son de solo lectura).*
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "id": 1,
    "username": "camila_aroma",
    "email": "camila@aromatch.cl",
    "first_name": "Camila Andrea",
    "last_name": "Soto",
    "is_staff": false,
    "is_superuser": false,
    "date_joined": "2026-11-08T05:12:02.231517-03:00"
  }
  ```

### 3.6. Estadísticas del Panel de Administración
- **Endpoint:** `GET /api/users/admin/stats/`
- **Permiso:** `IsStaffAdmin` (requiere usuario autenticado con `is_staff=True`)
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "total_perfumes": 10,
    "total_brands": 6,
    "total_notes": 12,
    "total_admins": 2
  }
  ```

### 3.7. Gestión de Administradores (Exclusivo Superadministradores)
- **Endpoints:**
  - `GET /api/users/admins/` (Listar cuentas administrativas con `is_staff=True`)
  - `POST /api/users/admins/` (Crear nuevo administrador con `is_staff=True` e `is_superuser=False`)
- **Permiso:** `IsSuperUser` (requiere usuario autenticado con `is_superuser=True`; administradores normales o usuarios regulares reciben `403 Forbidden`)
- **Body para `POST /api/users/admins/` (JSON):**
  ```json
  {
    "username": "admin_catalogo",
    "email": "catalogo@aromatch.cl",
    "first_name": "Valentina",
    "last_name": "Rojas",
    "password": "PasswordAdmin2026!",
    "password_confirm": "PasswordAdmin2026!"
  }
  ```
- **Respuesta exitosa (`201 Created`):**
  ```json
  {
    "id": 5,
    "username": "admin_catalogo",
    "email": "catalogo@aromatch.cl",
    "first_name": "Valentina",
    "last_name": "Rojas",
    "is_staff": true,
    "is_superuser": false,
    "is_active": true,
    "date_joined": "2026-11-08T15:00:00-03:00"
  }
  ```

---

## 4. Catálogo de Marcas, Notas y Perfumes (`/api/catalog/`)

### 4.1. Marcas (`/api/catalog/brands/`)
- **Listar marcas:** `GET /api/catalog/brands/` (Público, paginado)
  - Parámetros opcionales: `?search=<nombre_o_pais>`, `?ordering=name|-name|created_at|-created_at`, `?page=<n>`
- **Detalle de marca:** `GET /api/catalog/brands/{id}/` (Público)
- **Crear marca:** `POST /api/catalog/brands/` (Solo Admin `is_staff=True`)
- **Actualizar marca:** `PUT /api/catalog/brands/{id}/` o `PATCH /api/catalog/brands/{id}/` (Solo Admin `is_staff=True`)
  - **Body de escritura (`POST` / `PUT` / `PATCH`):**
    ```json
    {
      "name": "Dior",
      "country": "Francia",
      "description": "Casa de alta perfumería francesa.",
      "logo_url": "https://ejemplo.com/dior.png"
    }
    ```
  - **Respuesta (`200 OK` / `201 Created`):**
    ```json
    {
      "id": 1,
      "name": "Dior",
      "country": "Francia",
      "description": "Casa de alta perfumería francesa.",
      "logo_url": "https://ejemplo.com/dior.png",
      "created_at": "2026-11-08T05:00:00-03:00",
      "updated_at": "2026-11-08T05:00:00-03:00"
    }
    ```
- **Eliminar marca:** `DELETE /api/catalog/brands/{id}/` (Solo Admin `is_staff=True`)
  - Respuesta exitosa: `204 No Content`.
  - Si tiene perfumes asociados (`on_delete=PROTECT`): `400 Bad Request` con `{"detail": "No se puede eliminar esta marca porque tiene perfumes asociados en el catálogo."}`.

---

### 4.2. Notas Olfativas (`/api/catalog/notes/`)
- **Listar notas:** `GET /api/catalog/notes/` (Público, paginado)
  - Parámetros opcionales:
    - `?search=<nombre_o_familia>`
    - `?family=<familia_exacta>` (ej. `?family=Cítrica`, insensible a mayúsculas)
    - `?ordering=name|-name|family|-family|created_at|-created_at`
    - `?page=<n>`
- **Detalle de nota:** `GET /api/catalog/notes/{id}/` (Público)
- **Crear nota:** `POST /api/catalog/notes/` (Solo Admin `is_staff=True`)
- **Actualizar nota:** `PUT /api/catalog/notes/{id}/` o `PATCH /api/catalog/notes/{id}/` (Solo Admin `is_staff=True`)
  - **Body de escritura (`POST` / `PUT` / `PATCH`):**
    ```json
    {
      "name": "Bergamota",
      "family": "Cítrica",
      "description": "Nota cítrica fresca, luminosa y ligeramente floral."
    }
    ```
  - **Respuesta (`200 OK` / `201 Created`):**
    ```json
    {
      "id": 1,
      "name": "Bergamota",
      "family": "Cítrica",
      "description": "Nota cítrica fresca, luminosa y ligeramente floral.",
      "created_at": "2026-11-08T05:00:00-03:00",
      "updated_at": "2026-11-08T05:00:00-03:00"
    }
    ```
- **Eliminar nota:** `DELETE /api/catalog/notes/{id}/` (Solo Admin `is_staff=True`)
  - Respuesta exitosa: `204 No Content`.
  - Si está asociada a un perfume o preferencia (`on_delete=PROTECT`): `400 Bad Request` con `{"detail": "No se puede eliminar esta nota olfativa porque está en uso por perfumes o preferencias de usuarios."}`.

---

### 4.3. Perfumes (`/api/catalog/perfumes/`)

#### A) Listar y filtrar perfumes
- **Endpoint:** `GET /api/catalog/perfumes/` (Público, paginado)
- **Parámetros de búsqueda y filtrado combinables:**
  - `?search=<texto>` — Busca en `name`, `brand.name` y `description`.
  - `?brand=<id_o_nombre>` — Filtra por ID numérico de marca (`?brand=1`) o por nombre exacto (`?brand=Dior`).
  - `?brand_name=<nombre>` — Filtra por nombre exacto de marca (`?brand_name=Chanel`).
  - `?concentration=EDC|EDT|EDP|PARFUM|EXTRAIT`
  - `?gender=MASCULINE|FEMININE|UNISEX`
  - `?season=SPRING|SUMMER|AUTUMN|WINTER` — Filtra perfumes cuyo arreglo `recommended_seasons` contenga la estación indicada.
  - `?estimated_duration=WEAK|MODERATE|LONG_LASTING|ETERNAL` *(también acepta el alias `?duration=`)*
  - `?projection=INTIMATE|MODERATE|STRONG|ENORMOUS`
  - `?note=<id>` — Filtra perfumes que contengan la nota indicada.
  - `?notes=1,2,3` — Filtra perfumes que contengan cualquiera de las notas indicadas (separadas por coma).
  - `?ordering=name|-name|brand__name|-brand__name|release_year|-release_year|average_rating|-average_rating|created_at|-created_at`
  - `?page=<n>`
- **Respuesta de cada elemento en `results` (`PerfumeListSerializer`):**
  ```json
  {
    "id": 1,
    "name": "Sauvage",
    "brand": {
      "id": 1,
      "name": "Dior",
      "country": "Francia",
      "description": "Casa de alta perfumería francesa.",
      "logo_url": null,
      "created_at": "2026-11-08T05:00:00-03:00",
      "updated_at": "2026-11-08T05:00:00-03:00"
    },
    "concentration": "EDP",
    "concentration_display": "Eau de Parfum",
    "gender": "MASCULINE",
    "gender_display": "Masculino",
    "release_year": 2018,
    "recommended_seasons": ["SPRING", "AUTUMN", "WINTER"],
    "estimated_duration": "LONG_LASTING",
    "estimated_duration_display": "Duradera (6 - 8 horas)",
    "projection": "STRONG",
    "projection_display": "Fuerte",
    "image_url": null,
    "average_rating": 4.5,
    "reviews_count": 2,
    "created_at": "2026-11-08T05:00:00-03:00"
  }
  ```

#### B) Consultar el detalle de un perfume
- **Endpoint:** `GET /api/catalog/perfumes/{id}/` (Público)
- **Respuesta exitosa (`200 OK` — `PerfumeDetailSerializer`):**
  Incluye tanto `olfactory_pyramid` (agrupada en `top`, `heart`, `base` lista para renderizar en React) como el listado detallado `perfume_notes`:
  ```json
  {
    "id": 1,
    "name": "Sauvage",
    "brand": {
      "id": 1,
      "name": "Dior",
      "country": "Francia",
      "description": "Casa de alta perfumería francesa.",
      "logo_url": null,
      "created_at": "2026-11-08T05:00:00-03:00",
      "updated_at": "2026-11-08T05:00:00-03:00"
    },
    "description": "Fragancia fresca, especiada y ambarada.",
    "concentration": "EDP",
    "concentration_display": "Eau de Parfum",
    "gender": "MASCULINE",
    "gender_display": "Masculino",
    "release_year": 2018,
    "recommended_seasons": ["SPRING", "AUTUMN", "WINTER"],
    "estimated_duration": "LONG_LASTING",
    "estimated_duration_display": "Duradera (6 - 8 horas)",
    "projection": "STRONG",
    "projection_display": "Fuerte",
    "image_url": null,
    "perfume_notes": [
      {
        "id": 1,
        "note": {
          "id": 1,
          "name": "Bergamota",
          "family": "Cítrica",
          "description": "Nota cítrica fresca."
        },
        "note_type": "TOP",
        "note_type_display": "Salida"
      }
    ],
    "olfactory_pyramid": {
      "top": [{"id": 1, "name": "Bergamota", "family": "Cítrica", "description": "Nota cítrica fresca."}],
      "heart": [{"id": 2, "name": "Lavanda", "family": "Aromática", "description": "Nota aromática limpia."}],
      "base": [{"id": 3, "name": "Vainilla", "family": "Oriental", "description": "Nota cálida y dulce."}]
    },
    "average_rating": 4.5,
    "reviews_count": 2,
    "created_at": "2026-11-08T05:00:00-03:00",
    "updated_at": "2026-11-08T05:00:00-03:00"
  }
  ```

#### C) Crear, actualizar y eliminar un perfume (Solo Administradores `is_staff=True`)
- **Endpoints:**
  - `POST /api/catalog/perfumes/` (Crear perfume)
  - `PUT /api/catalog/perfumes/{id}/` (Actualización completa)
  - `PATCH /api/catalog/perfumes/{id}/` (Actualización parcial)
  - `DELETE /api/catalog/perfumes/{id}/` (Eliminar perfume — devuelve `204 No Content`)
- **Body de escritura (`POST` / `PUT` / `PATCH`):**
  Utiliza `brand_id` para asociar la marca y `notes_input` (opcional) para definir o reemplazar la pirámide olfativa (`note_type`: `"TOP"`, `"HEART"` o `"BASE"`):
  ```json
  {
    "name": "Sauvage",
    "brand_id": 1,
    "description": "Fragancia fresca, especiada y ambarada.",
    "concentration": "EDP",
    "gender": "MASCULINE",
    "release_year": 2018,
    "recommended_seasons": ["SPRING", "AUTUMN", "WINTER"],
    "estimated_duration": "LONG_LASTING",
    "projection": "STRONG",
    "image_url": null,
    "notes_input": [
      {"note": 1, "note_type": "TOP"},
      {"note": 2, "note_type": "HEART"},
      {"note": 3, "note_type": "BASE"}
    ]
  }
  ```

---

## 5. Favoritos (`/api/favorites/`)

Todos los endpoints requieren autenticación JWT (`Authorization: Bearer <access_token>`). Cada usuario solo ve y administra sus propios favoritos.

### 5.1. Listar mis favoritos
- **Endpoint:** `GET /api/favorites/` (Paginado)
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "count": 1,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": 10,
        "perfume": {
          "id": 1,
          "name": "Sauvage",
          "brand": {"id": 1, "name": "Dior", "country": "Francia", "description": "...", "logo_url": null},
          "concentration": "EDP",
          "concentration_display": "Eau de Parfum",
          "gender": "MASCULINE",
          "gender_display": "Masculino",
          "release_year": 2018,
          "recommended_seasons": ["SPRING", "AUTUMN", "WINTER"],
          "estimated_duration": "LONG_LASTING",
          "estimated_duration_display": "Duradera (6 - 8 horas)",
          "projection": "STRONG",
          "projection_display": "Fuerte",
          "image_url": null,
          "average_rating": 4.5,
          "reviews_count": 2,
          "created_at": "2026-11-08T05:00:00-03:00"
        },
        "created_at": "2026-11-08T05:20:00-03:00"
      }
    ]
  }
  ```

### 5.2. Consultar un favorito por ID
- **Endpoint:** `GET /api/favorites/{id}/`
- **Respuesta exitosa (`200 OK`):** Devuelve el objeto `Favorite` individual con el mismo formato del listado.

### 5.3. Agregar un perfume a favoritos
- **Endpoint:** `POST /api/favorites/`
- **Body (JSON):**
  ```json
  {
    "perfume_id": 1
  }
  ```
  *(También acepta `{"perfume": 1}` para mayor comodidad).*
- **Respuesta exitosa (`201 Created`):** Devuelve el registro `Favorite` creado con el objeto `perfume` anidado.
- **Error si ya está en favoritos (`400 Bad Request`):**
  ```json
  {
    "perfume_id": ["Este perfume ya se encuentra en tu colección de favoritos."]
  }
  ```

### 5.4. Eliminar un favorito por ID del registro `Favorite`
- **Endpoint:** `DELETE /api/favorites/{id}/`
- **Respuesta exitosa:** `204 No Content`.

### 5.5. Eliminar un favorito directamente por ID del perfume
- **Endpoint:** `DELETE /api/favorites/perfume/{perfume_id}/`
- **Respuesta exitosa:** `204 No Content`.
- **Error si el perfume no estaba en favoritos (`404 Not Found`):**
  ```json
  {
    "detail": "Este perfume no se encuentra en tus favoritos."
  }
  ```

---

## 6. Reseñas y Calificaciones (`/api/reviews/`)

### 6.1. Listar reseñas públicas
- **Endpoint:** `GET /api/reviews/` (Público, paginado)
- **Parámetros opcionales:**
  - `?perfume=<id>` — Filtra reseñas de un perfume específico.
  - `?rating=<1..5>` — Filtra por calificación exacta.
  - `?mine=true` — Si el usuario envía token JWT, filtra únicamente sus propias reseñas.
  - `?ordering=created_at|-created_at|rating|-rating` (por defecto `-created_at`).
  - `?page=<n>`
- **Estructura de cada reseña (`ReviewSerializer`):**
  ```json
  {
    "id": 5,
    "user": {
      "id": 1,
      "username": "camila_aroma",
      "first_name": "Camila",
      "last_name": "Soto"
    },
    "perfume": 1,
    "perfume_name": "Sauvage",
    "brand_name": "Dior",
    "rating": 5,
    "comment": "Excelente fijación y proyección para invierno.",
    "created_at": "2026-11-08T05:25:00-03:00",
    "updated_at": "2026-11-08T05:25:00-03:00"
  }
  ```

### 6.2. Consultar una reseña específica por ID
- **Endpoint:** `GET /api/reviews/{id}/` (Público)
- **Respuesta exitosa (`200 OK`):** Devuelve el objeto `Review` individual.

### 6.3. Listar reseñas de un perfume específico
- **Endpoint:** `GET /api/reviews/perfume/{perfume_id}/` (Público, paginado)
- **Comportamiento:** Verifica que el perfume exista (`404 Not Found` si no existe) y devuelve sus reseñas paginadas (admite `?ordering=rating|-rating|created_at|-created_at`).

### 6.4. Listar mis reseñas (usuario autenticado)
- **Endpoint:** `GET /api/reviews/my-reviews/` (`IsAuthenticated`, paginado)
- **Comportamiento:** Devuelve exclusivamente las reseñas escritas por el usuario autenticado.

### 6.5. Crear una reseña
- **Endpoint:** `POST /api/reviews/` (`IsAuthenticated`)
- **Body (JSON):**
  ```json
  {
    "perfume": 1,
    "rating": 5,
    "comment": "Excelente fijación y proyección para invierno."
  }
  ```
- **Reglas de validación:**
  - `rating` debe ser un entero entre `1` y `5`.
  - `comment` no puede estar vacío ni contener solo espacios.
  - Solo se permite **1 reseña por usuario y perfume**. Si ya existe, responde `400 Bad Request`:
    ```json
    {
      "perfume": ["Ya has publicado una reseña para este perfume. Puedes editar o eliminar tu reseña existente."]
    }
    ```
- **Respuesta exitosa (`201 Created`):** Devuelve la reseña creada y actualiza en tiempo real `average_rating` y `reviews_count` del perfume.

### 6.6. Modificar una reseña propia
- **Endpoints:** `PATCH /api/reviews/{id}/` o `PUT /api/reviews/{id}/`
- **Permiso:** `IsAuthenticated` + `IsOwnerOrReadOnly` (solo el autor de la reseña puede modificarla; otros usuarios reciben `403 Forbidden`).
- **Body para `PATCH` (JSON):**
  ```json
  {
    "rating": 4,
    "comment": "Muy buena fragancia, aunque prefiero usarla en otoño."
  }
  ```
- **Respuesta exitosa (`200 OK`):** Devuelve la reseña actualizada.

### 6.7. Eliminar una reseña propia
- **Endpoint:** `DELETE /api/reviews/{id}/`
- **Permiso:** `IsAuthenticated` + `IsOwnerOrReadOnly` (solo el autor puede eliminarla; otros usuarios reciben `403 Forbidden`).
- **Respuesta exitosa:** `204 No Content`.

---

## 7. Preferencias Olfativas y Recomendaciones (`/api/recommendations/`)

Todos los endpoints de este módulo requieren autenticación JWT (`Authorization: Bearer <access_token>`).

### 7.1. Listar mis notas olfativas preferidas
- **Endpoint:** `GET /api/recommendations/preferences/` (Paginado)
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "count": 2,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": 1,
        "note": {
          "id": 8,
          "name": "Hoja de Tabaco",
          "family": "Especiada",
          "description": "Nota cálida, aromática y ligeramente dulce.",
          "created_at": "2026-11-08T05:00:00-03:00",
          "updated_at": "2026-11-08T05:00:00-03:00"
        },
        "created_at": "2026-11-08T05:30:00-03:00",
        "updated_at": "2026-11-08T05:30:00-03:00"
      }
    ]
  }
  ```

### 7.2. Consultar una preferencia específica por ID
- **Endpoint:** `GET /api/recommendations/preferences/{id}/`
- **Respuesta exitosa (`200 OK`):** Devuelve el objeto `UserNotePreference` individual si pertenece al usuario autenticado (`404 Not Found` en caso contrario).

### 7.3. Agregar una nota olfativa preferida
- **Endpoint:** `POST /api/recommendations/preferences/`
- **Body (JSON):**
  ```json
  {
    "note_id": 8
  }
  ```
  *(También acepta `{"note": 8}`).*
- **Respuesta exitosa (`201 Created`):** Devuelve la preferencia creada con el objeto `note` anidado.
- **Error si la nota ya está en preferencias (`400 Bad Request`):**
  ```json
  {
    "note_id": ["Esta nota olfativa ya está registrada en tus preferencias."]
  }
  ```

### 7.4. Eliminar una nota olfativa preferida
- **Endpoint:** `DELETE /api/recommendations/preferences/{id}/`
- **Respuesta exitosa:** `204 No Content`.

### 7.5. Obtener recomendaciones personalizadas de perfumes
- **Endpoint:** `GET /api/recommendations/`
- **Reglas del motor de recomendaciones:**
  1. Obtiene las notas preferidas del usuario (`UserNotePreference`).
  2. Si el usuario aún no tiene notas preferidas registradas, devuelve `200 OK` con `has_preferences: false` y `results: []`.
  3. Busca perfumes del catálogo que compartan al menos una nota con las preferencias del usuario (`PerfumeNote`).
  4. **Excluye automáticamente** los perfumes que el usuario ya tiene en `Favorite` o que ya ha calificado en `Review`.
  5. Calcula `matched_notes_count`, `match_percentage` y el detalle `matched_notes` indicando en qué fase de la pirámide (`TOP`, `HEART`, `BASE`) aparece cada nota coincidente.
  6. Ordena de mayor a menor `matched_notes_count` y desempata por mayor `average_rating`.
- **Ejemplo de respuesta cuando el usuario NO tiene preferencias (`200 OK`):**
  ```json
  {
    "has_preferences": false,
    "preferred_notes_count": 0,
    "detail": "Debes seleccionar tus notas olfativas preferidas antes de recibir recomendaciones personalizadas.",
    "results": []
  }
  ```
- **Ejemplo de respuesta cuando el usuario SÍ tiene preferencias (`200 OK`):**
  ```json
  {
    "has_preferences": true,
    "preferred_notes_count": 2,
    "count": 1,
    "detail": "Recomendaciones generadas según la coincidencia con tus notas olfativas preferidas.",
    "results": [
      {
        "id": 3,
        "name": "Tobacco Vanille",
        "brand": {
          "id": 3,
          "name": "Tom Ford",
          "country": "Estados Unidos",
          "description": "Firma de lujo contemporáneo.",
          "logo_url": null
        },
        "description": "Fragancia opulenta y cálida con notas de tabaco especiado, vainilla y cacao.",
        "concentration": "EDP",
        "concentration_display": "Eau de Parfum",
        "gender": "UNISEX",
        "gender_display": "Unisex",
        "release_year": 2007,
        "recommended_seasons": ["AUTUMN", "WINTER"],
        "estimated_duration": "ETERNAL",
        "estimated_duration_display": "Muy duradera (8+ horas)",
        "projection": "STRONG",
        "projection_display": "Fuerte",
        "image_url": null,
        "olfactory_pyramid": {
          "top": [{"id": 8, "name": "Hoja de Tabaco", "family": "Especiada", "description": "..."}],
          "heart": [{"id": 9, "name": "Vainilla", "family": "Oriental", "description": "..."}],
          "base": [{"id": 7, "name": "Cedro", "family": "Amaderada", "description": "..."}]
        },
        "matched_notes_count": 2,
        "match_percentage": 100.0,
        "matched_notes": [
          {
            "id": 8,
            "name": "Hoja de Tabaco",
            "family": "Especiada",
            "note_type": "TOP",
            "note_type_display": "Salida"
          },
          {
            "id": 9,
            "name": "Vainilla",
            "family": "Oriental",
            "note_type": "HEART",
            "note_type_display": "Corazón"
          }
        ],
        "average_rating": 5.0,
        "reviews_count": 1
      }
    ]
  }
  ```

---

## 8. Catálogo de Valores Controlados (Enums / Choices para Formularios y Filtros en React)

| Campo | Valor interno (API) | Etiqueta en Español (`_display`) |
| :--- | :--- | :--- |
| **`concentration`** | `EDC`, `EDT`, `EDP`, `PARFUM`, `EXTRAIT` | Eau de Cologne, Eau de Toilette, Eau de Parfum, Parfum, Extrait de Parfum |
| **`gender`** | `MASCULINE`, `FEMININE`, `UNISEX` | Masculino, Femenino, Unisex |
| **`recommended_seasons`** | `SPRING`, `SUMMER`, `AUTUMN`, `WINTER` | Primavera, Verano, Otoño, Invierno |
| **`estimated_duration`** | `WEAK`, `MODERATE`, `LONG_LASTING`, `ETERNAL` | Suave (1 - 3 horas), Moderada (3 - 6 horas), Duradera (6 - 8 horas), Muy duradera (8+ horas) |
| **`projection`** | `INTIMATE`, `MODERATE`, `STRONG`, `ENORMOUS` | Íntima, Moderada, Fuerte, Muy fuerte |
| **`note_type`** | `TOP`, `HEART`, `BASE` | Salida, Corazón, Fondo |

---

## 9. Resumen de Permisos por Rol

| Operación | Visitante Anónimo | Usuario Autenticado | Administrador (`is_staff=True`) | Superadministrador (`is_superuser=True`) |
| :--- | :---: | :---: | :---: | :---: |
| Registrarse / Iniciar sesión / Refresh JWT | ✅ | ✅ | ✅ | ✅ |
| Consultar y editar propio perfil (`/api/users/me/`) | ❌ (`401`) | ✅ | ✅ | ✅ |
| Cerrar sesión (`/api/users/logout/`) | ❌ (`401`) | ✅ | ✅ | ✅ |
| Consultar catálogo (`brands`, `notes`, `perfumes`) | ✅ | ✅ | ✅ | ✅ |
| Crear / Editar / Eliminar catálogo (`brands`, `notes`, `perfumes`) | ❌ (`401`) | ❌ (`403`) | ✅ | ✅ |
| Estadísticas del Dashboard (`/api/users/admin/stats/`) | ❌ (`401`) | ❌ (`403`) | ✅ | ✅ |
| Listar y crear administradores (`/api/users/admins/`) | ❌ (`401`) | ❌ (`403`) | ❌ (`403`) | ✅ |
| Consultar reseñas de perfumes (`reviews`, `perfume/{id}`) | ✅ | ✅ | ✅ | ✅ |
| Consultar mis reseñas (`my-reviews`) | ❌ (`401`) | ✅ | ✅ | ✅ |
| Publicar reseña (máx. 1 por perfume) | ❌ (`401`) | ✅ | ✅ | ✅ |
| Editar / Eliminar reseña propia | ❌ (`401`) | ✅ (solo autor; otro recibe `403`) | ✅ (solo autor; otro recibe `403`) | ✅ (solo autor; otro recibe `403`) |
| Gestionar favoritos propios (`favorites`) | ❌ (`401`) | ✅ | ✅ | ✅ |
| Gestionar preferencias y ver recomendaciones (`recommendations`) | ❌ (`401`) | ✅ | ✅ | ✅ |
