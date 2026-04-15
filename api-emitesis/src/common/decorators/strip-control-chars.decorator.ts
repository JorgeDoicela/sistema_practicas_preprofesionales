import { Transform } from 'class-transformer';

const CTRL = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/** Elimina NUL y controles ASCII; no altera el contenido imprimible (apto para contraseñas). */
export function SanitizePasswordField() {
  return Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    return value.replace(CTRL, '');
  });
}

/** Elimina controles, recorta y normaliza correo a minúsculas. */
export function SanitizeEmailField() {
  return Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    return value.replace(CTRL, '').trim().toLowerCase();
  });
}

/** Solo elimina caracteres de control (nombres, direcciones, observaciones). */
export function StripControlChars() {
  return Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    return value.replace(CTRL, '');
  });
}
