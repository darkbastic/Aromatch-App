import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Droplets, Edit3, Plus, Search, Trash2, X } from "lucide-react";
import { catalogService } from "../../services/catalogService";
import { extractApiError, formatDate } from "../../utils/helpers";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Loader from "../../components/common/Loader";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";

const EMPTY_NOTE_FORM = {
  name: "",
  family: "",
  description: "",
};

const SUGGESTED_FAMILIES = [
  "Cítrica",
  "Aromática",
  "Amaderada",
  "Oriental",
  "Especiada",
  "Floral",
  "Marina",
  "Frutal",
  "Gourmand",
  "Almizclada",
];

export default function AdminNotesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [notesData, setNotesData] = useState({
    count: 0,
    next: null,
    previous: null,
    results: [],
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [familyFilter, setFamilyFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado del formulario (crear / editar)
  const [formOpen, setFormOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_NOTE_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Confirmación de eliminación
  const [confirmDeleteNote, setConfirmDeleteNote] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await catalogService.getNotes({
        search: searchQuery.trim() || undefined,
        family: familyFilter || undefined,
        page: currentPage,
        ordering: "name",
      });
      if (Array.isArray(data)) {
        setNotesData({
          count: data.length,
          next: null,
          previous: null,
          results: data,
        });
      } else {
        setNotesData({
          count: data.count || 0,
          next: data.next,
          previous: data.previous,
          results: data.results || [],
        });
      }
    } catch (err) {
      setError(
        extractApiError(err, "No fue posible cargar el listado de notas olfativas.")
      );
    } finally {
      setLoading(false);
    }
  }, [searchQuery, familyFilter, currentPage]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      handleOpenCreate();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleOpenCreate = () => {
    setEditingNoteId(null);
    setFormData(EMPTY_NOTE_FORM);
    setFieldErrors({});
    setActionError(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (note) => {
    setEditingNoteId(note.id);
    setFormData({
      name: note.name || "",
      family: note.family || "",
      description: note.description || "",
    });
    setFieldErrors({});
    setActionError(null);
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingNoteId(null);
    setFormData(EMPTY_NOTE_FORM);
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
      errors.name = "El nombre de la nota olfativa es obligatorio.";
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
      family: formData.family.trim(),
      description: formData.description.trim(),
    };

    setSubmitting(true);
    try {
      if (editingNoteId) {
        await catalogService.updateNote(editingNoteId, payload);
        setActionSuccess(`La nota "${payload.name}" fue actualizada correctamente.`);
      } else {
        await catalogService.createNote(payload);
        setActionSuccess(`La nota "${payload.name}" fue creada exitosamente.`);
      }
      handleCloseForm();
      await loadNotes();
    } catch (err) {
      setActionError(extractApiError(err, "No fue posible guardar la nota olfativa."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteNote) return;
    setDeleting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await catalogService.deleteNote(confirmDeleteNote.id);
      setActionSuccess(
        `La nota "${confirmDeleteNote.name}" fue eliminada correctamente.`
      );
      setConfirmDeleteNote(null);
      await loadNotes();
    } catch (err) {
      setActionError(
        extractApiError(
          err,
          "No se pudo eliminar la nota olfativa porque está en uso por perfumes o preferencias."
        )
      );
      setConfirmDeleteNote(null);
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

      {/* FORMULARIO CREAR / EDITAR NOTA OLFATIVA */}
      {formOpen && (
        <section className="admin-panel-card admin-form-card">
          <div className="admin-panel-header">
            <div>
              <h2 className="admin-panel-title">
                {editingNoteId ? "Editar Nota Olfativa" : "Nueva Nota Olfativa"}
              </h2>
              <p className="admin-panel-subtitle">
                Registra un ingrediente aromático y su clasificación dentro de las familias olfativas.
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
                label="Nombre de la nota"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej. Bergamota de Calabria"
                error={fieldErrors.name}
                required
              />

              <div className="form-field">
                <label htmlFor="note-family" className="form-label">
                  Familia olfativa
                </label>
                <input
                  id="note-family"
                  name="family"
                  list="olfactory-families-list"
                  className="form-input"
                  value={formData.family}
                  onChange={handleChange}
                  placeholder="Ej. Cítrica, Amaderada, Oriental..."
                />
                <datalist id="olfactory-families-list">
                  {SUGGESTED_FAMILIES.map((fam) => (
                    <option key={fam} value={fam} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="note-description" className="form-label">
                Descripción olfativa
              </label>
              <textarea
                id="note-description"
                name="description"
                rows={3}
                className="form-textarea"
                placeholder="Describe el matiz aromático de la nota (fresco, resinoso, dulce, atalcado...)"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="admin-form-footer">
              <Button type="button" variant="ghost" onClick={handleCloseForm}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                {editingNoteId ? "Guardar cambios" : "Registrar nota"}
              </Button>
            </div>
          </form>
        </section>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {confirmDeleteNote && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal">
            <h3>Confirmar eliminación de nota olfativa</h3>
            <p>
              ¿Deseas eliminar la nota <strong>{confirmDeleteNote.name}</strong>? Si se
              encuentra asociada a la pirámide de algún perfume o a las preferencias de un
              usuario, el sistema protegerá la integridad referencial.
            </p>
            <div className="admin-modal-actions">
              <Button
                variant="ghost"
                onClick={() => setConfirmDeleteNote(null)}
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
                Eliminar nota
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* LISTADO Y FILTROS */}
      <section className="admin-panel-card">
        <div className="admin-toolbar">
          <div className="admin-toolbar-filters">
            <div className="admin-search-box">
              <Search size={18} className="admin-search-icon" />
              <input
                type="search"
                className="admin-search-input"
                placeholder="Buscar por nombre o familia..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <select
              className="filter-select admin-inline-select"
              value={familyFilter}
              onChange={(e) => {
                setFamilyFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filtrar por familia olfativa"
            >
              <option value="">Todas las familias</option>
              {SUGGESTED_FAMILIES.map((fam) => (
                <option key={fam} value={fam}>
                  {fam}
                </option>
              ))}
            </select>
          </div>

          <Button variant="primary" onClick={handleOpenCreate}>
            <Plus size={18} />
            <span>Nueva Nota</span>
          </Button>
        </div>

        {loading ? (
          <Loader message="Cargando notas olfativas..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={loadNotes} />
        ) : notesData.results.length > 0 ? (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nota Olfativa</th>
                    <th>Familia</th>
                    <th>Descripción</th>
                    <th>Fecha creación</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {notesData.results.map((note) => (
                    <tr key={note.id}>
                      <td>#{note.id}</td>
                      <td>
                        <strong>{note.name}</strong>
                      </td>
                      <td>
                        {note.family ? (
                          <span className="admin-table-badge">{note.family}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="admin-td-truncate">
                        {note.description || "Sin descripción"}
                      </td>
                      <td>{formatDate(note.created_at)}</td>
                      <td className="text-right">
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="icon-action-btn"
                            onClick={() => handleOpenEdit(note)}
                            title="Editar nota"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            className="icon-action-btn danger"
                            onClick={() => setConfirmDeleteNote(note)}
                            title="Eliminar nota"
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
              totalCount={notesData.count}
              pageSize={12}
              hasNext={Boolean(notesData.next)}
              hasPrevious={Boolean(notesData.previous)}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <EmptyState
            icon={Droplets}
            title="No se encontraron notas olfativas"
            description="Ajusta el filtro de búsqueda o registra una nueva nota en el catálogo."
            action={
              <Button variant="primary" onClick={handleOpenCreate}>
                Crear nota olfativa
              </Button>
            }
          />
        )}
      </section>
    </div>
  );
}

