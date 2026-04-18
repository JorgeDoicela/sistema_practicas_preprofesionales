import { API_URL } from '@/lib/api-base';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
});

export const aiService = {
  /** Verificar si el servicio de IA está disponible */
  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${API_URL}/ai/status`, {
        headers: authHeaders(),
      });
      if (!res.ok) return false;
      const data = await res.json();
      return data.available === true;
    } catch {
      return false;
    }
  },

  /**
   * RF-18: Enviar imagen (Blob) al backend y obtener descripción sugerida por IA.
   * Convierte el Blob a base64 antes de enviarlo.
   */
  async suggestDescription(imageBlob: Blob): Promise<string> {
    // Convertir Blob a base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Extraer solo la parte base64 (sin el prefijo data:image/jpeg;base64,)
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageBlob);
    });

    const res = await fetch(`${API_URL}/ai/suggest-description`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        base64Image: base64,
        mimeType: imageBlob.type || 'image/jpeg',
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al obtener sugerencia de IA');
    }

    const data = await res.json();
    return data.description as string;
  },

  /**
   * RF-AI-01: Enviar consulta al asistente contextual de prácticas.
   */
  async askQuestion(question: string, context: string): Promise<string> {
    const res = await fetch(`${API_URL}/ai/ask`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ question, context }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Error al conectar con el asistente");
    }

    const data = await res.json();
    return data.answer as string;
  },

  /**
   * RF-AI-01: Pre-verificación de documentos (Escaneo inicial por IA).
   */
  async preVerifyDocument(documentName: string, base64Image: string): Promise<{ isValid: boolean; feedback: string }> {
    const res = await fetch(`${API_URL}/ai/pre-verify`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ documentName, base64Image }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Error en la pre-verificación por IA");
    }

    const data = await res.json();
    return data as { isValid: boolean; feedback: string };
  },
};
