import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { favoritesService } from "../services/favoritesService";
import { AuthContext } from "./AuthContext";

export const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { isAuthenticated } = useContext(AuthContext);
  const [favorites, setFavorites] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [pendingPerfumeIds, setPendingPerfumeIds] = useState(() => new Set());

  const refreshFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setFavorites([]);
      return [];
    }
    setLoadingFavorites(true);
    try {
      const allFavs = await favoritesService.getAllFavorites();
      setFavorites(allFavs);
      return allFavs;
    } catch {
      return [];
    } finally {
      setLoadingFavorites(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshFavorites();
    } else {
      setFavorites([]);
    }
  }, [isAuthenticated, refreshFavorites]);

  const favoritePerfumeIds = useMemo(() => {
    const ids = new Set();
    favorites.forEach((fav) => {
      const pid = fav.perfume?.id ?? fav.perfume_id;
      if (pid) ids.add(Number(pid));
    });
    return ids;
  }, [favorites]);

  const isFavorite = useCallback(
    (perfumeId) => favoritePerfumeIds.has(Number(perfumeId)),
    [favoritePerfumeIds]
  );

  const isPendingFavorite = useCallback(
    (perfumeId) => pendingPerfumeIds.has(Number(perfumeId)),
    [pendingPerfumeIds]
  );

  const toggleFavorite = useCallback(
    async (perfumeId) => {
      const numericId = Number(perfumeId);
      if (!isAuthenticated || !numericId) return false;

      setPendingPerfumeIds((prev) => new Set(prev).add(numericId));
      try {
        if (favoritePerfumeIds.has(numericId)) {
          await favoritesService.removeFavoriteByPerfumeId(numericId);
          setFavorites((prev) =>
            prev.filter((item) => Number(item.perfume?.id) !== numericId)
          );
          return false;
        } else {
          const created = await favoritesService.addFavorite(numericId);
          setFavorites((prev) => [created, ...prev]);
          return true;
        }
      } finally {
        setPendingPerfumeIds((prev) => {
          const next = new Set(prev);
          next.delete(numericId);
          return next;
        });
      }
    },
    [isAuthenticated, favoritePerfumeIds]
  );

  const removeFavoriteById = useCallback(async (favoriteId) => {
    await favoritesService.removeFavoriteById(favoriteId);
    setFavorites((prev) => prev.filter((item) => item.id !== favoriteId));
  }, []);

  const value = useMemo(
    () => ({
      favorites,
      loadingFavorites,
      isFavorite,
      isPendingFavorite,
      toggleFavorite,
      removeFavoriteById,
      refreshFavorites,
    }),
    [
      favorites,
      loadingFavorites,
      isFavorite,
      isPendingFavorite,
      toggleFavorite,
      removeFavoriteById,
      refreshFavorites,
    ]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

