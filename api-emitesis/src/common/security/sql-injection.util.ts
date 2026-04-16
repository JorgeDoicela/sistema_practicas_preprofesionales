/**
 * Utilidades defensivas frente a inyección SQL y payloads anómalos.
 * Prisma ya usa consultas parametrizadas; esto añade límites de tamaño y saneo de caracteres peligrosos.
 */

/** Sin literales de control en el fuente (eslint no-control-regex). */
const CTRL = new RegExp('[\\x00-\\x08\\x0b\\x0c\\x0e-\\x1f\\x7f]', 'g');

/** Elimina bytes nulos y caracteres de control ASCII (riesgo en algunos drivers / logs). */
export function stripControlCharacters(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(CTRL, '');
}

/**
 * Heurística ligera: patrones típicos de apilado de sentencias o UNION, no palabras sueltas
 * (evita falsos positivos en textos académicos con palabras como "select" en español).
 */
export function hasLikelySqlInjectionPayload(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  const s = input.toLowerCase();
  if (/--\s|\/\*|\*\//.test(s)) return true;
  if (/;\s*(select|insert|update|delete|drop|alter|truncate|create|exec|execute)\b/.test(s)) return true;
  if (/\bunion\s+all\s+select\b|\bunion\s+select\b/.test(s)) return true;
  return false;
}
