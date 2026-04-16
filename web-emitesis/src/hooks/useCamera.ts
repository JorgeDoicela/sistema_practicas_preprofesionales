"use client";

import { useState, useRef, useCallback } from "react";

export type CameraState = "idle" | "opening" | "active" | "captured" | "error";

export interface CameraOptions {
  facingMode?: "user" | "environment";
  /** Aplica espejo horizontal al video (útil para cámara frontal) — default true si facingMode=user */
  mirror?: boolean;
}

export function useCamera() {
  const [state, setState] = useState<CameraState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isMirrored, setIsMirrored] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCurrentStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  /** Abrir cámara. Si ya hay un stream activo lo cierra antes de abrir el nuevo. */
  const openCamera = useCallback(
    async (videoElement: HTMLVideoElement, opts?: CameraOptions) => {
      // Cerrar stream previo si existe
      stopCurrentStream();

      setState("opening");
      setError(null);

      const facing = opts?.facingMode ?? "user";
      const mirror = opts?.mirror ?? facing === "user";
      setIsMirrored(mirror);

      const tryOpen = async (constraints: MediaStreamConstraints): Promise<MediaStream> => {
        return navigator.mediaDevices.getUserMedia(constraints);
      };

      let stream: MediaStream;
      try {
        // Intento 1: resolución ideal + facing deseado
        stream = await tryOpen({
          video: { facingMode: facing, width: { ideal: 720 }, height: { ideal: 540 } },
          audio: false,
        });
      } catch (firstErr: unknown) {
        const name = firstErr instanceof Error ? (firstErr as DOMException).name : "";
        if (name === "OverconstrainedError" || name === "ConstraintNotSatisfiedError") {
          // Dispositivo no soporta el facing o la resolución → reintento sin constraints
          try {
            stream = await tryOpen({ video: true, audio: false });
          } catch {
            throw firstErr;
          }
        } else {
          throw firstErr;
        }
      }

      try {
        videoRef.current = videoElement;
        streamRef.current = stream;
        videoElement.srcObject = stream;
        await videoElement.play().catch(() => undefined);

        // Esperar dimensiones reales del video (evita capturas en negro)
        await new Promise<void>((resolve, reject) => {
          if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
            resolve();
            return;
          }
          const timeout = window.setTimeout(() => {
            videoElement.removeEventListener("loadeddata", onData);
            reject(new Error("La cámara tardó demasiado en iniciar. Recarga la página e intenta de nuevo."));
          }, 14_000);
          const onData = () => {
            if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
              clearTimeout(timeout);
              videoElement.removeEventListener("loadeddata", onData);
              resolve();
            }
          };
          videoElement.addEventListener("loadeddata", onData);
          onData(); // por si ya disparó antes de añadir el listener
        });

        setState("active");
      } catch (e: unknown) {
        stopCurrentStream();
        throw e;
      }
    },
    [stopCurrentStream],
  );

  const wrapError = (err: unknown): string => {
    if (!(err instanceof Error)) return "Error al abrir la cámara";
    const n = (err as DOMException).name || "";
    const m = err.message || "";
    if (n === "NotAllowedError" || m.includes("Permission denied") || m.includes("NotAllowedError"))
      return "Debes permitir el acceso a la cámara en el navegador.";
    if (n === "NotFoundError" || m.includes("NotFoundError"))
      return "No se encontró cámara en este dispositivo.";
    if (n === "NotReadableError" || m.includes("NotReadableError"))
      return "La cámara está en uso por otra aplicación.";
    if (n === "OverconstrainedError" || n === "ConstraintNotSatisfiedError")
      return "La cámara no admite la configuración solicitada.";
    if (m.includes("tardó demasiado")) return m;
    return "Error al abrir la cámara: " + m;
  };

  /** Abrir cámara con manejo de error en estado */
  const openCameraSafe = useCallback(
    async (videoElement: HTMLVideoElement, opts?: CameraOptions) => {
      try {
        await openCamera(videoElement, opts);
      } catch (err: unknown) {
        setError(wrapError(err));
        setState("error");
      }
    },
    [openCamera],
  );

  /** Captura la foto como JPEG (respeta el espejo si aplica). */
  const captureAsync = useCallback((): Promise<Blob | null> => {
    return new Promise<Blob | null>((resolve) => {
      const video = videoRef.current;
      if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
        resolve(null);
        return;
      }

      const W = video.videoWidth;
      const H = video.videoHeight;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(null); return; }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Aplicar espejo horizontal al capturar si corresponde
      if (isMirrored) {
        ctx.translate(W, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, W, H);

      stopCurrentStream();

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            setCapturedBlob(blob);
            setPreviewUrl(url);
            setState("captured");
          }
          resolve(blob);
        },
        "image/jpeg",
        0.88,
      );
    });
  }, [isMirrored, stopCurrentStream]);

  /** Detener el stream de la cámara */
  const stopCamera = useCallback(() => {
    stopCurrentStream();
  }, [stopCurrentStream]);

  /** Resetear todo para tomar otra foto */
  const reset = useCallback(() => {
    stopCurrentStream();
    setCapturedBlob((prev) => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      return null;
    });
    setPreviewUrl(null);
    setState("idle");
    setError(null);
    setIsMirrored(false);
  }, [stopCurrentStream, previewUrl]);

  return {
    state,
    error,
    capturedBlob,
    previewUrl,
    isMirrored,
    videoRef,
    openCamera: openCameraSafe,
    captureAsync,
    stopCamera,
    reset,
  };
}
