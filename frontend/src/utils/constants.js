export const CONCENTRATION_OPTIONS = [
  { value: "EDC", label: "Eau de Cologne (EDC)" },
  { value: "EDT", label: "Eau de Toilette (EDT)" },
  { value: "EDP", label: "Eau de Parfum (EDP)" },
  { value: "PARFUM", label: "Parfum" },
  { value: "EXTRAIT", label: "Extrait de Parfum" },
];

export const GENDER_OPTIONS = [
  { value: "FEMININE", label: "Femenino" },
  { value: "MASCULINE", label: "Masculino" },
  { value: "UNISEX", label: "Unisex" },
];

export const SEASON_OPTIONS = [
  { value: "SPRING", label: "Primavera" },
  { value: "SUMMER", label: "Verano" },
  { value: "AUTUMN", label: "Otoño" },
  { value: "WINTER", label: "Invierno" },
];

export const SEASON_LABELS = {
  SPRING: "Primavera",
  SUMMER: "Verano",
  AUTUMN: "Otoño",
  WINTER: "Invierno",
};

export const DURATION_OPTIONS = [
  { value: "WEAK", label: "Suave (1 - 3 horas)" },
  { value: "MODERATE", label: "Moderada (3 - 6 horas)" },
  { value: "LONG_LASTING", label: "Duradera (6 - 8 horas)" },
  { value: "ETERNAL", label: "Muy duradera (8+ horas)" },
];

export const PROJECTION_OPTIONS = [
  { value: "INTIMATE", label: "Íntima" },
  { value: "MODERATE", label: "Moderada" },
  { value: "STRONG", label: "Fuerte" },
  { value: "ENORMOUS", label: "Muy fuerte" },
];

export const ORDERING_OPTIONS = [
  { value: "brand__name", label: "Marca (A - Z)" },
  { value: "name", label: "Nombre (A - Z)" },
  { value: "-average_rating", label: "Mejor calificados" },
  { value: "-release_year", label: "Más recientes (Año)" },
  { value: "release_year", label: "Clásicos (Año)" },
  { value: "-created_at", label: "Nuevos en catálogo" },
];

export const NOTE_TYPE_LABELS = {
  TOP: "Notas de Salida",
  HEART: "Notas de Corazón",
  BASE: "Notas de Fondo",
};

