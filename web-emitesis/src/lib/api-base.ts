/**
 * Base del backend Nest (`/api`).
 * Por defecto se usa `127.0.0.1` en lugar de `localhost` para reducir fallos de `fetch`
 * (p. ej. "Failed to fetch") cuando `localhost` resuelve a IPv6 y el API solo escucha IPv4.
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api";
