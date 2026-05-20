/**
 * Utilitarios de validación para estándares Ecuatorianos
 */

/**
 * Valida una Cédula de Identidad de Ecuador (10 dígitos)
 * Algoritmo Módulo 10
 */
export function validateEcuadorianCedula(cedula: string): boolean {
  if (!cedula || cedula.length !== 10) return false;
  if (!/^\d+$/.test(cedula)) return false;

  const provincia = parseInt(cedula.substring(0, 2), 10);
  if (provincia < 1 || (provincia > 24 && provincia !== 30)) return false;

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

/**
 * Valida un RUC de Ecuador (13 dígitos)
 * Basado en las normativas del SRI:
 * - Tercer dígito < 6: Persona Natural (Módulo 10)
 * - Tercer dígito = 6: Sociedad Pública (Módulo 11)
 * - Tercer dígito = 9: Persona Jurídica / Sociedad Privada (Módulo 11)
 */
export function validateEcuadorianRUC(ruc: string): boolean {
  if (!ruc || ruc.length !== 13) return false;
  if (!/^\d+$/.test(ruc)) return false;

  // Los últimos 3 dígitos deben ser 001 para convenios institucionales
  if (!ruc.endsWith('001')) return false;

  const provincia = parseInt(ruc.substring(0, 2), 10);
  if (provincia < 1 || (provincia > 24 && provincia !== 30)) return false;

  const thirdDigit = parseInt(ruc.charAt(2), 10);

  // Persona Natural o Jurídica Privada (Módulo 10)
  if (thirdDigit < 6) {
    return validateEcuadorianCedula(ruc.substring(0, 10));
  }

  // Sociedad Pública (Módulo 11)
  if (thirdDigit === 6) {
    const coefficients = [3, 2, 7, 6, 5, 4, 3, 2];
    const digits = ruc.substring(0, 9).split('').map(Number);
    const checkDigit = parseInt(ruc.charAt(8), 10);
    
    const sum = digits.reduce((acc, curr, index) => acc + (curr * coefficients[index]), 0);
    const remainder = sum % 11;
    const calculatedCheckDigit = remainder === 0 ? 0 : 11 - remainder;
    
    return calculatedCheckDigit === checkDigit;
  }

  // Persona Jurídica Privada / Sociedades Privadas (Módulo 11)
  if (thirdDigit === 9) {
    const coefficients = [4, 3, 2, 7, 6, 5, 4, 3, 2];
    const digits = ruc.substring(0, 10).split('').map(Number);
    const checkDigit = parseInt(ruc.charAt(9), 10);
    
    const sum = digits.reduce((acc, curr, index) => acc + (curr * coefficients[index]), 0);
    const remainder = sum % 11;
    const calculatedCheckDigit = remainder === 0 ? 0 : 11 - remainder;
    
    return calculatedCheckDigit === checkDigit;
  }

  return false;
}

