filepath = 'backend/src/routes/index.ts'
with open(filepath, 'r') as f:
    content = f.read()

# Ajouter l'import
content = content.replace(
    "import * as certificateController from '../controllers/certificateController';",
    "import * as certificateController from '../controllers/certificateController';\nimport * as medicalLetterController from '../controllers/medicalLetterController';"
)

# Ajouter les routes apres les routes certificates
content = content.replace(
    "router.delete('/doctor/certificates/:id', authenticate, authorizeDoctor, certificateController.deleteCertificate);",
    "router.delete('/doctor/certificates/:id', authenticate, authorizeDoctor, certificateController.deleteCertificate);\nrouter.get('/doctor/medical-letters', authenticate, authorizeDoctor, medicalLetterController.getMedicalLetters);\nrouter.get('/doctor/medical-letters/:id', authenticate, authorizeDoctor, medicalLetterController.getMedicalLetterById);\nrouter.post('/doctor/medical-letters', authenticate, authorizeDoctor, medicalLetterController.createMedicalLetter);\nrouter.put('/doctor/medical-letters/:id', authenticate, authorizeDoctor, medicalLetterController.updateMedicalLetter);\nrouter.delete('/doctor/medical-letters/:id', authenticate, authorizeDoctor, medicalLetterController.deleteMedicalLetter);"
)

with open(filepath, 'w') as f:
    f.write(content)
print('4. Routes medical-letters ajoutees')
