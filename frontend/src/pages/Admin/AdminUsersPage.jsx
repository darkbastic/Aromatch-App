import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Lock, Mail, Plus, Search, ShieldCheck, User, X } from "lucide-react";
import { adminService } from "../../services/adminService";
import { extractApiError, formatDate } from "../../utils/helpers";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Loader from "../../components/common/Loader";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";

const INITIAL_ADMIN_FORM = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  password: "",
  password_confirm: "",
};

export default function AdminUsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [adminsData, setAdminsData] = useState({
    count: 0,
    next: null,
    previous: null,
    results: [],
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Formulario para crear nuevo administrador
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_ADMIN_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getAdmins({
        search: searchQuery.trim() || undefined,
        page: currentPage,
      });
      if (Array.isArray(data)) {
        setAdminsData({
          count: data.length,
          next: null,
          previous: null,
          results: data,
        });
      } else {
        setAdminsData({
          count: data.count || 0,
          next: data.next,
          previous: data.previous,
          results: data.results || [],
        });
      }
    } catch (err) {
      setError(
        extractApiError(
          err,
          "No fue posible consultar el listado de administradores."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [searchQuery, currentPage]);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setFormOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleOpenCreate = () => {
    setFormData(INITIAL_ADMIN_FORM);
    setFieldErrors({});
    setActionError(null);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setFormData(INITIAL_ADMIN_FORM);
    setFieldErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.username.trim()) {
      errors.username = "El nombre de usuario es obligatorio.";
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      errors.email = "Ingresa un correo electrónico válido.";
    }
    if (!formData.password || formData.password.length < 8) {
      errors.password = "La contraseña debe tener al menos 8 caracteres.";
    } else if (/^\d+$/.test(formData.password)) {
      errors.password = "La contraseña no puede ser completamente numérica.";
    }
    if (formData.password !== formData.password_confirm) {
      errors.password_confirm = "Las contraseñas no coinciden.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const created = await adminService.createAdmin({
        username: formData.username.trim(),
        email: formData.email.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        password: formData.password,
        password_confirm: formData.password_confirm,
      });
      setActionSuccess(
        `Cuenta administrativa "@${created.username}" creada exitosamente con rol Administrador de Catálogo (is_staff=True, is_superuser=False).`
      );
      handleCloseForm();
      await loadAdmins();
    } catch (err) {
      const responseData = err?.response?.data;
      if (responseData && typeof responseData === "object") {
        const mappedErrors = {};
        [
          "username",
          "email",
          "first_name",
          "last_name",
          "password",
          "password_confirm",
        ].forEach((key) => {
          if (responseData[key]) {
            mappedErrors[key] = Array.isArray(responseData[key])
              ? responseData[key].join(" ")
              : String(responseData[key]);
          }
        });
        if (Object.keys(mappedErrors).length > 0) {
          setFieldErrors((prev) => ({ ...prev, ...mappedErrors }));
        }
      }
      setActionError(
        extractApiError(err, "No fue posible crear la cuenta administrativa.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-section-page">
      {actionError && <ErrorMessage message={actionError} />}
      {actionSuccess && (
        <div className="success-banner" role="status">
          {actionSuccess}
        </div>
      )}

      {/* FORMULARIO PARA CREAR NUEVO ADMINISTRADOR */}
      {formOpen && (
        <section className="admin-panel-card admin-form-card">
          <div className="admin-panel-header">
            <div>
              <h2 className="admin-panel-title">Nueva Cuenta Administrativa</h2>
              <p className="admin-panel-subtitle">
                La cuenta creada recibirá permisos de{" "}
                <strong>Administrador de Catálogo (`is_staff=True`, `is_superuser=False`)</strong>{" "}
                para gestionar perfumes, marcas y notas olfativas.
              </p>
            </div>
            <button
              type="button"
              className="icon-action-btn"
              onClick={handleCloseForm}
              title="Cerrar formulario"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="admin-form" noValidate>
            <div className="form-row-2">
              <Input
                label="Nombre de usuario"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Ej. curador_aromatch"
                icon={User}
                error={fieldErrors.username}
                required
                autoComplete="off"
              />

              <Input
                label="Correo electrónico"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@aromatch.cl"
                icon={Mail}
                error={fieldErrors.email}
                required
                autoComplete="off"
              />
            </div>

            <div className="form-row-2">
              <Input
                label="Nombre"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Nombre del administrador"
                error={fieldErrors.first_name}
              />

              <Input
                label="Apellido"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Apellido del administrador"
                error={fieldErrors.last_name}
              />
            </div>

            <div className="form-row-2">
              <Input
                label="Contraseña"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Mínimo 8 caracteres (letras y números)"
                icon={Lock}
                error={fieldErrors.password}
                helperText="Se almacenará cifrada mediante el sistema seguro PBKDF2 de Django."
                required
                autoComplete="new-password"
              />

              <Input
                label="Confirmar contraseña"
                name="password_confirm"
                type="password"
                value={formData.password_confirm}
                onChange={handleChange}
                placeholder="Repite la contraseña"
                icon={Lock}
                error={fieldErrors.password_confirm}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="admin-form-footer">
              <Button type="button" variant="ghost" onClick={handleCloseForm}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                <ShieldCheck size={16} />
                <span>Crear cuenta administrativa</span>
              </Button>
            </div>
          </form>
        </section>
      )}

      {/* LISTADO DE ADMINISTRADORES */}
      <section className="admin-panel-card">
        <div className="admin-toolbar">
          <div className="admin-search-box">
            <Search size={18} className="admin-search-icon" />
            <input
              type="search"
              className="admin-search-input"
              placeholder="Buscar administrador por usuario, correo o nombre..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <Button variant="primary" onClick={handleOpenCreate}>
            <Plus size={18} />
            <span>Nuevo Administrador</span>
          </Button>
        </div>

        {loading ? (
          <Loader message="Consultando cuentas administrativas..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={loadAdmins} />
        ) : adminsData.results.length > 0 ? (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Usuario</th>
                    <th>Correo electrónico</th>
                    <th>Nombre completo</th>
                    <th>Nivel de Rol</th>
                    <th>Fecha de registro</th>
                  </tr>
                </thead>
                <tbody>
                  {adminsData.results.map((adm) => {
                    const fullName =
                      `${adm.first_name || ""} ${adm.last_name || ""}`.trim() ||
                      "—";
                    return (
                      <tr key={adm.id}>
                        <td>#{adm.id}</td>
                        <td>
                          <strong>@{adm.username}</strong>
                        </td>
                        <td>{adm.email}</td>
                        <td>{fullName}</td>
                        <td>
                          <span
                            className={`admin-role-badge ${
                              adm.is_superuser ? "role-super" : "role-staff"
                            }`}
                          >
                            <ShieldCheck size={13} />
                            <span>
                              {adm.role_display ||
                                (adm.is_superuser
                                  ? "Superadministrador"
                                  : "Administrador")}
                            </span>
                          </span>
                        </td>
                        <td>{formatDate(adm.date_joined)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalCount={adminsData.count}
              pageSize={12}
              hasNext={Boolean(adminsData.next)}
              hasPrevious={Boolean(adminsData.previous)}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <EmptyState
            icon={ShieldCheck}
            title="No se encontraron administradores"
            description="No hay cuentas que coincidan con el criterio de búsqueda."
          />
        )}
      </section>
    </div>
  );
}

