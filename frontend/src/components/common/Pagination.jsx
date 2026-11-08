import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  currentPage = 1,
  totalCount = 0,
  pageSize = 12,
  hasNext = false,
  hasPrevious = false,
  onPageChange,
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  if (totalPages <= 1 && !hasNext && !hasPrevious) {
    return null;
  }

  const pages = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  for (let p = start; p <= end; p += 1) {
    pages.push(p);
  }

  return (
    <nav className="pagination" aria-label="Paginación de resultados">
      <button
        type="button"
        className="pagination-btn"
        disabled={!hasPrevious && currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft size={16} />
        <span>Anterior</span>
      </button>

      <div className="pagination-pages">
        {start > 1 && (
          <>
            <button
              type="button"
              className="pagination-number"
              onClick={() => onPageChange(1)}
            >
              1
            </button>
            {start > 2 && <span className="pagination-ellipsis">…</span>}
          </>
        )}

        {pages.map((page) => (
          <button
            key={page}
            type="button"
            className={`pagination-number ${page === currentPage ? "active" : ""}`}
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </button>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="pagination-ellipsis">…</span>}
            <button
              type="button"
              className="pagination-number"
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}
      </div>

      <button
        type="button"
        className="pagination-btn"
        disabled={!hasNext && currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <span>Siguiente</span>
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}

