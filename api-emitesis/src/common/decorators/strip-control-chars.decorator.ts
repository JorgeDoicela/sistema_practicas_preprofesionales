import { Transform } from 'class-transformer';

// eslint-disable-next-line no-control-regex
const CTRL = new RegExp('[\\x00-\\x08\\x0b\\x0c\\x0e-\\x1f\\x7f]', 'g');

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
