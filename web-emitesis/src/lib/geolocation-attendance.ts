/**
 * Geolocalización para asistencia: reintentos, fallback, caché, deduplicación.
 */

export type AttendanceCoords = {
  lat: number;
  lng: number;
  /** Precisión reportada por el navegador (metros) */
  accuracyM: number | null;
};

export type AccuracyLevel = "alta" | "media" | "baja" | "desconocida";

export function getAccuracyLevel(accuracyM: number | null): AccuracyLevel {
  if (accuracyM === null) return "desconocida";
  if (accuracyM <= 30) return "alta";
  if (accuracyM <= 100) return "media";
  return "baja";
}

export function getAccuracyLabel(accuracyM: number | null): string {
  const level = getAccuracyLevel(accuracyM);
  const suffix = accuracyM !== null ? ` (±${Math.round(accuracyM)}m)` : "";
  const labels: Record<AccuracyLevel, string> = {
    alta: `Precisión alta${suffix}`,
    media: `Precisión media${suffix}`,
    baja: `Precisión baja${suffix} — si falla el rango, espera mejor señal`,
    desconocida: "Precisión desconocida",
  };
  return labels[level];
}

const CACHE_MAX_AGE_MS = 40_000;
const CACHE_MIN_ACCURACY_M = 200;

let cache: { value: AttendanceCoords; at: number } | null = null;
/** Deduplicación: si hay una petición GPS en vuelo, todos esperan la misma */
let pendingRequest: Promise<AttendanceCoords> | null = null;

export function clearAttendanceGeoCache() {
  cache = null;
  pendingRequest = null;
}

function positionToCoords(pos: GeolocationPosition): AttendanceCoords {
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracyM: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null,
  };
}

function getOnce(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

async function fetchCoordinates(): Promise<AttendanceCoords> {
  if (!navigator.geolocation) {
    throw new Error("Tu navegador no soporta geolocalización");
  }

  const highAcc: PositionOptions = { enableHighAccuracy: true,  maximumAge: 0,      timeout: 20_000 };
  const lowAcc:  PositionOptions = { enableHighAccuracy: false, maximumAge: 25_000, timeout: 15_000 };

  let firstError: unknown = null;
  try {
    const pos = await getOnce(highAcc);
    const v = positionToCoords(pos);
    cache = { value: v, at: Date.now() };
    return v;
  } catch (e) {
    firstError = e;
  }

  try {
    const pos2 = await getOnce(lowAcc);
    const v = positionToCoords(pos2);
    cache = { value: v, at: Date.now() };
    return v;
  } catch {
    // Ambos fallaron: lanzar el error original del intento de alta precisión
    throw firstError;
  }
}

/**
 * Obtiene coordenadas para asistencia.
 * - Usa caché si es reciente y precisa.
 * - Deduplica peticiones concurrentes (si se llama dos veces a la vez, solo hace un GPS).
 */
export function getAttendanceCoordinates(): Promise<AttendanceCoords> {
  const now = Date.now();
  if (
    cache &&
    now - cache.at < CACHE_MAX_AGE_MS &&
    (cache.value.accuracyM === null || cache.value.accuracyM <= CACHE_MIN_ACCURACY_M)
  ) {
    return Promise.resolve(cache.value);
  }

  if (pendingRequest) return pendingRequest;

  pendingRequest = fetchCoordinates().finally(() => {
    pendingRequest = null;
  });
  return pendingRequest;
}

/** Prefetch silencioso al abrir el modal para que el GPS ya esté listo. */
export function prefetchAttendanceCoordinates() {
  if (typeof navigator === "undefined" || !navigator.geolocation) return;
  void getAttendanceCoordinates().catch(() => undefined);
}

export function geoErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as GeolocationPositionError).code;
    if (code === 1)
      return "Permiso de ubicación denegado. Abre la configuración del sitio en el navegador y activa la ubicación.";
    if (code === 2)
      return "No se pudo determinar la posición (señal insuficiente o GPS apagado). Sal al exterior e intenta de nuevo.";
    if (code === 3)
      return "El GPS tardó demasiado en responder. Activa el GPS, desactiva el modo de ahorro de batería y reintenta.";
  }
  if (err instanceof Error) return err.message;
  return "No se pudo obtener la ubicación GPS.";
}
