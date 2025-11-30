import axios from 'axios';
import { 
  SaveCertificateRequest, 
  SaveCertificateResponse,
  RetrieveCertificateRequest,
  RetrieveCertificateResponse,
  ErrorResponse 
} from '../types/certificate.types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data) {
      throw error.response.data as ErrorResponse;
    }
    throw {
      success: false,
      error: error.message || 'Network error',
      code: 'NETWORK_ERROR'
    } as ErrorResponse;
  }
);


export const certificateAPI = {
  // Crear certificado
  async create(certificate: SaveCertificateRequest['certificate']): Promise<SaveCertificateResponse> {
    const { data } = await api.post<SaveCertificateResponse>('/certificates', {
      certificate
    });
    return data;
  },

  

  // Recuperar certificado
  async retrieve(request: RetrieveCertificateRequest): Promise<RetrieveCertificateResponse> {
    const { data } = await api.post<RetrieveCertificateResponse>('/certificates/retrieve', request);
    return data;
  },

  // Listar certificados (para desarrollo)
  async list(): Promise<any> {
    const { data } = await api.get('/certificates');
    return data;
  }
};
