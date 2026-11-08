import { useContext } from "react";
import { FavoritesContext } from "../context/FavoritesContext";

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites debe utilizarse dentro de un FavoritesProvider");
  }
  return context;
}

