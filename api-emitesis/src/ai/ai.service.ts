import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey && apiKey !== 'sk-placeholder' && apiKey.startsWith('sk-')) {
      this.openai = new OpenAI({ apiKey });
    } else {
      this.logger.warn('RF-18: OPENAI_API_KEY no configurada. Las sugerencias de IA no estarán disponibles.');
    }
  }

  get isAvailable(): boolean {
    return this.openai !== null;
  }

  /**
   * RF-18: Analizar imagen de actividad y generar descripción automática.
   * @param base64Image - Imagen en base64 (sin prefijo data:image/...)
   * @param mimeType  - Tipo MIME de la imagen (image/jpeg, image/png, etc.)
   */
  async suggestActivityDescription(base64Image: string, mimeType = 'image/jpeg'): Promise<string> {
    if (!this.openai) {
      throw new ServiceUnavailableException(
        'El servicio de IA no está disponible. Configura OPENAI_API_KEY en el servidor.',
      );
    }

    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 150,
      messages: [
        {
          role: 'system',
          content:
            'Eres un asistente que ayuda a estudiantes de prácticas preprofesionales a describir sus actividades diarias. ' +
            'Analiza la imagen proporcionada y genera una descripción breve y profesional (máximo 2 oraciones) de la actividad o tarea que se observa en la imagen. ' +
            'Responde SOLO con la descripción, sin introducciones ni explicaciones adicionales. ' +
            'Responde siempre en español.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: dataUrl, detail: 'low' },
            },
            {
              type: 'text',
              text: 'Describe brevemente la actividad que se muestra en esta imagen de prácticas preprofesionales.',
            },
          ],
        },
      ],
    });

    const suggestion = response.choices[0]?.message?.content?.trim();
    if (!suggestion) throw new Error('El modelo no generó una descripción');
    return suggestion;
  }

  /**
   * RF-AI-01: Responder preguntas de estudiantes con contexto del sistema.
   * @param context - Contexto del usuario (nombre, horas pendientes, docs rechazados, etc.)
   * @param question - Pregunta del estudiante
   */
  async askQuestion(context: string, question: string): Promise<string> {
    if (!this.openai) {
      throw new ServiceUnavailableException(
        'El servicio de IA no está disponible. Configura OPENAI_API_KEY en el servidor.',
      );
    }

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 400,
      messages: [
        {
          role: 'system',
          content:
            'Eres Antigravity, el asistente experto del programa de prácticas preprofesionales ISTPET. ' +
            'Tu objetivo es guiar a los estudiantes en sus trámites, marcados y evaluaciones. ' +
            'Usa un tono profesional, alentador y conciso. ' +
            'Contexto del estudiante: ' + context + '\n\n' +
            'Si el estudiante pregunta algo fuera del alcance de las prácticas, dile amablemente que solo puedes ayudar con temas del sistema Emitesis. ' +
            'Responde siempre en español.',
        },
        {
          role: 'user',
          content: question,
        },
      ],
    });

    return response.choices[0]?.message?.content?.trim() || 'No pude procesar tu consulta en este momento.';
  }
  /**
   * RF-AI-01: Pre-verificación de documentos PDF.
   * Analiza la primera página del documento para asegurar que tiene el formato correcto y datos básicos.
   * @param documentName - Nombre del documento (ej. "Informe de Actividades")
   * @param base64Image - Imagen de la primera página del PDF
   */
  async preVerifyDocument(documentName: string, base64Image: string): Promise<{ isValid: boolean; feedback: string }> {
    if (!this.openai) {
      return { isValid: true, feedback: 'IA no disponible para pre-verificación.' };
    }

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 200,
      messages: [
        {
          role: 'system',
          content:
            'Eres un experto en control de calidad documental para el programa de prácticas ISTPET. ' +
            'Tu tarea es realizar una pre-revisión visual de la primera página de un documento subido por un estudiante. ' +
            'Debes verificar: 1. El título coincide con lo solicitado. 2. Existen campos de firmas o logotipos institucionales. 3. No es una hoja en blanco o con texto irrelevante. ' +
            'Responde en formato JSON: {"isValid": boolean, "feedback": "string corto con observaciones en español"}.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64Image}`, detail: 'low' },
            },
            {
              type: 'text',
              text: `Este documento debe ser un "${documentName}". ¿Parece correcto y completo para ser revisado por un tutor?`,
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return { isValid: true, feedback: 'Error en la respuesta de IA.' };
    
    return JSON.parse(content as string);
  }
}
