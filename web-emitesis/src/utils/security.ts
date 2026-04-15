/**
 * Capa cliente frente a payloads anómalos (NUL, controles ASCII) y límites de tamaño.
 * La protección real contra inyección SQL la aporta Prisma (consultas parametrizadas) y
 * class-validator en el backend.
 */

const CTRL = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

export function stripUnsafeControlChars(input: string): string {
  if (typeof input !== "string") return "";
  return input.replace(CTRL, "");
}

/** Correo antes de enviarlo al login / recuperación: sin controles, trim y minúsculas. */
export function sanitizeEmailClient(input: string): string {
  return stripUnsafeControlChars(input).trim().toLowerCase();
}

/**
 * Contraseña: solo se eliminan NUL y caracteres de control.
 * No se eliminan comillas, punto y coma ni palabras reservadas (podrían ser parte válida de la clave).
 */
export function sanitizePasswordClient(input: string): string {
  return stripUnsafeControlChars(input);
}

/** Texto de formularios (nombres, direcciones, etc.): controles, trim y límite de longitud. */
export function sanitizeFormText(input: string, maxLen = 4000): string {
  const s = stripUnsafeControlChars(input).trim();
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen);
}

/**
 * Heurística opcional en UI (p. ej. deshabilitar envío).
 * No sustituye la validación del servidor.
 */
export const isSuspicious = (input: string): boolean => {
  const sqlPatterns = [
    /--/,
    /\/\*/,
    /\*\//,
    /;\s*(select|insert|update|delete|drop|union|alter|exec)\b/i,
    /\bunion\s+select\b/i,
  ];
  return sqlPatterns.some((pattern) => pattern.test(input));
};

/**
 * @deprecated Usa sanitizeEmailClient, sanitizePasswordClient o sanitizeFormText según el campo.
 * Se mantiene por compatibilidad: equivale a sanitizeFormText con límite alto.
 */
export const sanitizeInput = (input: string): string => sanitizeFormText(input, 10_000);
