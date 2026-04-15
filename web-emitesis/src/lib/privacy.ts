/**
 * Contacto para ejercicio de derechos (acceso, rectificación, etc.) según LOPDP Ecuador.
 * Opcional: definir NEXT_PUBLIC_DATA_PROTECTION_EMAIL en .env
 */
export function getDataProtectionContactEmail(): string {
  return (
    process.env.NEXT_PUBLIC_DATA_PROTECTION_EMAIL?.trim() ||
    "vinculacion@istpet.edu.ec"
  );
}

export const INSTITUTE_LEGAL_NAME =
  "Instituto Superior Tecnológico “Mayor Pedro Traversari” (ISTPET), Quito, Ecuador";
