import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Compass, SlidersHorizontal, X } from "lucide-react";
import { catalogService } from "../../services/catalogService";
import { extractApiError } from "../../utils/helpers";
import SearchBar from "../../components/perfumes/SearchBar";
import FilterPanel from "../../components/perfumes/FilterPanel";
import PerfumeGrid from "../../components/perfumes/PerfumeGrid";
import Pagination from "../../components/common/Pagination";
import Loader from "../../components/common/Loader";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";

const INITIAL_FILTERS = {
  search: "",
  brand: "",
  concentration: "",
  gender: "",
  season: "",
  estimated_duration: "",
  projection: "",
  note: "",
  ordering: "brand__name",
  page: 1,
};

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || ""
  );
  const [brands, setBrands] = useState([]);
  const [notes, setNotes] = useState([]);
  const [perfumesData, setPerfumesData] = useState({
    count: 0,
    next: null,
    previous: null,
    results: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Construye el estado de filtros desde la URL actual
  const currentFilters = {
    search: searchParams.get("search") || "",
    brand: searchParams.get("brand") || "",
    concentration: searchParams.get("concentration") || "",
    gender: searchParams.get("gender") || "",
    season: searchParams.get("season") || "",
    estimated_duration: searchParams.get("estimated_duration") || "",
    projection: searchParams.get("projection") || "",
    note: searchParams.get("note") || "",
    ordering: searchParams.get("ordering") || "brand__name",
    page: Number(searchParams.get("page")) || 1,
  };

  useEffect(() => {
    setSearchInput(searchParams.get("search") || "");
  }, [searchParams]);

  // Carga marcas y notas para los selectores de filtrado
  useEffect(() => {
    let mounted = true;
    async function loadFilterOptions() {
      try {
        const [allBrands, allNotes] = await Promise.all([
          catalogService.getAllBrands(),
          catalogService.getAllNotes(),
        ]);
        if (mounted) {
          setBrands(allBrands);
          setNotes(allNotes);
        }
      } catch {
        // Silencioso: el catálogo principal seguirá funcionando
      }
    }
    loadFilterOptions();
    return () => {
      mounted = false;
    };
  }, []);

  const fetchPerfumes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await catalogService.getPerfumes({
        search: searchParams.get("search") || undefined,
        brand: searchParams.get("brand") || undefined,
        concentration: searchParams.get("concentration") || undefined,
        gender: searchParams.get("gender") || undefined,
        season: searchParams.get("season") || undefined,
        estimated_duration: searchParams.get("estimated_duration") || undefined,
        projection: searchParams.get("projection") || undefined,
        note: searchParams.get("note") || undefined,
        ordering: searchParams.get("ordering") || "brand__name",
        page: Number(searchParams.get("page")) || 1,
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
      setError(extractApiError(err, "No se pudo cargar el catálogo de perfumes."));
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchPerfumes();
  }, [fetchPerfumes]);

  const updateQueryParams = (updates) => {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || String(value).trim() === "") {
        nextParams.delete(key);
      } else {
        nextParams.set(key, String(value));
      }
    });
    // Reiniciar a página 1 cuando cambian filtros distintos de page
    if (!("page" in updates)) {
      nextParams.delete("page");
    }
    setSearchParams(nextParams);
  };

  const handleFilterChange = (field, value) => {
    updateQueryParams({ [field]: value });
  };

  const handleSearchSubmit = (query) => {
    updateQueryParams({ search: query });
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSearchParams({});
  };

  const handlePageChange = (newPage) => {
    updateQueryParams({ page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="catalog-page section">
      <div className="container">
        <div className="page-header">
          <span className="section-eyebrow">Colección Aromatch</span>
          <h1 className="page-title">Catálogo de Fragancias</h1>
          <p className="page-subtitle">
            Explora nuestra biblioteca olfativa filtrando por casa perfumista, concentración,
            estación recomendada y acordes predominantes.
          </p>
        </div>

        <div className="catalog-top-bar">
          <div className="catalog-search-col">
            <SearchBar
              value={searchInput}
              onChange={setSearchInput}
              onSubmit={handleSearchSubmit}
              onClear={() => updateQueryParams({ search: "" })}
              placeholder="Buscar por nombre del perfume, marca o descripción..."
            />
          </div>

          <button
            type="button"
            className="btn btn-outline catalog-mobile-filter-btn"
            onClick={() => setMobileFiltersOpen((prev) => !prev)}
          >
            <SlidersHorizontal size={16} />
            <span>{mobileFiltersOpen ? "Ocultar filtros" : "Mostrar filtros"}</span>
          </button>
        </div>

        <div className="catalog-layout">
          <div className={`catalog-sidebar ${mobileFiltersOpen ? "is-open" : ""}`}>
            <FilterPanel
              filters={currentFilters}
              brands={brands}
              notes={notes}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
            />
          </div>

          <div className="catalog-main">
            <div className="catalog-results-bar">
              <p className="catalog-count">
                Mostrando <strong>{perfumesData.results.length}</strong> de{" "}
                <strong>{perfumesData.count}</strong>{" "}
                {perfumesData.count === 1 ? "fragancia" : "fragancias"}
              </p>

              {(currentFilters.search ||
                currentFilters.brand ||
                currentFilters.concentration ||
                currentFilters.gender ||
                currentFilters.season ||
                currentFilters.estimated_duration ||
                currentFilters.projection ||
                currentFilters.note) && (
                <button
                  type="button"
                  className="clear-all-chip"
                  onClick={handleResetFilters}
                >
                  <X size={14} />
                  <span>Limpiar todos los filtros</span>
                </button>
              )}
            </div>

            {loading ? (
              <Loader message="Consultando catálogo de fragancias..." />
            ) : error ? (
              <ErrorMessage message={error} onRetry={fetchPerfumes} />
            ) : perfumesData.results.length > 0 ? (
              <>
                <PerfumeGrid perfumes={perfumesData.results} />
                <Pagination
                  currentPage={currentFilters.page}
                  totalCount={perfumesData.count}
                  pageSize={12}
                  hasNext={Boolean(perfumesData.next)}
                  hasPrevious={Boolean(perfumesData.previous)}
                  onPageChange={handlePageChange}
                />
              </>
            ) : (
              <EmptyState
                icon={Compass}
                title="No encontramos fragancias con estos filtros"
                description="Prueba eliminando alguno de los filtros activos o buscando otro término olfativo."
                action={
                  <Button variant="primary" onClick={handleResetFilters}>
                    Restablecer catálogo completo
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

