/**
 * Respuestas predefinidas y base de conocimiento de AromaBot
 */

export const INITIAL_MESSAGE =
  "¡Hola! Soy AromaBot, tu asesor de perfumería en Aromatch. Estoy aquí para ayudarte a descubrir el mundo de las fragancias y resolver tus dudas. ¿En qué puedo ayudarte?";

export const QUICK_ACTIONS = [
  { id: "familias", label: "Familias olfativas" },
  { id: "notas", label: "Notas de perfumería" },
  { id: "concentraciones", label: "Concentraciones" },
  { id: "consejos", label: "Consejos de uso" },
  { id: "elegir", label: "Cómo elegir fragancia" },
  { id: "diferencias", label: "Diferencias entre perfumes" },
];

export const TOPIC_RESPONSES = {
  familias: `Las familias olfativas son clasificaciones estándar que agrupan fragancias según sus acordes predominantes:

• **Cítrica / Hespéride:** Fresca, luminosa y efervescente (bergamota, limón, mandarina). Ideal para climas cálidos y uso diurno.
• **Floral:** Romántica y versátil (rosa, jazmín, iris). Puede ser soliflor o un bouquet complejo.
• **Amaderada:** Cálida, elegante y estructurada (cedro, sándalo, vetiver, pachulí). Excelente para otoño e invierno.
• **Oriental / Ambarada:** Sensual, opulenta y envolvente (vainilla, resinas, especias cálidas, haba tonka).
• **Aromática / Fougère:** Herbácea, clásica y limpia (lavanda, romero, salvia). Característica de muchas fragancias masculinas refinadas.
• **Acuática / Marina:** Evoca la brisa marina, ozono y frescura costera. Muy revitalizante.
• **Gourmand:** Deliciosa y reconfortante con acordes comestibles (cacao, café, toffee, miel, almendra).`,

  notas: `La arquitectura de una fragancia se organiza en la **Pirámide Olfativa**, compuesta por tres fases de evaporación:

1. **Notas de Salida (Head / Top):** Es la primera impresión que percibes al atomizar. Dura entre 5 y 15 minutos. Suelen ser cítricos, hierbas frescas o frutas ligeras.
2. **Notas de Corazón (Heart):** Constituyen la personalidad y cuerpo principal del perfume. Aparecen tras la salida y perduran de 2 a 4 horas. Habitualmente son flores, especias o acordes frutales más densos.
3. **Notas de Fondo (Base):** La fijación y memoria profunda de la fragancia. Se asientan a partir de la segunda hora y pueden durar más de 8 horas en piel. Incluyen maderas, ámbar, almizcles, resinas y vainilla.`,

  concentraciones: `La concentración determina la proporción de esencia pura frente al alcohol, lo que incide en su intensidad y duración:

• **Eau de Cologne (EDC):** 2% - 4% de esencia. Ligera y tonificante, dura entre 1 y 2 horas.
• **Eau de Toilette (EDT):** 5% - 15% de esencia. Fresca, con buena proyección inicial, dura de 3 a 5 horas.
• **Eau de Parfum (EDP):** 15% - 20% de esencia. Más concentrada y densa, suele durar de 6 a 8 horas con excelente fijación.
• **Parfum / Extrait de Parfum:** 20% - 40% de esencia. La expresión más pura y rica. Proyección íntima pero duración prolongada que supera las 8 a 12 horas.`,

  consejos: `Para maximizar el rendimiento y la apreciación de tu fragancia:

• **Puntos de pulso:** Aplica en zonas donde la circulación sanguínea eleva la temperatura: cuello, parte interior de las muñecas, detrás de las orejas y en el pliegue de los codos.
• **Hidratación previa:** La piel hidratada retiene mucho mejor los aceites aromáticos. Aplicar una crema humectante neutra antes del perfume multiplica su fijación.
• **No frotes las muñecas:** Frotar rompe las moléculas más volátiles de salida y altera la pirámide natural de la fragancia.
• **Conservación:** Guarda tus frascos lejos de la luz solar directa, la humedad excesiva y cambios bruscos de temperatura. Evita dejarlos en el cuarto de baño.`,

  elegir: `Para orientarte en la elección de tu perfume ideal, te sugiero considerar tres factores clave:

1. **Ocasión de uso:** Para oficina o uso diario van mejor perfiles limpios y discretos (cítricos o aromáticos). Para citas nocturnas o eventos especiales funcionan mejor fragancias ambaradas, especiadas o gourmand.
2. **Estación y clima:** El calor intensifica la proyección, favoreciendo notas frescas; el frío atenúa el aroma, por lo que admite fragancias más densas y cálidas.
3. **Firma personal:** Pregúntate qué sensación deseas transmitir: frescura energética, elegancia sobria, misterio o sofisticación dulce.

Puedes explorar las secciones de **Catálogo** y **Recomendaciones** de Aromatch para afinar tus gustos.`,

  diferencias: `Las diferencias esenciales entre fragancias radican en:

• **La concentración:** Un mismo perfume en versión EDT suele ser más chispeante y volátil, mientras que su versión EDP o Parfum resalta notas más ricas y densas de fondo.
• **Evolución:** Las fragancias de calidad evolucionan dinámicamente según la química de tu piel y el tiempo, a diferencia de acordes lineales que huelen igual de principio a fin.
• **Sillage (Estela) vs. Longevidad:** La estela es el rastro aromático que dejas al caminar, mientras que la longevidad es cuántas horas permanece detectable en la piel.`,

  fallback: `Aún estoy perfeccionando mis conocimientos. Con gusto puedo asesorarte sobre estos temas fundamentales:

• **Familias olfativas** (cítricas, florales, amaderadas, orientales, etc.)
• **Notas de perfumería** (salida, corazón y fondo)
• **Concentraciones** (EDC, EDT, EDP, Parfum)
• **Consejos de aplicación y duración**
• **Cómo elegir la fragancia adecuada**
• **Diferencias entre perfumes**

Puedes seleccionar uno de los accesos rápidos o escribir tu consulta relacionada con estos temas.`,
};

