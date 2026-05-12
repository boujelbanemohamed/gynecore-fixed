filepath = 'backend/src/controllers/secretaryPortalController.ts'
with open(filepath, 'r') as f:
    content = f.read()

old_create = '{ doctorId: did, ...(dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) } : {}), address, city, postalCode, country }'
new_create = '{ doctorId: did, dateOfBirth: new Date(dateOfBirth), address, city, postalCode, country }'
content = content.replace(old_create, new_create)

old_check = 'if (email)'
new_check = "if (!dateOfBirth) return res.status(400).json({ success: false, message: 'dateOfBirth requis' });\n    if (email)"
content = content.replace(old_check, new_check, 1)

with open(filepath, 'w') as f:
    f.write(content)
print('Done')
