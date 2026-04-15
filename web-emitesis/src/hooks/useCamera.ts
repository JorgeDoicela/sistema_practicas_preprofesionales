"use client";

import { useState, useRef, useCallback } from "react";

export type CameraState = "idle" | "opening" | "active" | "captured" | "error";

export function useCamera() {
  const [state, setState] = useState<CameraState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /** Abrir la cámara */
  const openCamera = useCallback(async (videoElement: HTMLVideoElement) => {
    setState("opening");
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      videoRef.current = videoElement;
      streamRef.current = stream;
      videoElement.srcObject = stream;
      await videoElement.play();
      setState("active");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message.includes("Permission denied") || err.message.includes("NotAllowedError")
            ? "Debes permitir el acceso a la cámara."
            : err.message.includes("NotFoundError")
            ? "No se encontró cámara en este dispositivo."
            : "Error al abrir la cámara"
          : "Error al abrir la cámara";
      setError(msg);
      setState("error");
    }
  }, []);

  /** Capturar foto del video */
  const capture = useCallback((): Blob | null => {
    const video = videoRef.current;
    if (!video || state !== "active") return null;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convertir a Blob
    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            setCapturedBlob(blob);
            setPreviewUrl(url);
            setState("captured");
            stopCamera();
            resolve(blob);
          } else {
            resolve(null);
          }
        },
        "image/jpeg",
        0.85
      );
    }) as unknown as Blob | null;
  }, [state]);

  /** Captura sincrónica que devuelve Promise<Blob> */
  const captureAsync = useCallback((): Promise<Blob | null> => {
    return new Promise<Blob | null>((resolve) => {
      const video = videoRef.current;
      if (!video) { resolve(null); return; }

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(null); return; }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            setCapturedBlob(blob);
            setPreviewUrl(url);
            setState("captured");
            stopCamera();
          }
          resolve(blob);
        },
        "image/jpeg",
        0.85
      );
    });
  }, []);

  /** Parar el stream de la cámara */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  /** Resetear para tomar otra foto */
  const reset = useCallback(() => {
    stopCamera();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setCapturedBlob(null);
    setPreviewUrl(null);
    setState("idle");
    setError(null);
  }, [previewUrl, stopCamera]);

  return {
    state,
    error,
    capturedBlob,
    previewUrl,
    videoRef,
    openCamera,
    capture,
    captureAsync,
    stopCamera,
    reset,
  };
}
