/**
 * Genera una ilustración SVG elegante en Data URI como respaldo cuando un perfume
 * no tiene `image_url` o cuando la URL externa falla al cargar.
 */
export function getPerfumeFallbackImage(perfumeName = "Aromatch", brandName = "Haute Parfumerie") {
  const safeName = String(perfumeName).slice(0, 26).replace(/[<>&"']/g, "");
  const safeBrand = String(brandName).slice(0, 24).replace(/[<>&"']/g, "").toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#F8F6F2"/>
        <stop offset="50%" stop-color="#EFEAE1"/>
        <stop offset="100%" stop-color="#E4DAC8"/>
      </linearGradient>
      <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#D2B785"/>
        <stop offset="50%" stop-color="#B89B69"/>
        <stop offset="100%" stop-color="#967A4A"/>
      </linearGradient>
      <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.88"/>
        <stop offset="100%" stop-color="#F4EFE6" stop-opacity="0.65"/>
      </linearGradient>
    </defs>
    <rect width="400" height="500" fill="url(#bg)"/>
    <circle cx="200" cy="240" r="150" fill="#FFFFFF" fill-opacity="0.45"/>
    <!-- Tapa del frasco -->
    <rect x="172" y="92" width="56" height="38" rx="4" fill="#222222"/>
    <rect x="180" y="130" width="40" height="16" fill="url(#gold)"/>
    <!-- Cuerpo del frasco -->
    <rect x="115" y="146" width="170" height="240" rx="18" fill="url(#glass)" stroke="url(#gold)" stroke-width="2"/>
    <rect x="125" y="156" width="150" height="220" rx="12" fill="none" stroke="#B89B69" stroke-opacity="0.35" stroke-width="1"/>
    <!-- Líquido ámbar sutil -->
    <path d="M126 230 Q200 238 274 230 L274 364 Q274 374 264 374 L136 374 Q126 374 126 364 Z" fill="#B89B69" fill-opacity="0.16"/>
    <!-- Etiqueta central -->
    <rect x="138" y="210" width="124" height="106" rx="4" fill="#FFFFFF" stroke="#B89B69" stroke-width="1.2"/>
    <rect x="143" y="215" width="114" height="96" rx="2" fill="none" stroke="#E9E1D5" stroke-width="0.8"/>
    <text x="200" y="246" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="9" fill="#777777" letter-spacing="2">${safeBrand}</text>
    <line x1="168" y1="256" x2="232" y2="256" stroke="#B89B69" stroke-width="0.8"/>
    <text x="200" y="278" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="13" font-weight="bold" fill="#222222">${safeName}</text>
    <text x="200" y="298" text-anchor="middle" font-family="sans-serif" font-size="8" fill="#B89B69" letter-spacing="1.5">AROMATCH COLLECTION</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Extrae un mensaje legible en español a partir de un error de Axios / Django REST Framework.
 */
export function extractApiError(error, defaultMessage = "Ocurrió un error inesperado. Intenta nuevamente.") {
  if (!error) return defaultMessage;

  if (!error.response) {
    return "No fue posible conectar con el servidor de Aromatch. Si el servidor estaba inactivo, espera unos segundos y vuelve a intentarlo.";
  }

  const data = error.response.data;
  if (!data) return defaultMessage;

  if (typeof data === "string") return data;
  if (typeof data.detail === "string") return data.detail;

  if (Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
    return data.non_field_errors.join(" ");
  }

  if (typeof data === "object") {
    const messages = [];
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        messages.push(`${value.join(" ")}`);
      } else if (typeof value === "string") {
        messages.push(value);
      }
    }
    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  return defaultMessage;
}

/**
 * Formatea una fecha ISO a formato legible en español (Chile).
 */
export function formatDate(isoString) {
  if (!isoString) return "";
  try {
    return new Intl.DateTimeFormat("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

