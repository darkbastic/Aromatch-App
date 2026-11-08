import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Droplets,
  Edit3,
  ExternalLink,
  Flame,
  FlaskConical,
  Plus,
  Search,
  Star,
  Trash2,
  Wind,
  X,
} from "lucide-react";
import { catalogService } from "../../services/catalogService";
import {
  CONCENTRATION_OPTIONS,
  DURATION_OPTIONS,
  GENDER_OPTIONS,
  PROJECTION_OPTIONS,
  SEASON_OPTIONS,
} from "../../utils/constants";
import { extractApiError, getPerfumeFallbackImage } from "../../utils/helpers";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Loader from "../../components/common/Loader";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";

const INITIAL_PERFUME_FORM = {
  name: "",
  brand_id: "",
  description: "",
  concentration: "EDP",
  gender: "UNISEX",
  release_year: "",
  recommended_seasons: [],
  estimated_duration: "MODERATE",
  projection: "MODERATE",
  image_url: "",
  top_note_ids: [],
  heart_note_ids: [],
  base_note_ids: [],
};

export default function AdminPerfumesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [perfumesData, setPerfumesData] = useState({
    count: 0,
    next: null,
    previous: null,
    results: [],
  });
  const [allBrands, setAllBrands] = useState([]);
  const [allNotes, setAllNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [concentrationFilter, setConcentrationFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado del formulario (crear / editar)
  const [formOpen, setFormOpen] = useState(false);
  const [editingPerfumeId, setEditingPerfumeId] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [formData, setFormData] = useState(INITIAL_PERFUME_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Selectores temporales para añadir notas a cada fase de la pirámide
  const [selectedTopNote, setSelectedTopNote] = useState("");
  const [selectedHeartNote, setSelectedHeartNote] = useState("");
  const [selectedBaseNote, setSelectedBaseNote] = useState("");

  // Confirmación de eliminación
  const [confirmDeletePerfume, setConfirmDeletePerfume] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Carga marcas y notas disponibles en la base de datos
  useEffect(() => {
    let mounted = true;
    async function loadCatalogReferences() {
      try {
        const [brandsList, notesList] = await Promise.all([
          catalogService.getAllBrands(),
          catalogService.getAllNotes(),
        ]);
        if (mounted) {
          setAllBrands(brandsList);
          setAllNotes(notesList);
        }
      } catch {
        // Manejado al abrir el formulario si faltan datos
      }
    }
    loadCatalogReferences();
    return () => {
      mounted = false;
    };
  }, []);

  const loadPerfumes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await catalogService.getPerfumes({
        search: searchQuery.trim() || undefined,
        brand: brandFilter || undefined,
        concentration: concentrationFilter || undefined,
        page: currentPage,
        ordering: "brand__name",
      });
      if (Array.isArray(data)) {
        setPerfumesData({
          count: data.length,
          next: null,
          previous: null,
          results: data,
        });
      } else {
        setPerfumesData({
          count: data.count || 0,
          next: data.next,
          previous: data.previous,
          results: data.results || [],
        });
      }
    } catch (err) {
      setError(extractApiError(err, "No fue posible cargar el listado de perfumes."));
    } finally {
      setLoading(false);
    }
  }, [searchQuery, brandFilter, concentrationFilter, currentPage]);

  useEffect(() => {
    loadPerfumes();
  }, [loadPerfumes]);

  const handleOpenCreate = useCallback(() => {
    setEditingPerfumeId(null);
    setFormData({
      ...INITIAL_PERFUME_FORM,
      brand_id: allBrands[0]?.id ? String(allBrands[0].id) : "",
    });
    setFieldErrors({});
    setActionError(null);
    setFormOpen(true);
  }, [allBrands]);

  const handleOpenEditById = useCallback(async (perfumeId) => {
    setEditingPerfumeId(perfumeId);
    setFieldErrors({});
    setActionError(null);
    setFormOpen(true);
    setLoadingDetail(true);
    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      const detail = await catalogService.getPerfumeById(perfumeId);
      const topIds = (detail.olfactory_pyramid?.top || []).map((n) => Number(n.id));
      const heartIds = (detail.olfactory_pyramid?.heart || []).map((n) => Number(n.id));
      const baseIds = (detail.olfactory_pyramid?.base || []).map((n) => Number(n.id));

      setFormData({
        name: detail.name || "",
        brand_id: detail.brand?.id ? String(detail.brand.id) : "",
        description: detail.description || "",
        concentration: detail.concentration || "EDP",
        gender: detail.gender || "UNISEX",
        release_year: detail.release_year ? String(detail.release_year) : "",
        recommended_seasons: detail.recommended_seasons || [],
        estimated_duration: detail.estimated_duration || "MODERATE",
        projection: detail.projection || "MODERATE",
        image_url: detail.image_url || "",
        top_note_ids: topIds,
        heart_note_ids: heartIds,
        base_note_ids: baseIds,
      });
    } catch (err) {
      setActionError(
        extractApiError(err, "No fue posible cargar el detalle del perfume para editar.")
      );
      setFormOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  // Soporte para query params ?action=new y ?edit={id} desde el Dashboard
  useEffect(() => {
    const action = searchParams.get("action");
    const editId = searchParams.get("edit");
    if (action === "new") {
      handleOpenCreate();
      setSearchParams({}, { replace: true });
    } else if (editId && editId.match(/^\d+$/)) {
      handleOpenEditById(Number(editId));
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, handleOpenCreate, handleOpenEditById]);

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingPerfumeId(null);
    setFormData(INITIAL_PERFUME_FORM);
    setFieldErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSeasonToggle = (seasonCode) => {
    setFormData((prev) => {
      const exists = prev.recommended_seasons.includes(seasonCode);
      const next = exists
        ? prev.recommended_seasons.filter((s) => s !== seasonCode)
        : [...prev.recommended_seasons, seasonCode];
      return { ...prev, recommended_seasons: next };
    });
  };

  // Verifica si una nota ya está asignada en cualquier nivel de la pirámide
  const isNoteAssignedAnywhere = (noteId) => {
    const id = Number(noteId);
    return (
      formData.top_note_ids.includes(id) ||
      formData.heart_note_ids.includes(id) ||
      formData.base_note_ids.includes(id)
    );
  };

  const handleAddNoteToTier = (tierKey, noteIdValue, resetSelect) => {
    const id = Number(noteIdValue);
    if (!id) return;
    if (isNoteAssignedAnywhere(id)) {
      setActionError(
        "Esta nota ya está asignada en la pirámide de este perfume. Cada nota solo puede registrarse una vez por fragancia."
      );
      return;
    }
    setActionError(null);
    setFormData((prev) => ({
      ...prev,
      [tierKey]: [...prev[tierKey], id],
    }));
    resetSelect("");
  };

  const handleRemoveNoteFromTier = (tierKey, noteId) => {
    const id = Number(noteId);
    setFormData((prev) => ({
      ...prev,
      [tierKey]: prev[tierKey].filter((item) => item !== id),
    }));
  };

  const getNoteById = (noteId) =>
    allNotes.find((n) => Number(n.id) === Number(noteId));

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = "El nombre del perfume es obligatorio.";
    }
    if (!formData.brand_id) {
      errors.brand_id = "Selecciona una marca.";
    }
    if (!formData.description.trim()) {
      errors.description = "La descripción del perfume es obligatoria.";
    }
    if (formData.release_year !== "") {
      const yr = Number(formData.release_year);
      if (Number.isNaN(yr) || yr < 1700 || yr > 2100) {
        errors.release_year = "El año debe estar entre 1700 y 2100.";
      }
    }
    if (
      formData.image_url.trim() &&
      !/^https?:\/\/.+/i.test(formData.image_url.trim())
    ) {
      errors.image_url = "La URL de imagen debe comenzar con http:// o https://.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    if (!validateForm()) return;

    const notesInput = [
      ...formData.top_note_ids.map((id) => ({ note: id, note_type: "TOP" })),
      ...formData.heart_note_ids.map((id) => ({ note: id, note_type: "HEART" })),
      ...formData.base_note_ids.map((id) => ({ note: id, note_type: "BASE" })),
    ];

    const payload = {
      name: formData.name.trim(),
      brand_id: Number(formData.brand_id),
      description: formData.description.trim(),
      concentration: formData.concentration,
      gender: formData.gender,
      release_year: formData.release_year ? Number(formData.release_year) : null,
      recommended_seasons: formData.recommended_seasons,
      estimated_duration: formData.estimated_duration,
      projection: formData.projection,
      image_url: formData.image_url.trim() || null,
      notes_input: notesInput,
    };

    setSubmitting(true);
    try {
      if (editingPerfumeId) {
        await catalogService.updatePerfume(editingPerfumeId, payload);
        setActionSuccess(
          `El perfume "${payload.name}" fue actualizado exitosamente.`
        );
      } else {
        await catalogService.createPerfume(payload);
        setActionSuccess(`El perfume "${payload.name}" fue creado exitosamente.`);
      }
      handleCloseForm();
      await loadPerfumes();
    } catch (err) {
      setActionError(extractApiError(err, "No fue posible guardar el perfume."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeletePerfume) return;
    setDeleting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await catalogService.deletePerfume(confirmDeletePerfume.id);
      setActionSuccess(
        `El perfume "${confirmDeletePerfume.name}" fue eliminado del catálogo.`
      );
      setConfirmDeletePerfume(null);
      await loadPerfumes();
    } catch (err) {
      setActionError(extractApiError(err, "No se pudo eliminar el perfume."));
      setConfirmDeletePerfume(null);
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

      {/* FORMULARIO DE CREACIÓN / EDICIÓN DE PERFUME */}
      {formOpen && (
        <section className="admin-panel-card admin-form-card">
          <div className="admin-panel-header">
            <div>
              <h2 className="admin-panel-title">
                {editingPerfumeId ? "Editar Perfume" : "Registrar Nuevo Perfume"}
              </h2>
              <p className="admin-panel-subtitle">
                Configura la ficha técnica de la fragancia y asigna sus notas de salida,
                corazón y fondo.
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

          {loadingDetail ? (
            <Loader message="Cargando datos del perfume..." />
          ) : (
            <form onSubmit={handleSubmit} className="admin-form" noValidate>
              <div className="form-row-2">
                <Input
                  label="Nombre del perfume"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ej. Sauvage Elixir"
                  error={fieldErrors.name}
                  required
                />

                <div className="form-field">
                  <label htmlFor="perfume-brand" className="form-label">
                    Marca / Casa perfumista <span className="required-mark">*</span>
                  </label>
                  <select
                    id="perfume-brand"
                    name="brand_id"
                    className="form-input"
                    value={formData.brand_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecciona una marca...</option>
                    {allBrands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} {b.country ? `(${b.country})` : ""}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.brand_id && (
                    <p className="form-error">{fieldErrors.brand_id}</p>
                  )}
                </div>
              </div>

              <div className="form-row-3">
                <div className="form-field">
                  <label htmlFor="perfume-concentration" className="form-label">
                    Concentración <span className="required-mark">*</span>
                  </label>
                  <select
                    id="perfume-concentration"
                    name="concentration"
                    className="form-input"
                    value={formData.concentration}
                    onChange={handleChange}
                  >
                    {CONCENTRATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="perfume-gender" className="form-label">
                    Género / Público
                  </label>
                  <select
                    id="perfume-gender"
                    name="gender"
                    className="form-input"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    {GENDER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Año de lanzamiento (1700 - 2100)"
                  name="release_year"
                  type="number"
                  min={1700}
                  max={2100}
                  value={formData.release_year}
                  onChange={handleChange}
                  placeholder="Ej. 2021"
                  error={fieldErrors.release_year}
                />
              </div>

              <div className="form-row-2">
                <div className="form-field">
                  <label htmlFor="perfume-duration" className="form-label">
                    Duración estimada en piel
                  </label>
                  <select
                    id="perfume-duration"
                    name="estimated_duration"
                    className="form-input"
                    value={formData.estimated_duration}
                    onChange={handleChange}
                  >
                    {DURATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="perfume-projection" className="form-label">
                    Proyección / Estela
                  </label>
                  <select
                    id="perfume-projection"
                    name="projection"
                    className="form-input"
                    value={formData.projection}
                    onChange={handleChange}
                  >
                    {PROJECTION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ESTACIONES RECOMENDADAS */}
              <div className="form-field">
                <span className="form-label">Estaciones recomendadas</span>
                <div className="admin-seasons-selector">
                  {SEASON_OPTIONS.map((season) => {
                    const active = formData.recommended_seasons.includes(season.value);
                    return (
                      <button
                        key={season.value}
                        type="button"
                        onClick={() => handleSeasonToggle(season.value)}
                        className={`admin-season-pill ${active ? "is-active" : ""}`}
                      >
                        {season.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* URL DE IMAGEN EXTERNA */}
              <Input
                label="URL de imagen externa (opcional)"
                name="image_url"
                type="url"
                value={formData.image_url}
                onChange={handleChange}
                placeholder="https://ejemplo.com/frasco-perfume.jpg"
                error={fieldErrors.image_url}
                helperText="Si se deja vacío, Aromatch generará automáticamente una ilustración de frasco editorial."
              />

              {/* DESCRIPCIÓN */}
              <div className="form-field">
                <label htmlFor="perfume-description" className="form-label">
                  Descripción olfativa <span className="required-mark">*</span>
                </label>
                <textarea
                  id="perfume-description"
                  name="description"
                  rows={3}
                  className="form-textarea"
                  placeholder="Describe el carácter, inspiración y evolución de la fragancia..."
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
                {fieldErrors.description && (
                  <p className="form-error">{fieldErrors.description}</p>
                )}
              </div>

              {/* CONSTRUCTOR DE PIRÁMIDE OLFATIVA (SALIDA, CORAZÓN, FONDO) */}
              <div className="admin-pyramid-builder">
                <div className="admin-pyramid-builder-header">
                  <h3>Asignación de Pirámide Olfativa</h3>
                  <p>
                    Selecciona las notas existentes en el catálogo para cada fase de la
                    fragancia.
                  </p>
                </div>

                <div className="admin-pyramid-tiers-grid">
                  {/* SALIDA (TOP) */}
                  <div className="admin-pyramid-tier-box">
                    <div className="admin-tier-box-title">
                      <Wind size={16} color="#B89B69" />
                      <strong>Notas de Salida (TOP)</strong>
                    </div>
                    <div className="admin-tier-selector-row">
                      <select
                        className="filter-select"
                        value={selectedTopNote}
                        onChange={(e) =>
                          handleAddNoteToTier(
                            "top_note_ids",
                            e.target.value,
                            setSelectedTopNote
                          )
                        }
                      >
                        <option value="">+ Agregar nota de salida...</option>
                        {allNotes.map((n) => (
                          <option
                            key={n.id}
                            value={n.id}
                            disabled={isNoteAssignedAnywhere(n.id)}
                          >
                            {n.name} {n.family ? `(${n.family})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-tier-chips">
                      {formData.top_note_ids.map((nid) => {
                        const noteObj = getNoteById(nid);
                        return (
                          <span key={nid} className="admin-note-chip">
                            <span>{noteObj?.name || `Nota #${nid}`}</span>
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveNoteFromTier("top_note_ids", nid)
                              }
                              aria-label="Quitar nota"
                            >
                              <X size={13} />
                            </button>
                          </span>
                        );
                      })}
                      {formData.top_note_ids.length === 0 && (
                        <small className="muted-text">Sin notas de salida asignadas</small>
                      )}
                    </div>
                  </div>

                  {/* CORAZÓN (HEART) */}
                  <div className="admin-pyramid-tier-box">
                    <div className="admin-tier-box-title">
                      <Droplets size={16} color="#B89B69" />
                      <strong>Notas de Corazón (HEART)</strong>
                    </div>
                    <div className="admin-tier-selector-row">
                      <select
                        className="filter-select"
                        value={selectedHeartNote}
                        onChange={(e) =>
                          handleAddNoteToTier(
                            "heart_note_ids",
                            e.target.value,
                            setSelectedHeartNote
                          )
                        }
                      >
                        <option value="">+ Agregar nota de corazón...</option>
                        {allNotes.map((n) => (
                          <option
                            key={n.id}
                            value={n.id}
                            disabled={isNoteAssignedAnywhere(n.id)}
                          >
                            {n.name} {n.family ? `(${n.family})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-tier-chips">
                      {formData.heart_note_ids.map((nid) => {
                        const noteObj = getNoteById(nid);
                        return (
                          <span key={nid} className="admin-note-chip">
                            <span>{noteObj?.name || `Nota #${nid}`}</span>
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveNoteFromTier("heart_note_ids", nid)
                              }
                              aria-label="Quitar nota"
                            >
                              <X size={13} />
                            </button>
                          </span>
                        );
                      })}
                      {formData.heart_note_ids.length === 0 && (
                        <small className="muted-text">
                          Sin notas de corazón asignadas
                        </small>
                      )}
                    </div>
                  </div>

                  {/* FONDO (BASE) */}
                  <div className="admin-pyramid-tier-box">
                    <div className="admin-tier-box-title">
                      <Flame size={16} color="#B89B69" />
                      <strong>Notas de Fondo (BASE)</strong>
                    </div>
                    <div className="admin-tier-selector-row">
                      <select
                        className="filter-select"
                        value={selectedBaseNote}
                        onChange={(e) =>
                          handleAddNoteToTier(
                            "base_note_ids",
                            e.target.value,
                            setSelectedBaseNote
                          )
                        }
                      >
                        <option value="">+ Agregar nota de fondo...</option>
                        {allNotes.map((n) => (
                          <option
                            key={n.id}
                            value={n.id}
                            disabled={isNoteAssignedAnywhere(n.id)}
                          >
                            {n.name} {n.family ? `(${n.family})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-tier-chips">
                      {formData.base_note_ids.map((nid) => {
                        const noteObj = getNoteById(nid);
                        return (
                          <span key={nid} className="admin-note-chip">
                            <span>{noteObj?.name || `Nota #${nid}`}</span>
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveNoteFromTier("base_note_ids", nid)
                              }
                              aria-label="Quitar nota"
                            >
                              <X size={13} />
                            </button>
                          </span>
                        );
                      })}
                      {formData.base_note_ids.length === 0 && (
                        <small className="muted-text">Sin notas de fondo asignadas</small>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="admin-form-footer">
                <Button type="button" variant="ghost" onClick={handleCloseForm}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" loading={submitting}>
                  {editingPerfumeId ? "Guardar cambios" : "Crear perfume"}
                </Button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {confirmDeletePerfume && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal">
            <h3>Confirmar eliminación de perfume</h3>
            <p>
              ¿Estás seguro de que deseas eliminar permanentemente el perfume{" "}
              <strong>{confirmDeletePerfume.name}</strong> ({confirmDeletePerfume.brand?.name})?
              Esta acción también eliminará su pirámide olfativa asociada.
            </p>
            <div className="admin-modal-actions">
              <Button
                variant="ghost"
                onClick={() => setConfirmDeletePerfume(null)}
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
                Eliminar perfume
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TABLA Y BUSCADOR DE PERFUMES */}
      <section className="admin-panel-card">
        <div className="admin-toolbar">
          <div className="admin-toolbar-filters">
            <div className="admin-search-box">
              <Search size={18} className="admin-search-icon" />
              <input
                type="search"
                className="admin-search-input"
                placeholder="Buscar por nombre de perfume o marca..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <select
              className="filter-select admin-inline-select"
              value={brandFilter}
              onChange={(e) => {
                setBrandFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filtrar por marca"
            >
              <option value="">Todas las marcas</option>
              {allBrands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <select
              className="filter-select admin-inline-select"
              value={concentrationFilter}
              onChange={(e) => {
                setConcentrationFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filtrar por concentración"
            >
              <option value="">Todas las concentraciones</option>
              {CONCENTRATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <Button variant="primary" onClick={handleOpenCreate}>
            <Plus size={18} />
            <span>Nuevo Perfume</span>
          </Button>
        </div>

        {loading ? (
          <Loader message="Consultando perfumes del catálogo..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={loadPerfumes} />
        ) : perfumesData.results.length > 0 ? (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Perfume</th>
                    <th>Marca</th>
                    <th>Concentración</th>
                    <th>Género</th>
                    <th>Año</th>
                    <th>Calificación</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {perfumesData.results.map((perfume) => {
                    const fallbackImg = getPerfumeFallbackImage(
                      perfume.name,
                      perfume.brand?.name
                    );
                    return (
                      <tr key={perfume.id}>
                        <td>
                          <div className="admin-perfume-cell">
                            <img
                              src={perfume.image_url || fallbackImg}
                              alt={perfume.name}
                              className="admin-perfume-thumb"
                              onError={(e) => {
                                e.currentTarget.src = fallbackImg;
                              }}
                            />
                            <div>
                              <strong>{perfume.name}</strong>
                              <small className="admin-cell-sub">ID #{perfume.id}</small>
                            </div>
                          </div>
                        </td>
                        <td>{perfume.brand?.name}</td>
                        <td>
                          <span className="admin-table-badge">
                            {perfume.concentration_display || perfume.concentration}
                          </span>
                        </td>
                        <td>{perfume.gender_display || perfume.gender}</td>
                        <td>{perfume.release_year || "—"}</td>
                        <td>
                          {perfume.average_rating !== null &&
                          perfume.average_rating !== undefined ? (
                            <span className="admin-rating-inline">
                              <Star size={14} fill="#B89B69" color="#B89B69" />
                              <strong>{Number(perfume.average_rating).toFixed(1)}</strong>
                              <small>({perfume.reviews_count || 0})</small>
                            </span>
                          ) : (
                            <span className="muted-text">Sin reseñas</span>
                          )}
                        </td>
                        <td className="text-right">
                          <div className="admin-row-actions">
                            <Link
                              to={`/perfume/${perfume.id}`}
                              className="icon-action-btn"
                              title="Ver ficha pública"
                            >
                              <ExternalLink size={15} />
                            </Link>
                            <button
                              type="button"
                              className="icon-action-btn"
                              onClick={() => handleOpenEditById(perfume.id)}
                              title="Editar perfume y pirámide olfativa"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              type="button"
                              className="icon-action-btn danger"
                              onClick={() => setConfirmDeletePerfume(perfume)}
                              title="Eliminar perfume"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalCount={perfumesData.count}
              pageSize={12}
              hasNext={Boolean(perfumesData.next)}
              hasPrevious={Boolean(perfumesData.previous)}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <EmptyState
            icon={FlaskConical}
            title="No se encontraron perfumes"
            description="Ajusta la búsqueda o registra una nueva fragancia en el catálogo."
            action={
              <Button variant="primary" onClick={handleOpenCreate}>
                Crear perfume
              </Button>
            }
          />
        )}
      </section>
    </div>
  );
}

