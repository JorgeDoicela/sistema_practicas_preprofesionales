"use client";

import { useState, useCallback, useRef } from "react";
import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
} from "@simplewebauthn/browser";
import { API_URL } from "@/lib/api-base";

// ── Helpers ───────────────────────────────────────────────────────────────

async function parseJsonBody<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text.trim()) return null;
  try { return JSON.parse(text) as T; } catch { return null; }
}

function buildHeaders(): Record<string, string> {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function mapWebAuthnError(err: unknown): string {
  if (!(err instanceof Error)) return "Error en la verificación biométrica";
  const name = (err as DOMException).name ?? "";
  const msg  = err.message ?? "";

  if (name === "NotAllowedError"  || msg.includes("NotAllowedError") || msg.toLowerCase().includes("not allowed"))
    return "Operación cancelada o denegada. Acepta el uso del sensor biométrico cuando el dispositivo lo solicite.";
  if (name === "InvalidStateError" || msg.includes("InvalidStateError"))
    return "Ya existe un registro para este dispositivo. Cierra otras pestañas del sitio e intenta de nuevo.";
  if (name === "NotSupportedError" || msg.includes("NotSupportedError"))
    return "Tu dispositivo o navegador no admite biometría WebAuthn. Prueba con Chrome o Edge actualizado.";
  if (name === "SecurityError"    || msg.includes("SecurityError"))
    return "Se requiere conexión HTTPS (o localhost) para usar la biometría.";
  if (name === "AbortError"       || msg.includes("AbortError"))
    return "La verificación se interrumpió. Vuelve a intentarlo.";
  if (name === "NetworkError"     || msg.toLowerCase().includes("network"))
    return "Error de red. Revisa tu conexión e intenta de nuevo.";
  if (name === "UnknownError")
    return "Error interno del autenticador. Reinicia el dispositivo e intenta de nuevo.";
  return msg || "Error en la verificación biométrica";
}

// ── Tipos ─────────────────────────────────────────────────────────────────

export type WebAuthnState =
  | "idle"
  | "checking"      // comprobando soporte / credencial
  | "registering"   // registro (primera vez)
  | "authenticating"// verificando huella
  | "verified"      // ok
  | "error";

// ── Hook ──────────────────────────────────────────────────────────────────

export function useWebAuthn() {
  const [state, setState] = useState<WebAuthnState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const newAbort = () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    return ac.signal;
  };

  /** Verifica si el dispositivo soporta WebAuthn con autenticador de plataforma */
  const checkSupport = useCallback(async (): Promise<boolean> => {
    setState("checking");
    if (!browserSupportsWebAuthn()) {
      setIsSupported(false);
      setState("idle");
      return false;
    }
    const ok = await platformAuthenticatorIsAvailable();
    setIsSupported(ok);
    setState("idle");
    return ok;
  }, []);

  /** Verifica si el usuario ya tiene credencial registrada en el servidor */
  const checkCredentialStatus = useCallback(async (): Promise<boolean> => {
    setState("checking");
    try {
      const res = await fetch(`${API_URL}/webauthn/credential-status`, {
        headers: buildHeaders(),
        signal: newAbort(),
      });
      if (!res.ok) { setState("idle"); return false; }
      const data = await parseJsonBody<{ registered?: boolean }>(res);
      setState("idle");
      return Boolean(data?.registered);
    } catch {
      setState("idle");
      return false;
    }
  }, []);

  /** RF-14: Registrar huella dactilar por primera vez */
  const registerBiometric = useCallback(async (): Promise<boolean> => {
    setState("registering");
    setError(null);
    const signal = newAbort();
    try {
      const optRes = await fetch(`${API_URL}/webauthn/registration-options`, {
        headers: buildHeaders(), signal,
      });
      if (!optRes.ok) {
        const e = await parseJsonBody<{ message?: string }>(optRes);
        throw new Error(e?.message || "Error al obtener opciones de registro");
      }
      const opts = await parseJsonBody(optRes);
      if (!opts) throw new Error("Respuesta inválida del servidor");

      const credential = await startRegistration({
        optionsJSON: opts as Parameters<typeof startRegistration>[0]["optionsJSON"],
      });

      const verRes = await fetch(`${API_URL}/webauthn/verify-registration`, {
        method: "POST", headers: buildHeaders(), signal,
        body: JSON.stringify(credential),
      });
      if (!verRes.ok) {
        const e = await parseJsonBody<{ message?: string }>(verRes);
        throw new Error(e?.message || "Verificación de registro fallida");
      }

      setState("verified");
      return true;
    } catch (err: unknown) {
      if ((err as DOMException).name === "AbortError") {
        setState("idle");
        return false;
      }
      setError(mapWebAuthnError(err));
      setState("error");
      return false;
    }
  }, []);

  /** RF-14: Autenticar con huella existente */
  const authenticate = useCallback(async (): Promise<boolean> => {
    setState("authenticating");
    setError(null);
    const signal = newAbort();
    try {
      const optRes = await fetch(`${API_URL}/webauthn/authentication-options`, {
        headers: buildHeaders(), signal,
      });
      if (!optRes.ok) {
        const e = await parseJsonBody<{ message?: string }>(optRes);
        throw new Error(e?.message || "Error al obtener opciones de autenticación");
      }
      const opts = await parseJsonBody(optRes);
      if (!opts) throw new Error("Respuesta inválida del servidor");

      const assertion = await startAuthentication({
        optionsJSON: opts as Parameters<typeof startAuthentication>[0]["optionsJSON"],
      });

      const verRes = await fetch(`${API_URL}/webauthn/verify-authentication`, {
        method: "POST", headers: buildHeaders(), signal,
        body: JSON.stringify(assertion),
      });
      if (!verRes.ok) {
        const e = await parseJsonBody<{ message?: string }>(verRes);
        throw new Error(e?.message || "Verificación biométrica fallida");
      }

      setState("verified");
      return true;
    } catch (err: unknown) {
      if ((err as DOMException).name === "AbortError") {
        setState("idle");
        return false;
      }
      setError(mapWebAuthnError(err));
      setState("error");
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState("idle");
    setError(null);
  }, []);

  return {
    state,
    error,
    isSupported,
    /** true mientras comprueba soporte o credencial */
    isChecking: state === "checking",
    checkSupport,
    checkCredentialStatus,
    registerBiometric,
    authenticate,
    reset,
  };
}
