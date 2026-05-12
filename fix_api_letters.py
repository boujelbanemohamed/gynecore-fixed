filepath = 'frontend/src/services/api.ts'
with open(filepath, 'r') as f:
    content = f.read()

# Ajouter les methodes apres deleteCertificate
content = content.replace(
    "  deleteCertificate: (id: string) => api.delete(`/doctor/certificates/${id}`),",
    "  deleteCertificate: (id: string) => api.delete(`/doctor/certificates/${id}`),\n  getMedicalLetters: (params?: Record<string, unknown>) => api.get('/doctor/medical-letters', { params }),\n  getMedicalLetterById: (id: string) => api.get(`/doctor/medical-letters/${id}`),\n  createMedicalLetter: (data: unknown) => api.post('/doctor/medical-letters', data),\n  updateMedicalLetter: (id: string, data: unknown) => api.put(`/doctor/medical-letters/${id}`, data),\n  deleteMedicalLetter: (id: string) => api.delete(`/doctor/medical-letters/${id}`),"
)

with open(filepath, 'w') as f:
    f.write(content)
print('5. API frontend medical-letters ajoutees')
