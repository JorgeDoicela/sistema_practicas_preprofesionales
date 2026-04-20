import { api } from './auth.service';

export interface DocumentTemplate {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  isRequired: boolean;
  isCertificateSlot: boolean;
  blankFileKey: string | null;
  careerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export const documentTemplatesService = {
  async findAll(includeInactive = false): Promise<DocumentTemplate[]> {
    const q = includeInactive ? "?includeInactive=true" : "";
    return api.get(`/document-templates${q}`);
  },

  async knownFormatKeys(): Promise<string[]> {
    const meta = await this.blankFormatsMeta();
    return meta.keys || [];
  },

  /** Lista de .docx disponibles y cuáles son institucionales (no eliminables). */
  async blankFormatsMeta(): Promise<{ keys: string[]; protectedKeys: string[] }> {
    return api.get('/document-templates/blank-format-keys');
  },

  /** Quita un .docx subido por el coordinador del almacén (no los institucionales). */
  async deleteBlankDocx(key: string): Promise<void> {
    const q = new URLSearchParams({ key });
    return api.delete(`/document-templates/blank-template?${q.toString()}`);
  },

  /** Sube un .docx a la carpeta de formatos; devuelve la clave (nombre de archivo) para asignarla a una plantilla. */
  async uploadBlankDocx(file: File): Promise<{ key: string }> {
    const fd = new FormData();
    fd.append("file", file);
    return api.post('/document-templates/upload-blank', fd);
  },

  async create(body: Partial<DocumentTemplate>): Promise<DocumentTemplate> {
    return api.post('/document-templates', body);
  },

  async update(id: string, body: Partial<DocumentTemplate>): Promise<DocumentTemplate> {
    return api.patch(`/document-templates/${id}`, body);
  },

  async remove(id: string): Promise<void> {
    return api.delete(`/document-templates/${id}`);
  },
};
