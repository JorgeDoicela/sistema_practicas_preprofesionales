"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PrivacyConsentOverlay } from "./PrivacyConsentOverlay";

export const PrivacyConsentWrapper = ({ children }: { children: React.ReactNode }) => {
  const [isLopdpOverlayOpen, setIsLopdpOverlayOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkConsent = () => {
      // No pedir consentimiento en páginas públicas o de login/reset
      const publicPaths = ["/", "/login", "/privacidad", "/nosotros", "/servicios", "/olvido-password", "/reset-password"];
      if (publicPaths.includes(pathname)) return;

      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        // Si el usuario ya está logueado pero no ha aceptado LOPDP, mostrar overlay
        if (!user.lopdpAccepted) {
            setIsLopdpOverlayOpen(true);
        }
      }
    };

    // Pequeño delay para asegurar que el localStorage esté disponible en hidratación
    const timer = setTimeout(checkConsent, 500);
    return () => clearTimeout(timer);
  }, [pathname]);

  const handleConsentAccepted = () => {
    setIsLopdpOverlayOpen(false);
  };

  return (
    <>
      <PrivacyConsentOverlay 
        isOpen={isLopdpOverlayOpen} 
        onConsentAccepted={handleConsentAccepted} 
      />
      {children}
    </>
  );
};
