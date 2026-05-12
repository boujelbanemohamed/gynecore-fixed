filepath = 'backend/prisma/schema.prisma'
with open(filepath, 'r') as f:
    content = f.read()

model = """
model MedicalLetter {
  id         String   @id @default(cuid())
  patientId  String
  patient    Patient  @relation(fields: [patientId], references: [id])
  type       String
  recipient  String
  subject    String
  content    Json
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@map("medical_letters")
}
"""

# Ajouter le modele avant AuditLog
content = content.replace('model AuditLog {', model + '\nmodel AuditLog {')

# Ajouter la relation sur Patient
content = content.replace(
    "  certificates         Certificate[]",
    "  certificates         Certificate[]\n  medicalLetters       MedicalLetter[]"
)

with open(filepath, 'w') as f:
    f.write(content)
print('1. Modele MedicalLetter ajoute au schema')
