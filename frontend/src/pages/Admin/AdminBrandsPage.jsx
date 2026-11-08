import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Award, Edit3, Plus, Search, Trash2, X } from "lucide-react";
import { catalogService } from "../../services/catalogService";
import { extractApiError, formatDate } from "../../utils/helpers";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Loader from "../../components/common/Loader";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";

const EMPTY_BRAND_FORM = {
  name: "",
  country: "",
  description: "",
  logo_url: "",
};

export default function AdminBrandsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [brandsData, setBrandsData] = useState({
    count: 0,
    next: null,
    previous: null,
    results: [],
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado del formulario (crear / editar)
  const [formOpen, setFormOpen] = useState(false);
  const [editingBrandId, setEditingBrandId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_BRAND_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Confirmación de eliminación
  const [confirmDeleteBrand, setConfirmDeleteBrand] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadBrands = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await catalogService.getBrands({
        search: searchQuery.trim() || undefined,
        page: currentPage,
        ordering: "name",
      });
      if (Array.isArray(data)) {
        setBrandsData({
          count: data.length,
          next: null,
          previous: null,
          results: data,
        });
      } else {
        setBrandsData({
          count: data.count || 0,
          next: data.next,
          previous: data.previous,
          results: data.results || [],
        });
      }
    } catch (err) {
      setError(extractApiError(err, "No fue posible cargar el listado de marcas."));
    } finally {
      setLoading(false);
    }
  }, [searchQuery, currentPage]);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      handleOpenCreate();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleOpenCreate = () => {
    setEditingBrandId(null);
    setFormData(EMPTY_BRAND_FORM);
    setFieldErrors({});
    setActionError(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (brand) => {
    setEditingBrandId(brand.id);
    setFormData({
      name: brand.name || "",
      country: brand.country || "",
      description: brand.description || "",
      logo_url: brand.logo_url || "",
    });
    setFieldErrors({});
    setActionError(null);
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingBrandId(null);
    setFormData(EMPTY_BRAND_FORM);
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
    if (!formData.name.trim()) {
      errors.name = "El nombre de la marca es obligatorio.";
    }
    if (
      formData.logo_url.trim() &&
      !/^https?:\/\/.+/i.test(formData.logo_url.trim())
    ) {
      errors.logo_url = "La URL del logo debe comenzar con http:// o https://.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    if (!validateForm()) return;

    const payload = {
      name: formData.name.trim(),
      country: formData.country.trim(),
      description: formData.description.trim(),
      logo_url: formData.logo_url.trim() || null,
    };

    setSubmitting(true);
    try {
      if (editingBrandId) {
        await catalogService.updateBrand(editingBrandId, payload);
        setActionSuccess(`La marca "${payload.name}" fue actualizada correctamente.`);
      } else {
        await catalogService.createBrand(payload);
        setActionSuccess(`La marca "${payload.name}" fue creada exitosamente.`);
      }
      handleCloseForm();
      await loadBrands();
    } catch (err) {
      setActionError(extractApiError(err, "No fue posible guardar la marca."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteBrand) return;
    setDeleting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await catalogService.deleteBrand(confirmDeleteBrand.id);
      setActionSuccess(
        `La marca "${confirmDeleteBrand.name}" fue eliminada correctamente.`
      );
      setConfirmDeleteBrand(null);
      await loadBrands();
    } catch (err) {
      setActionError(
        extractApiError(
          err,
          "No se pudo eliminar la marca. Verifica que no tenga perfumes asociados."
        )
      );
      setConfirmDeleteBrand(null);
    } finally {
      setDeleting(false);
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

      {/* FORMULARIO CREAR / EDITAR MARCA */}
      {formOpen && (
        <section className="admin-panel-card admin-form-card">
          <div className="admin-panel-header">
            <div>
              <h2 className="admin-panel-title">
                {editingBrandId ? "Editar Marca" : "Nueva Marca de Perfumería"}
              </h2>
              <p className="admin-panel-subtitle">
                Completa los datos oficiales de la casa perfumista.
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
                label="Nombre de la marca"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej. Maison Francis Kurkdjian"
                error={fieldErrors.name}
                required
              />

              <Input
                label="País de origen"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="Ej. Francia"
                error={fieldErrors.country}
              />
            </div>

            <Input
              label="URL del logo (opcional)"
              name="logo_url"
              type="url"
              value={formData.logo_url}
              onChange={handleChange}
              placeholder="https://ejemplo.com/logo-marca.png"
              error={fieldErrors.logo_url}
            />

            <div className="form-field">
              <label htmlFor="brand-description" className="form-label">
                Descripción histórica o identidad de la casa
              </label>
              <textarea
                id="brand-description"
                name="description"
                rows={3}
                className="form-textarea"
                placeholder="Breve reseña sobre la tradición y estilo de la casa perfumista..."
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="admin-form-footer">
              <Button type="button" variant="ghost" onClick={handleCloseForm}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                {editingBrandId ? "Guardar cambios" : "Registrar marca"}
              </Button>
            </div>
          </form>
        </section>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {confirmDeleteBrand && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal">
            <h3>Confirmar eliminación de marca</h3>
            <p>
              ¿Estás seguro de que deseas eliminar la marca{" "}
              <strong>{confirmDeleteBrand.name}</strong>? Si la marca tiene perfumes
              asociados en el catálogo, el sistema protegerá el registro e impedirá su
              borrado.
            </p>
            <div className="admin-modal-actions">
              <Button
                variant="ghost"
                onClick={() => setConfirmDeleteBrand(null)}
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                className="btn-danger"
                onClick={handleConfirmDelete}
                loading={deleting}
              >
                Eliminar marca
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* BARRA DE BÚSQUEDA Y BOTÓN NUEVO */}
      <section className="admin-panel-card">
        <div className="admin-toolbar">
          <div className="admin-search-box">
            <Search size={18} className="admin-search-icon" />
            <input
              type="search"
              className="admin-search-input"
              placeholder="Buscar marca por nombre o país..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <Button variant="primary" onClick={handleOpenCreate}>
            <Plus size={18} />
            <span>Nueva Marca</span>
          </Button>
        </div>

        {loading ? (
          <Loader message="Cargando marcas del catálogo..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={loadBrands} />
        ) : brandsData.results.length > 0 ? (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Marca</th>
                    <th>País</th>
                    <th>Descripción</th>
                    <th>Fecha creación</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {brandsData.results.map((brand) => (
                    <tr key={brand.id}>
                      <td>#{brand.id}</td>
                      <td>
                        <div className="admin-brand-cell">
                          {brand.logo_url && (
                            <img
                              src={brand.logo_url}
                              alt={brand.name}
                              className="admin-brand-thumb"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          )}
                          <strong>{brand.name}</strong>
                        </div>
                      </td>
                      <td>{brand.country || "—"}</td>
                      <td className="admin-td-truncate">
                        {brand.description || "Sin descripción"}
                      </td>
                      <td>{formatDate(brand.created_at)}</td>
                      <td className="text-right">
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="icon-action-btn"
                            onClick={() => handleOpenEdit(brand)}
                            title="Editar marca"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            className="icon-action-btn danger"
                            onClick={() => setConfirmDeleteBrand(brand)}
                            title="Eliminar marca"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalCount={brandsData.count}
              pageSize={12}
              hasNext={Boolean(brandsData.next)}
              hasPrevious={Boolean(brandsData.previous)}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <EmptyState
            icon={Award}
            title="No se encontraron marcas"
            description="No hay marcas que coincidan con la búsqueda actual o aún no se han registrado."
            action={
              <Button variant="primary" onClick={handleOpenCreate}>
                Crear primera marca
              </Button>
            }
          />
        )}
      </section>
    </div>
  );
}

