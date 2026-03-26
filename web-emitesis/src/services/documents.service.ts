const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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

  async updateDates(id: string, startDate: string, dueDate: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/documents/${id}/dates`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ startDate, dueDate }),
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

  async uploadDocument(id: string, file: File) {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/documents/${id}/upload`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al subir el documento');
    }
    return response.json();
  },

  async reviewDocument(id: string, review: { status: string, observations: string }) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/documents/${id}/review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(review),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al procesar la revisión');
    }
    return response.json();
  },

  async coordinatorReviewDocument(id: string, review: { status: string, observations: string }) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/documents/${id}/coordinator-review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(review),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al procesar la revisión del coordinador');
    }
    return response.json();
  }
};
