import { api } from './auth.service';

export const aiService = {
  /** Verificar si el servicio de IA está disponible */
  async isAvailable(): Promise<boolean> {
    try {
      const data = await api.get('/ai/status');
      return data.available === true;
    } catch {
      return false;
    }
  },

  /**
   * RF-18: Enviar imagen (Blob) al backend y obtener descripción sugerida por IA.
   */
  async suggestDescription(imageBlob: Blob): Promise<string> {
    // Convertir Blob a base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageBlob);
    });

    const data = await api.post<{ description: string }>('/ai/suggest-description', {
      base64Image: base64,
      mimeType: imageBlob.type || 'image/jpeg',
    });

    return data?.description || 'No se pudo generar una descripción.';
  },

  /**
   * RF-AI-01: Enviar consulta al asistente contextual de prácticas.
   */
  async askQuestion(question: string, context?: string): Promise<string> {
    const data = await api.post<{ answer: string }>('/ai/ask', { 
      question, 
      ...(context && { context }),
    });
    return data?.answer || 'No se pudo obtener una respuesta.';
  },

  /**
   * RF-AI-01: Pre-verificación de documentos (Escaneo inicial por IA).
   * @param systemHours - Horas esperadas según la práctica del estudiante (para validación cruzada)
   * @param studentName - Nombre del estudiante para verificar si aparece en el documento
   */
  async preVerifyDocument(
    documentName: string,
    base64Image: string,
    systemHours?: number,
    studentName?: string,
  ): Promise<{ isValid: boolean; feedback: string; hoursFound?: number }> {
    const data = await api.post<{ isValid: boolean; feedback: string; hoursFound?: number }>('/ai/pre-verify', {
      documentName,
      base64Image,
      ...(systemHours !== undefined && { systemHours }),
      ...(studentName && { studentName }),
    });
    return {
      isValid: data?.isValid ?? true,
      feedback: data?.feedback || 'IA no disponible para pre-verificación en este momento.',
      hoursFound: data?.hoursFound,
    };
  },

  /**
   * RF-AI-02: Consultar análisis predictivo de riesgo.
   */
  async getRiskAssessment(indicators: {
    healthScore: number;
    docsApproved: number;
    docsTotal: number;
    hoursDone: number;
    hoursTotal: number;
    daysActive: number;
  }): Promise<string> {
    const data = await api.post<{ analysis: string }>('/ai/risk-assessment', indicators);
    return data?.analysis || 'Análisis predictivo no disponible en este momento.';
  },
};
