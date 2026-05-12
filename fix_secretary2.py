filepath = 'backend/src/controllers/secretaryPortalController.ts'
with open(filepath, 'r') as f:
    content = f.read()

old = "firstName, lastName, email, phone, role: 'PATIENT'"
new = "firstName, lastName, email, phone, role: 'PATIENT', password: 'GyneCare2024'"
content = content.replace(old, new)

with open(filepath, 'w') as f:
    f.write(content)
print('Done')
