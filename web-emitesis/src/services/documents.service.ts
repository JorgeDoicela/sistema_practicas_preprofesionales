import { API_URL } from '@/lib/api-base';

export const documentsService = {
  async findByInternship(internshipId: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/documents/internship/${internshipId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
        throw new Error('Error al obtener los documentos');
    }
    return response.json();
  },

  async updateDates(id: string, startDate: string, dueDate: string, twoFactorCode?: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/documents/${id}/dates`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-2fa-code': twoFactorCode || '',
      },
      body: JSON.stringify({ startDate, dueDate, twoFactorCode }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al actualizar las fechas');
    }
    return response.json();
  },

  async downloadTemplate(id: string, fileName: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/documents/${id}/template`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'No se pudo descargar el formato');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.endsWith('.docx') ? fileName : `${fileName}.docx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  async uploadDocument(id: string, file: File, twoFactorCode?: string) {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    if (twoFactorCode) formData.append('twoFactorCode', twoFactorCode);

    const response = await fetch(`${API_URL}/documents/${id}/upload`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-2fa-code': twoFactorCode || '',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al subir el documento');
    }
    return response.json();
  },

  async deleteDocumentFile(id: string, twoFactorCode?: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/documents/${id}/delete-file`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-2fa-code': twoFactorCode || '',
      },
      body: JSON.stringify({ twoFactorCode }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al eliminar el archivo');
    }
    return response.json();
  },

  async reviewDocument(
    id: string,
    review: { status: string; observations: string; annotations?: unknown },
    twoFactorCode?: string,
  ) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/documents/${id}/review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-2fa-code': twoFactorCode || '',
      },
      body: JSON.stringify({ ...review, twoFactorCode }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al procesar la revisión');
    }
    return response.json();
  },

  async coordinatorReviewDocument(
    id: string,
    review: { status: string; observations: string; annotations?: unknown },
    twoFactorCode?: string,
  ) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/documents/${id}/coordinator-review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-2fa-code': twoFactorCode || '',
      },
      body: JSON.stringify({ ...review, twoFactorCode }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al procesar la revisión del coordinador');
    }
    return response.json();
  },

  async getVersions(documentId: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/documents/${documentId}/versions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
        throw new Error('Error al obtener el historial de versiones');
    }
    return response.json();
  },

  async getComments(documentId: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/documents/${documentId}/comments`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
        throw new Error('Error al obtener los comentarios');
    }
    return response.json();
  },

  async addComment(documentId: string, content: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/documents/${documentId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ content })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al agregar comentario');
    }
    return response.json();
  },

  async signDocument(id: string, reason: string, twoFactorCode?: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/documents/${id}/sign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-2fa-code': twoFactorCode || '',
      },
      body: JSON.stringify({ reason, twoFactorCode }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al firmar electrónicamente');
    }
    return response.json();
  }
};
