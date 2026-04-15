const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface DocumentTemplate {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  isRequired: boolean;
  isCertificateSlot: boolean;
  blankFileKey: string | null;
  createdAt: string;
  updatedAt: string;
}

async function authHeaders(): Promise<HeadersInit> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const documentTemplatesService = {
  async findAll(includeInactive = false): Promise<DocumentTemplate[]> {
    const q = includeInactive ? "?includeInactive=true" : "";
    const res = await fetch(`${API_URL}/document-templates${q}`, {
      headers: await authHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Error al cargar plantillas");
    }
    return res.json();
  },

  async knownFormatKeys(): Promise<string[]> {
    const res = await fetch(`${API_URL}/document-templates/blank-format-keys`, {
      headers: await authHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.keys ?? [];
  },

  async create(body: Partial<DocumentTemplate>): Promise<DocumentTemplate> {
    const res = await fetch(`${API_URL}/document-templates`, {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        Array.isArray(err.message) ? err.message.join(", ") : err.message || "Error al crear",
      );
    }
    return res.json();
  },

  async update(id: string, body: Partial<DocumentTemplate>): Promise<DocumentTemplate> {
    const res = await fetch(`${API_URL}/document-templates/${id}`, {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        Array.isArray(err.message) ? err.message.join(", ") : err.message || "Error al actualizar",
      );
    }
    return res.json();
  },

  async remove(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/document-templates/${id}`, {
      method: "DELETE",
      headers: await authHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Error al eliminar");
    }
  },
};
