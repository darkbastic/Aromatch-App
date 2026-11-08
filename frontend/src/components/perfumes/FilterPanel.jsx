import { RotateCcw, SlidersHorizontal } from "lucide-react";
import {
  CONCENTRATION_OPTIONS,
  DURATION_OPTIONS,
  GENDER_OPTIONS,
  ORDERING_OPTIONS,
  PROJECTION_OPTIONS,
  SEASON_OPTIONS,
} from "../../utils/constants";

export default function FilterPanel({
  filters,
  brands = [],
  notes = [],
  onFilterChange,
  onResetFilters,
}) {
  const activeCount = [
    filters.brand,
    filters.concentration,
    filters.gender,
    filters.season,
    filters.estimated_duration,
    filters.projection,
    filters.note,
  ].filter(Boolean).length;

  return (
    <aside className="filter-panel" aria-label="Filtros del catálogo">
      <div className="filter-panel-header">
        <div className="filter-panel-title">
          <SlidersHorizontal size={18} />
          <h3>Filtrar Catálogo</h3>
          {activeCount > 0 && <span className="filter-badge">{activeCount}</span>}
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            className="filter-reset-btn"
            onClick={onResetFilters}
          >
            <RotateCcw size={14} />
            <span>Limpiar</span>
          </button>
        )}
      </div>

      <div className="filter-groups">
        <div className="filter-group">
          <label htmlFor="filter-ordering" className="filter-label">
            Ordenar por
          </label>
          <select
            id="filter-ordering"
            className="filter-select"
            value={filters.ordering || "brand__name"}
            onChange={(e) => onFilterChange("ordering", e.target.value)}
          >
            {ORDERING_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-brand" className="filter-label">
            Marca / Casa Perfumista
          </label>
          <select
            id="filter-brand"
            className="filter-select"
            value={filters.brand || ""}
            onChange={(e) => onFilterChange("brand", e.target.value)}
          >
            <option value="">Todas las marcas</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {b.country ? `(${b.country})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-note" className="filter-label">
            Nota Olfativa
          </label>
          <select
            id="filter-note"
            className="filter-select"
            value={filters.note || ""}
            onChange={(e) => onFilterChange("note", e.target.value)}
          >
            <option value="">Todas las notas</option>
            {notes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name} {n.family ? `— ${n.family}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-concentration" className="filter-label">
            Concentración
          </label>
          <select
            id="filter-concentration"
            className="filter-select"
            value={filters.concentration || ""}
            onChange={(e) => onFilterChange("concentration", e.target.value)}
          >
            <option value="">Todas las concentraciones</option>
            {CONCENTRATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-gender" className="filter-label">
            Público Objetivo (Género)
          </label>
          <select
            id="filter-gender"
            className="filter-select"
            value={filters.gender || ""}
            onChange={(e) => onFilterChange("gender", e.target.value)}
          >
            <option value="">Todos</option>
            {GENDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-season" className="filter-label">
            Estación Recomendada
          </label>
          <select
            id="filter-season"
            className="filter-select"
            value={filters.season || ""}
            onChange={(e) => onFilterChange("season", e.target.value)}
          >
            <option value="">Cualquier estación</option>
            {SEASON_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-duration" className="filter-label">
            Duración Estimada
          </label>
          <select
            id="filter-duration"
            className="filter-select"
            value={filters.estimated_duration || ""}
            onChange={(e) => onFilterChange("estimated_duration", e.target.value)}
          >
            <option value="">Cualquier duración</option>
            {DURATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-projection" className="filter-label">
            Proyección / Estela
          </label>
          <select
            id="filter-projection"
            className="filter-select"
            value={filters.projection || ""}
            onChange={(e) => onFilterChange("projection", e.target.value)}
          >
            <option value="">Cualquier proyección</option>
            {PROJECTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </aside>
  );
}

