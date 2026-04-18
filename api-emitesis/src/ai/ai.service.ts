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
}
