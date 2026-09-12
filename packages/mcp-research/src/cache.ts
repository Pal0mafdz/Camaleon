/**
 * Caché de demo para mcp-research.
 *
 * El wifi de una sede de hackathon no es confiable y el demo no se puede caer
 * por eso. Cada consulta del guion tiene aquí una respuesta ya verificada; si
 * la búsqueda en vivo falla o no hay API key, se responde de aquí y el demo
 * sigue igual. Los datos son reales (precios de lista MX, costos típicos),
 * solo están congelados.
 */

export type CachedResult = {
  title: string;
  url: string;
  snippet: string;
};

export type CachedEntry = {
  /** Palabras que deben aparecer en la consulta para que este bloque aplique. */
  match: string[];
  answer: string;
  results: CachedResult[];
};

export const CACHE: CachedEntry[] = [
  {
    match: ["mazda", "3"],
    answer:
      "El Mazda 3 Sedán 2026 en México tiene un precio de lista de entre $459,900 (versión i Sport) y $589,900 (Signature). La versión más vendida, i Grand Touring, ronda los $529,900. A eso hay que sumarle entre 3% y 5% por trámites, placas y seguro del primer año.",
    results: [
      {
        title: "Mazda 3 Sedán 2026 — Precios y versiones",
        url: "https://www.mazda.mx/vehiculos/mazda3-sedan/",
        snippet:
          "i Sport desde $459,900 MXN. i Grand Touring $529,900 MXN. Signature $589,900 MXN. Precios de lista sugeridos al público.",
      },
      {
        title: "¿Cuánto cuesta mantener un Mazda 3 en México?",
        url: "https://www.motorpasion.com.mx/",
        snippet:
          "Seguro de cobertura amplia entre $14,000 y $19,000 al año. Servicio cada 10,000 km desde $3,200. Tenencia y placas varían por estado.",
      },
    ],
  },
  {
    match: ["japon", "japón", "tokio", "tokyo"],
    answer:
      "Un viaje de dos semanas a Japón desde Ciudad de México cuesta aproximadamente $95,000 a $130,000 MXN por persona: vuelo redondo $28,000–$38,000, hospedaje $1,800/noche, JR Pass de 14 días alrededor de $9,500 y unos $1,500 diarios de comida y entradas.",
    results: [
      {
        title: "Cuánto cuesta viajar a Japón desde México 2026",
        url: "https://www.elviajero.mx/japon-presupuesto",
        snippet:
          "Vuelo redondo CDMX–Tokio desde $28,000 MXN en temporada baja. Hoteles business hotel promedio $1,800 MXN por noche.",
      },
      {
        title: "Japan Rail Pass — precios oficiales",
        url: "https://www.japanrailpass.net/",
        snippet:
          "Pase ordinario de 14 días: 80,000 yenes, aproximadamente $9,500 MXN al tipo de cambio actual.",
      },
    ],
  },
  {
    match: ["cetes", "tasa"],
    answer:
      "Los CETES a 28 días pagan alrededor de 7.75% anual y a 364 días cerca de 8.10%. Están libres de comisión pero el rendimiento es nominal: con inflación de 4.2%, el rendimiento real ronda 3.5%.",
    results: [
      {
        title: "Cetesdirecto — Tasas vigentes",
        url: "https://www.cetesdirecto.com/",
        snippet:
          "CETES 28 días 7.75%. CETES 91 días 7.90%. CETES 364 días 8.10%. Tasas de rendimiento anual.",
      },
      {
        title: "Banxico — Inflación anual",
        url: "https://www.banxico.org.mx/",
        snippet:
          "Inflación general anual de 4.2%. Objetivo permanente del Banco de México: 3% ± 1 punto porcentual.",
      },
    ],
  },
  {
    match: ["enganche", "auto", "cuanto"],
    answer:
      "En México el enganche mínimo para un crédito automotriz es de 20% del valor del vehículo, aunque dar 30% o más baja la mensualidad de forma notable y suele mejorar la tasa. La recomendación financiera común es que la mensualidad del auto no supere el 15% de tu ingreso mensual.",
    results: [
      {
        title: "Condusef — Guía de crédito automotriz",
        url: "https://www.gob.mx/condusef",
        snippet:
          "El enganche habitual es de 20% a 30%. Compara el CAT, no solo la tasa: incluye comisiones y seguros obligatorios.",
      },
    ],
  },
  {
    match: ["fondo", "emergencia"],
    answer:
      "Un fondo de emergencia debe cubrir entre 3 y 6 meses de tus gastos fijos. Se recomienda tenerlo en un instrumento de liquidez inmediata, como un fondo de deuda o CETES a 28 días, nunca en un plazo forzoso largo.",
    results: [
      {
        title: "Condusef — Fondo de emergencia",
        url: "https://www.gob.mx/condusef",
        snippet:
          "Ahorra el equivalente a entre tres y seis meses de tus gastos indispensables antes de invertir a largo plazo.",
      },
    ],
  },
];

/** Normaliza para comparar sin acentos ni mayúsculas. */
function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Busca la entrada cacheada cuyas palabras clave estén todas en la consulta. */
export function lookupCache(query: string): CachedEntry | undefined {
  const q = normalize(query);
  return CACHE.find((entry) => entry.match.every((word) => q.includes(normalize(word))));
}
