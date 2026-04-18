/**
 * Utilitarios de validación para estándares Ecuatorianos
 */

/**
 * Valida un RUC de Ecuador (13 dígitos)
 * Basado en el algoritmo de Módulo 10 para los primeros 10 dígitos (Cédula) 
 * y verificando que termine en los establecimientos correctos (001, etc).
 */
export function validateEcuadorianRUC(ruc: string): boolean {
  if (!ruc || ruc.length !== 13) return false;
  if (!/^\d+$/.test(ruc)) return false;

  // Los últimos 3 dígitos deben ser 001 (en la mayoría de casos comerciales)
  // Aunque existen otros como 002, para efectos de convenios escolares/empresariales suele ser 001.
  if (!ruc.endsWith('001')) return false;

  const cedula = ruc.substring(0, 10);
  return validateEcuadorianCedula(cedula);
}

/**
 * Valida una Cédula de Identidad de Ecuador (10 dígitos)
 * Algoritmo Módulo 10
 */
export function validateEcuadorianCedula(cedula: string): boolean {
  if (!cedula || cedula.length !== 10) return false;
  if (!/^\d+$/.test(cedula)) return false;

  const provincia = parseInt(cedula.substring(0, 2), 10);
  if (provincia < 0 || (provincia > 24 && provincia !== 30)) return false;

  const digitos = cedula.split('').map(Number);
  const verificador = digitos.pop();
  
  let suma = 0;
  for (let i = 0; i < digitos.length; i++) {
    let valor = digitos[i];
    if (i % 2 === 0) {
      valor *= 2;
      if (valor > 9) valor -= 9;
    }
    suma += valor;
  }

  const residuo = suma % 10;
  const resultado = residuo === 0 ? 0 : 10 - residuo;

  return resultado === verificador;
}
