import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Plus, Search, Sparkles, X } from "lucide-react";
import { catalogService } from "../../services/catalogService";
import { recommendationsService } from "../../services/recommendationsService";
import { extractApiError } from "../../utils/helpers";
import Loader from "../../components/common/Loader";
import ErrorMessage from "../../components/common/ErrorMessage";

export default function PreferencesPage() {
  const [preferences, setPreferences] = useState([]);
  const [allNotes, setAllNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [pendingNoteIds, setPendingNoteIds] = useState(() => new Set());

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prefsList, notesList] = await Promise.all([
        recommendationsService.getAllPreferences(),
        catalogService.getAllNotes(),
      ]);
      setPreferences(prefsList);
      setAllNotes(notesList);
    } catch (err) {
      setError(
        extractApiError(
          err,
          "No fue posible cargar las notas olfativas o tus preferencias actuales."
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Mapa noteId -> preferenceObject para acceso O(1)
  const preferenceByNoteId = useMemo(() => {
    const map = new Map();
    preferences.forEach((pref) => {
      const nid = pref.note?.id ?? pref.note_id;
      if (nid) map.set(Number(nid), pref);
    });
    return map;
  }, [preferences]);

  // Agrupación de notas del catálogo por familia olfativa
  const notesByFamily = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = allNotes.filter((note) => {
      if (!q) return true;
      return (
        note.name?.toLowerCase().includes(q) ||
        note.family?.toLowerCase().includes(q) ||
        note.description?.toLowerCase().includes(q)
      );
    });

    const groups = {};
    filtered.forEach((note) => {
      const familyName = note.family?.trim() || "Otras Familias Olfativas";
      if (!groups[familyName]) {
        groups[familyName] = [];
      }
      groups[familyName].push(note);
    });
    return groups;
  }, [allNotes, searchQuery]);

  const handleToggleNotePreference = async (note) => {
    const noteId = Number(note.id);
    if (pendingNoteIds.has(noteId)) return;

    setActionError(null);
    setPendingNoteIds((prev) => new Set(prev).add(noteId));

    try {
      const existingPref = preferenceByNoteId.get(noteId);
      if (existingPref) {
        await recommendationsService.removePreference(existingPref.id);
        setPreferences((prev) => prev.filter((item) => item.id !== existingPref.id));
      } else {
        const created = await recommendationsService.addPreference(noteId);
        setPreferences((prev) => [created, ...prev]);
      }
    } catch (err) {
      setActionError(
        extractApiError(err, "No se pudo actualizar la preferencia olfativa.")
      );
    } finally {
      setPendingNoteIds((prev) => {
        const next = new Set(prev);
        next.delete(noteId);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="section container">
        <Loader message="Cargando paleta de notas olfativas..." />
      </div>
    );
  }

  return (
    <div className="preferences-page section">
      <div className="container">
        <div className="preferences-header">
          <div>
            <span className="section-eyebrow">Identidad Aromática</span>
            <h1 className="page-title">Mis Preferencias Olfativas</h1>
            <p className="page-subtitle">
              Selecciona los ingredientes y acordes que más te atraen. Aromatch utilizará esta
              selección para calcular tus recomendaciones personalizadas.
            </p>
          </div>
          <Link to="/recomendaciones" className="btn btn-primary btn-lg">
            <Sparkles size={18} />
            <span>Ver mis recomendaciones ({preferences.length})</span>
          </Link>
        </div>

        {error && <ErrorMessage message={error} onRetry={loadData} />}
        {actionError && <ErrorMessage message={actionError} />}

        {/* MIS NOTAS SELECCIONADAS ACTUALMENTE */}
        <section className="selected-prefs-panel">
          <div className="selected-prefs-header">
            <h2>Tu Paleta Seleccionada ({preferences.length})</h2>
            <span>Pulsa sobre cualquier nota para quitarla de tus preferencias</span>
          </div>

          {preferences.length > 0 ? (
            <div className="selected-prefs-chips">
              {preferences.map((pref) => {
                const note = pref.note;
                if (!note) return null;
                const isPending = pendingNoteIds.has(Number(note.id));
                return (
                  <button
                    key={pref.id}
                    type="button"
                    className="selected-pref-chip"
                    disabled={isPending}
                    onClick={() => handleToggleNotePreference(note)}
                    title="Quitar de mis preferencias"
                  >
                    <span className="selected-pref-name">{note.name}</span>
                    {note.family && (
                      <span className="selected-pref-family">{note.family}</span>
                    )}
                    <X size={14} />
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="selected-prefs-empty">
              Aún no has seleccionado ninguna nota olfativa. Elige tus favoritas en las familias
              de abajo.
            </p>
          )}
        </section>

        {/* BUSCADOR DE NOTAS */}
        <div className="notes-filter-bar">
          <div className="input-wrapper">
            <span className="input-icon">
              <Search size={18} />
            </span>
            <input
              type="search"
              className="form-input with-icon"
              placeholder="Filtrar notas por nombre o familia olfativa (ej. Cítrica, Amaderada, Vainilla)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* FAMILIAS OLFATIVAS */}
        <div className="families-list">
          {Object.entries(notesByFamily).map(([family, familyNotes]) => (
            <section key={family} className="family-section">
              <div className="family-section-header">
                <h3 className="family-title">{family}</h3>
                <span className="family-count">
                  {familyNotes.length} {familyNotes.length === 1 ? "nota" : "notas"}
                </span>
              </div>

              <div className="family-notes-grid">
                {familyNotes.map((note) => {
                  const isSelected = preferenceByNoteId.has(Number(note.id));
                  const isPending = pendingNoteIds.has(Number(note.id));

                  return (
                    <button
                      key={note.id}
                      type="button"
                      disabled={isPending}
                      onClick={() => handleToggleNotePreference(note)}
                      className={`preference-note-card ${isSelected ? "is-selected" : ""}`}
                    >
                      <div className="preference-note-card-top">
                        <h4>{note.name}</h4>
                        <span className="preference-note-status">
                          {isSelected ? <Check size={16} /> : <Plus size={16} />}
                        </span>
                      </div>
                      {note.description && (
                        <p className="preference-note-desc">{note.description}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

