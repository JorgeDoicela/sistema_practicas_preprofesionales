/** Devuelve true si el JWT no existe, es inválido o ya expiró. */
export function isJwtExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;

    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    if (pad) base64 += "=".repeat(4 - pad);

    const decoded = window.atob(base64);
    const payload = JSON.parse(
      decodeURIComponent(
        decoded
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      ),
    );

    if (payload.exp && Date.now() >= payload.exp * 1000) return true;
    return false;
  } catch {
    return true;
  }
}
