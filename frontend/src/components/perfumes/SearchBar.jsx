import { Search, X } from "lucide-react";

export default function SearchBar({
  value = "",
  onChange,
  onSubmit,
  onClear,
  placeholder = "Buscar por perfume, marca o acorde olfativo...",
  buttonText = "Buscar",
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(value);
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit} role="search">
      <div className="search-bar-input-wrap">
        <Search size={19} className="search-bar-icon" aria-hidden="true" />
        <input
          type="search"
          className="search-bar-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
        />
        {value && (
          <button
            type="button"
            className="search-bar-clear"
            onClick={() => {
              onChange("");
              if (onClear) onClear();
            }}
            aria-label="Limpiar búsqueda"
          >
            <X size={16} />
          </button>
        )}
      </div>
      <button type="submit" className="btn btn-primary search-bar-submit">
        {buttonText}
      </button>
    </form>
  );
}

