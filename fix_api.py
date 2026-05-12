filepath = 'frontend/src/services/api.ts'
with open(filepath, 'r') as f:
    content = f.read()

# Retirer la ligne orpheline apres le };
content = content.replace("  getUnavailableSlots: (params?: any) => api.get('/secretary/unavailable-slots', { params }),\n\n", "\n")

# Ajouter la methode DANS secretaryAPI, avant le };
content = content.replace(
    "  getMe: () => api.get('/auth/me'),\n};",
    "  getMe: () => api.get('/auth/me'),\n  getUnavailableSlots: (params?: any) => api.get('/secretary/unavailable-slots', { params }),\n};"
)

with open(filepath, 'w') as f:
    f.write(content)
print('Done')
