filepath = 'frontend/src/services/api.ts'
with open(filepath, 'r') as f:
    content = f.read()

# 1. Retirer de authAPI
content = content.replace("  getUnavailableSlots: (params?: any) => api.get('/secretary/unavailable-slots', { params }),\n", "")

# 2. Ajouter dans secretaryAPI avant le };
content = content.replace(
    "  deleteAppointment: (id: string) => api.delete('/secretary/appointments/' + id),\n};",
    "  deleteAppointment: (id: string) => api.delete('/secretary/appointments/' + id),\n  getUnavailableSlots: (params?: any) => api.get('/secretary/unavailable-slots', { params }),\n};"
)

with open(filepath, 'w') as f:
    f.write(content)
print('Done')
