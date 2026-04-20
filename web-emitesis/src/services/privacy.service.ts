import { api } from './auth.service';

export const privacyService = {
  async recordConsent(accepted: boolean, version: string) {
    return api.post('/privacy/consent', { accepted, version });
  },

  async requestArcoRights(type: 'ACCESO' | 'RECTIFICACION' | 'CANCELACION' | 'OPOSICION', details?: string) {
    return api.post('/privacy/arco-request', { type, details });
  },

  async getMyDataSummary() {
    return api.get('/privacy/my-data');
  },

  async getMyRequests() {
    return api.get('/privacy/my-requests');
  },

  // ── Métodos de Administración (LOPDP) ──────────────────────────────────────

  async findAllAdmin() {
    return api.get('/privacy/admin/requests');
  },

  async respondAdmin(requestId: string, responseText: string, status: string) {
    return api.patch(`/privacy/admin/requests/${requestId}/respond`, { 
      response: responseText, 
      status 
    });
  }
};
