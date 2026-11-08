import { Link } from "react-router-dom";
import { Compass, Heart, Trash2 } from "lucide-react";
import { useFavorites } from "../../hooks/useFavorites";
import PerfumeCard from "../../components/perfumes/PerfumeCard";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";

export default function FavoritesPage() {
  const { favorites, loadingFavorites, removeFavoriteById } = useFavorites();

  if (loadingFavorites) {
    return (
      <div className="section container">
        <Loader message="Cargando tu colección personal de favoritos..." />
      </div>
    );
  }

  return (
    <div className="favorites-page section">
      <div className="container">
        <div className="page-header">
          <span className="section-eyebrow">Colección Privada</span>
          <h1 className="page-title">Mis Fragancias Favoritas</h1>
          <p className="page-subtitle">
            Guarda y administra las creaciones que forman parte de tu guardarropa olfativo o de tu
            lista de deseos.
          </p>
        </div>

        {favorites.length > 0 ? (
          <div className="perfume-grid">
            {favorites.map((favItem) => {
              const perfume = favItem.perfume;
              if (!perfume) return null;

              return (
                <div key={favItem.id} className="favorite-item-wrapper">
                  <PerfumeCard perfume={perfume} />
                  <button
                    type="button"
                    className="favorite-remove-bar"
                    onClick={() => removeFavoriteById(favItem.id)}
                  >
                    <Trash2 size={14} />
                    <span>Quitar de mi colección</span>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Heart}
            title="Tu colección de favoritos está vacía"
            description="Explora el catálogo de Aromatch y pulsa el icono del corazón en las fragancias que desees conservar aquí."
            action={
              <Link to="/catalogo" className="btn btn-primary">
                <Compass size={17} />
                <span>Explorar el catálogo</span>
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}

