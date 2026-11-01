import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://gestioneducativa.gehma.vip/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const institutionId = localStorage.getItem('currentInstitutionId');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (institutionId) {
    config.headers['x-institution-id'] = institutionId;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

