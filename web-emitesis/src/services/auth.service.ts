const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const authService = {
  async login(email: string, password: string, recaptchaToken: string) {
    console.log('Iniciando login para:', email);
    console.log('Recaptcha Token presente:', !!recaptchaToken);

    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, recaptchaToken }),
    });

    const data = await response.json();
    console.log('Respuesta de login:', response.status, data);

    if (!response.ok) {
      throw new Error(data.message || 'Error al iniciar sesión');
    }

    return data;
  },

  async registerCompany(formData: any, recaptchaToken: string) {
    console.log('Registrando empresa...', formData.companyName);
    console.log('URL de API:', `${API_URL}/auth/register-company`);

    const response = await fetch(`${API_URL}/auth/register-company`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...formData, recaptchaToken }),
    });

    const data = await response.json();
    console.log('Respuesta de registro:', response.status, data);

    if (!response.ok) {
      throw new Error(data.message || 'Error al registrar la empresa');
    }

    return data;
  }
};
