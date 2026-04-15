"use client";

import { useState, useCallback } from "react";
import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
} from "@simplewebauthn/browser";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export type WebAuthnState =
  | "idle"
  | "checking"
  | "registering"
  | "authenticating"
  | "verified"
  | "error";

export function useWebAuthn() {
  const [state, setState] = useState<WebAuthnState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  /** Verificar si el dispositivo soporta WebAuthn con autenticador de plataforma */
  const checkSupport = useCallback(async (): Promise<boolean> => {
    if (!browserSupportsWebAuthn()) {
      setIsSupported(false);
      return false;
    }
    const available = await platformAuthenticatorIsAvailable();
    setIsSupported(available);
    return available;
  }, []);

  /** Verificar si el usuario ya tiene huella registrada */
  const checkCredentialStatus = useCallback(async (): Promise<boolean> => {
    const res = await fetch(`${API_URL}/webauthn/credential-status`, {
      headers: getHeaders(),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.registered as boolean;
  }, []);

  /** RF-14: Registrar huella dactilar por primera vez */
  const registerBiometric = useCallback(async (): Promise<boolean> => {
    setState("registering");
    setError(null);
    try {
      // Paso 1: Obtener opciones del servidor
      const optionsRes = await fetch(`${API_URL}/webauthn/registration-options`, {
        headers: getHeaders(),
      });
      if (!optionsRes.ok) throw new Error("Error al obtener opciones de registro");
      const options = await optionsRes.json();

      // Paso 2: Crear credencial en el dispositivo (activa sensor biométrico)
      const credential = await startRegistration({ optionsJSON: options });

      // Paso 3: Verificar y guardar en el servidor
      const verifyRes = await fetch(`${API_URL}/webauthn/verify-registration`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(credential),
      });
      if (!verifyRes.ok) {
        const err = await verifyRes.json();
        throw new Error(err.message || "Verificación fallida");
      }

      setState("verified");
      return true;
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message.includes("NotAllowedError") || err.message.includes("not allowed")
            ? "Debes permitir el uso de biometría. Intenta nuevamente."
            : err.message
          : "Error al registrar huella";
      setError(msg);
      setState("error");
      return false;
    }
  }, []);

  /** RF-14: Autenticar con huella antes del check-in/out */
  const authenticate = useCallback(async (): Promise<boolean> => {
    setState("authenticating");
    setError(null);
    try {
      // Paso 1: Obtener challenge del servidor
      const optionsRes = await fetch(`${API_URL}/webauthn/authentication-options`, {
        headers: getHeaders(),
      });
      if (!optionsRes.ok) {
        const err = await optionsRes.json();
        throw new Error(err.message || "Error al obtener opciones de autenticación");
      }
      const options = await optionsRes.json();

      // Paso 2: Verificar huella en el dispositivo
      const assertion = await startAuthentication({ optionsJSON: options });

      // Paso 3: Verificar assertion en el servidor
      const verifyRes = await fetch(`${API_URL}/webauthn/verify-authentication`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(assertion),
      });
      if (!verifyRes.ok) {
        const err = await verifyRes.json();
        throw new Error(err.message || "Verificación biométrica fallida");
      }

      setState("verified");
      return true;
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message.includes("NotAllowedError") || err.message.includes("not allowed")
            ? "Verificación biométrica cancelada o no permitida."
            : err.message
          : "Error en la autenticación biométrica";
      setError(msg);
      setState("error");
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setError(null);
  }, []);

  return {
    state,
    error,
    isSupported,
    checkSupport,
    checkCredentialStatus,
    registerBiometric,
    authenticate,
    reset,
  };
}
