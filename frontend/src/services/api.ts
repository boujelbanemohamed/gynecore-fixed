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
  loginSecretary: (email: string, password: string) => api.post('/auth/secretary/login', { email, password }),
  updateSecretaryProfile: (data: any) => api.put('/auth/secretary/profile', data),
  getMe: () => api.get('/auth/me'),
};


export const doctorAPI = {
  getDashboard: () => api.get('/doctor/dashboard'),
  getPatients: (params?: Record<string, unknown>) => api.get('/doctor/patients', { params }),
  getPatient: (id: string) => api.get(`/doctor/patients/${id}`),
  createPatient: (data: unknown) => api.post('/doctor/patients', data),
  updatePatient: (id: string, data: unknown) => api.put(`/doctor/patients/${id}`, data),
  deletePatient: (id: string) => api.delete(`/doctor/patients/${id}`),
  getConsultations: (params?: Record<string, unknown>) => api.get('/doctor/consultations', { params }),
  createConsultation: (data: unknown) => api.post('/doctor/consultations', data),
  updateConsultation: (id: string, data: unknown) => api.put(`/doctor/consultations/${id}`, data),
  getPrescriptions: (params?: Record<string, unknown>) => api.get('/doctor/prescriptions', { params }),
  getPrescriptionById: (id: string) => api.get(`/doctor/prescriptions/${id}`),
  createPrescription: (data: unknown) => api.post('/doctor/prescriptions', data),
  updatePrescription: (id: string, data: unknown) => api.put(`/doctor/prescriptions/${id}`, data),
  deletePrescription: (id: string) => api.delete(`/doctor/prescriptions/${id}`),
  getCertificates: (params?: Record<string, unknown>) => api.get('/doctor/certificates', { params }),
  getCertificateById: (id: string) => api.get(`/doctor/certificates/${id}`),
  createCertificate: (data: unknown) => api.post('/doctor/certificates', data),
  deleteCertificate: (id: string) => api.delete(`/doctor/certificates/${id}`),
  getMedicalLetters: (params?: Record<string, unknown>) => api.get('/doctor/medical-letters', { params }),
  getMedicalLetterById: (id: string) => api.get(`/doctor/medical-letters/${id}`),
  createMedicalLetter: (data: unknown) => api.post('/doctor/medical-letters', data),
  updateMedicalLetter: (id: string, data: unknown) => api.put(`/doctor/medical-letters/${id}`, data),
  deleteMedicalLetter: (id: string) => api.delete(`/doctor/medical-letters/${id}`),
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
  listSecretaries: () => api.get('/doctor/secretaries'),
  createSecretary: (data: Record<string, unknown>) => api.post('/doctor/secretaries', data),
  resetSecretaryPassword: (id: string, password: string) => api.post(`/doctor/secretaries/${id}/reset-password`, { password }),
  updateSecretary: (id: string, data: Record<string, unknown>) => api.put(`/doctor/secretaries/${id}`, data),
  toggleSecretaryStatus: (id: string) => api.patch(`/doctor/secretaries/${id}/toggle-status`),
  getUnavailableSlots: (params?: Record<string, unknown>) => api.get('/doctor/unavailable-slots', { params }),
  createUnavailableSlot: (data: Record<string, unknown>) => api.post('/doctor/unavailable-slots', data),
  deleteUnavailableSlot: (id: string) => api.delete(`/doctor/unavailable-slots/${id}`),
  getClinicalExams: (params?: Record<string, unknown>) => api.get('/doctor/clinical-exams', { params }),
  getClinicalExamById: (id: string) => api.get(`/doctor/clinical-exams/${id}`),
  createClinicalExam: (data: Record<string, unknown>) => api.post('/doctor/clinical-exams', data),
  updateClinicalExam: (id: string, data: Record<string, unknown>) => api.put(`/doctor/clinical-exams/${id}`, data),
  deleteClinicalExam: (id: string) => api.delete(`/doctor/clinical-exams/${id}`),
  getSmtpConfig: () => api.get('/doctor/smtp-config'),
  saveSmtpConfig: (data: any) => api.post('/doctor/smtp-config', data),
  testSmtpConnection: (data?: any) => api.post('/doctor/smtp-config/test', data),
  deleteSmtpConfig: () => api.delete('/doctor/smtp-config'),
  changePassword: (data: { currentPassword: string; newPassword: string }) => api.put('/doctor/profile/password', data),
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

export const secretaryAPI = {
  getDashboard: () => api.get('/secretary/dashboard'),
  getDoctorInfo: () => api.get('/secretary/doctor-info'),
  changePassword: (data: any) => api.put('/auth/secretary/password', data),
  getPatients: (params?: any) => api.get('/secretary/patients', { params }),
  getPatient: (id: string) => api.get('/secretary/patients/' + id),
  createPatient: (data: any) => api.post('/secretary/patients', data),
  updatePatient: (id: string, data: any) => api.put('/secretary/patients/' + id, data),
  getConsultations: (params?: any) => api.get('/secretary/consultations', { params }),
  getAppointments: (params?: any) => api.get('/secretary/appointments', { params }),
  createAppointment: (data: any) => api.post('/secretary/appointments', data),
  updateAppointment: (id: string, data: any) => api.put('/secretary/appointments/' + id, data),
  updateAppointmentStatus: (id: string, status: string) => api.patch('/secretary/appointments/' + id + '/status', { status }),
  deleteAppointment: (id: string) => api.delete('/secretary/appointments/' + id),
  getUnavailableSlots: (params?: any) => api.get('/secretary/unavailable-slots', { params }),
};
