import { api } from './auth.service';

export const documentsService = {
  async findByInternship(internshipId: string) {
    return api.get(`/documents/internship/${internshipId}`);
  },

  async updateDates(id: string, startDate: string, dueDate: string, twoFactorCode?: string) {
    return api.patch(`/documents/${id}/dates`, { startDate, dueDate, twoFactorCode }, {
      headers: {
        'x-2fa-code': twoFactorCode || '',
      }
    });
  },

  async downloadTemplate(id: string, fileName: string) {
    const response: any = await api.get(`/documents/${id}/template`, {
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response]));
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.endsWith('.docx') ? fileName : `${fileName}.docx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  async uploadDocument(id: string, file: File, twoFactorCode?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (twoFactorCode) formData.append('twoFactorCode', twoFactorCode);

    return api.patch(`/documents/${id}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'x-2fa-code': twoFactorCode || '',
      },
    });
  },

  async deleteDocumentFile(id: string, twoFactorCode?: string) {
    return api.patch(`/documents/${id}/delete-file`, { twoFactorCode }, {
      headers: {
        'x-2fa-code': twoFactorCode || '',
      },
    });
  },

  async reviewDocument(
    id: string,
    review: { status: string; observations: string; annotations?: unknown },
    twoFactorCode?: string,
  ) {
    return api.patch(`/documents/${id}/review`, { ...review, twoFactorCode }, {
      headers: {
        'x-2fa-code': twoFactorCode || '',
      },
    });
  },

  async coordinatorReviewDocument(
    id: string,
    review: { status: string; observations: string; annotations?: unknown },
    twoFactorCode?: string,
  ) {
    return api.patch(`/documents/${id}/coordinator-review`, { ...review, twoFactorCode }, {
      headers: {
        'x-2fa-code': twoFactorCode || '',
      },
    });
  },

  async getVersions(documentId: string) {
    return api.get(`/documents/${documentId}/versions`);
  },

  async getComments(documentId: string) {
    return api.get(`/documents/${documentId}/comments`);
  },

  async addComment(documentId: string, content: string) {
    return api.post(`/documents/${documentId}/comments`, { content });
  },

  async signDocument(id: string, reason: string, twoFactorCode?: string) {
    return api.patch(`/documents/${id}/sign`, { reason, twoFactorCode }, {
      headers: {
        'x-2fa-code': twoFactorCode || '',
      },
    });
  }
};