/**
 * Motor ligero de coincidencia por palabras clave para consultas escritas
 */
export function getBotResponse(userText) {
  if (!userText || !userText.trim()) {
    return TOPIC_RESPONSES.fallback;
  }

  const text = userText
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // Saludos básicos
  if (
    /^(hola|buenos dias|buenas tardes|buenas noches|saludos|hey|buenas)/i.test(
      text
    )
  ) {
    return "¡Hola! Es un gusto saludarte. ¿Sobre qué aspecto de la perfumería te gustaría conversar hoy? Puedes preguntarme por familias olfativas, notas, concentraciones o consejos de uso.";
  }

  // Agradecimientos
  if (/(gracias|muchas gracias|agradezco|excelente|genial|perfecto)/i.test(text)) {
    return "¡Con mucho gusto! Estoy aquí siempre que desees profundizar en el fascinante arte de la perfumería. ¿Hay algo más en lo que pueda orientarte?";
  }

  // Familias olfativas
  if (
    /(familia|familias|oliativa|olfativa|amaderad|citric|floral|oriental|fougere|gourmand|acuatica)/i.test(
      text
    )
  ) {
    return TOPIC_RESPONSES.familias;
  }

  // Concentraciones (EDT, EDP, etc.)
  if (
    /(concentracion|concentraciones|edt|edp|parfum|cologne|colonia|eau de toilette|eau de parfum|extrait|extracto)/i.test(
      text
    )
  ) {
    return TOPIC_RESPONSES.concentraciones;
  }

  // Notas y pirámide olfativa
  if (
    /(nota|notas|piramide|salida|corazon|fondo|acorde|ingrediente|desarrollo|evolucion)/i.test(
      text
    )
  ) {
    return TOPIC_RESPONSES.notas;
  }

  // Consejos de uso, aplicación, duración, almacenamiento
  if (
    /(consejo|consejos|aplicar|aplicacion|duracion|durar|fijacion|fijar|donde ponerse|donde aplicar|piel|muñeca|guardar|conservar)/i.test(
      text
    )
  ) {
    return TOPIC_RESPONSES.consejos;
  }

  // Cómo elegir perfume / recomendación
  if (
    /(elegir|comprar|cual me recomiendas|recomendacion|como elegir|ocasion|verano|invierno|oficina|cita|diario)/i.test(
      text
    )
  ) {
    return TOPIC_RESPONSES.elegir;
  }

  // Diferencias
  if (
    /(diferencia|diferencias|sillage|estela|distinto|comparar)/i.test(text)
  ) {
    return TOPIC_RESPONSES.diferencias;
  }

  return TOPIC_RESPONSES.fallback;
}

