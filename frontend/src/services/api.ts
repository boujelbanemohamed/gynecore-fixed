import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api'
const api = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      const isPatientPortal = window.location.pathname.startsWith('/patient');
      window.location.href = isPatientPortal ? '/patient/login' : '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  loginDoctor: (email: string, password: string) => api.post('/auth/login', { email, password }),
  loginPatient: (email: string, password: string) => api.post('/auth/patient/login', { email, password }),
  getMe: () => api.get('/auth/me'),
};

export const doctorAPI = {
  getDashboard: () => api.get('/doctor/dashboard'),
  getPatients: (params?: Record<string, unknown>) => api.get('/doctor/patients', { params }),
  getPatient: (id: string) => api.get(`/doctor/patients/${id}`),
  createPatient: (data: unknown) => api.post('/doctor/patients', data),
  updatePatient: (id: string, data: unknown) => api.put(`/doctor/patients/${id}`, data),
  getConsultations: (params?: Record<string, unknown>) => api.get('/doctor/consultations', { params }),
  createConsultation: (data: unknown) => api.post('/doctor/consultations', data),
  updateConsultation: (id: string, data: unknown) => api.put(`/doctor/consultations/${id}`, data),
  getPrescriptions: (params?: Record<string, unknown>) => api.get('/doctor/prescriptions', { params }),
  getPrescriptionById: (id: string) => api.get(`/doctor/prescriptions/${id}`),
  createPrescription: (data: unknown) => api.post('/doctor/prescriptions', data),
  updatePrescription: (id: string, data: unknown) => api.put(`/doctor/prescriptions/${id}`, data),
  getAppointments: (params?: Record<string, unknown>) => api.get('/doctor/appointments', { params }),
  createAppointment: (data: unknown) => api.post('/doctor/appointments', data),
  updateAppointmentStatus: (id: string, status: string) => api.patch(`/doctor/appointments/${id}/status`, { status }),
  uploadDocument: (file: File, patientId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patientId', patientId);
    return api.post('/doctor/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  getPatientDocuments: (patientId: string) => api.get(`/doctor/documents/${patientId}`),
  deleteDocument: (documentId: string) => api.delete(`/doctor/documents/${documentId}`),
  getProfile: () => api.get('/doctor/profile'),
  updateProfile: (data: Record<string, unknown>) => api.put('/doctor/profile', data),
  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/doctor/profile/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export const patientAPI = {
  getDossier: () => api.get('/patient/dossier'),
  getConsultations: () => api.get('/patient/consultations'),
  getPrescriptions: () => api.get('/patient/prescriptions'),
  getAppointments: () => api.get('/patient/appointments'),
};

export default api;
