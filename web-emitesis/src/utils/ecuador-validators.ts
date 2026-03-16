/**
 * Validadores oficiales para datos del Estado Ecuatoriano
 * Basado en las normativas del SRI (RUC) y Registro Civil (Cédula)
 */

export const validateEcuadorianId = (id: string): boolean => {
  if (!id || id.length !== 10) return false;
  if (!/^\d+$/.test(id)) return false;

  const province = parseInt(id.substring(0, 2));
  if (province < 1 || province > 24) return false;

  const digits = id.split('').map(Number);
  const checkDigit = digits.pop();
  
  const sum = digits.reduce((acc, curr, index) => {
    let val = (index % 2 === 0) ? curr * 2 : curr;
    if (val > 9) val -= 9;
    return acc + val;
  }, 0);

  const calculatedCheckDigit = (10 - (sum % 10)) % 10;
  return calculatedCheckDigit === checkDigit;
};

export const validateRUC = (ruc: string): boolean => {
  if (!ruc || ruc.length !== 13) return false;
  if (!/^\d+$/.test(ruc)) return false;
  if (ruc.substring(10, 13) !== '001') return false;

  const province = parseInt(ruc.substring(0, 2));
  if (province < 1 || province > 24) return false;

  const thirdDigit = parseInt(ruc.charAt(2));

  // Persona Natural o Jurídica Privada (Módulo 10)
  if (thirdDigit < 6) {
    return validateEcuadorianId(ruc.substring(0, 10));
  }

  // Sociedad Pública (Módulo 11)
  if (thirdDigit === 6) {
    const coefficients = [3, 2, 7, 6, 5, 4, 3, 2];
    const digits = ruc.substring(0, 9).split('').map(Number);
    const checkDigit = parseInt(ruc.charAt(8));
    
    const sum = digits.reduce((acc, curr, index) => acc + (curr * coefficients[index]), 0);
    const remainder = sum % 11;
    const calculatedCheckDigit = remainder === 0 ? 0 : 11 - remainder;
    
    return calculatedCheckDigit === checkDigit;
  }

  // Persona Jurídica Privada (Módulo 11)
  if (thirdDigit === 9) {
    const coefficients = [4, 3, 2, 7, 6, 5, 4, 3, 2];
    const digits = ruc.substring(0, 10).split('').map(Number);
    const checkDigit = parseInt(ruc.charAt(9));
    
    const sum = digits.reduce((acc, curr, index) => acc + (curr * coefficients[index]), 0);
    const remainder = sum % 11;
    const calculatedCheckDigit = remainder === 0 ? 0 : 11 - remainder;
    
    return calculatedCheckDigit === checkDigit;
  }

  return false;
};

export const isInstitutionalEmail = (email: string): boolean => {
  return email.toLowerCase().endsWith('@istpet.edu.ec');
};

export const validateEcuadorianPhone = (phone: string): boolean => {
  // Celular: 09XXXXXXXX (10 dígitos)
  // Convencional: 02XXXXXXX (9 dígitos)
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.startsWith('09')) return cleanPhone.length === 10;
  if (cleanPhone.startsWith('0') && !cleanPhone.startsWith('09')) return cleanPhone.length === 9;
  return false;
};
