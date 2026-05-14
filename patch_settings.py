#!/usr/bin/env python3
"""GyneCare SMTP Settings UI Patcher"""
import os, sys, re

def read(path):
    with open(path, 'r') as f: return f.read()
def write(path, content):
    with open(path, 'w') as f: f.write(content)

# ── 1. Patch schema.prisma ──
def patch_schema():
    fp = 'prisma/schema.prisma'
    if not os.path.exists(fp):
        print('  -> schema.prisma non trouve'); return False
    c = read(fp)
    if 'SmtpConfig' in c:
        print('  -> SmtpConfig deja dans le schema'); return True
    # Add relation to User model
    c = c.replace(
        '  @@map("users")\n}',
        '  smtpConfigs      SmtpConfig[]\n\n  @@map("users")\n}'
    )
    # Add SmtpConfig model at end
    smtp_model = '''
model SmtpConfig {
  id            String   @id @default(uuid())
  doctorId      String   @unique
  doctor        User     @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  smtpHost      String   @default("smtp.gmail.com")
  smtpPort      Int      @default(587)
  smtpSecure    Boolean  @default(false)
  smtpUser      String   @default("")
  smtpPass      String   @default("")
  smtpFromName  String   @default("GyneCare")
  smtpFromEmail String   @default("")
  enabled       Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("smtp_configs")
}
'''
    c += smtp_model
    write(fp, c)
    print('  -> SmtpConfig ajoute au schema Prisma')
    return True

# ── 2. Add SMTP routes ──
def patch_routes():
    fp = 'src/routes/index.ts'
    if not os.path.exists(fp):
        print('  -> routes/index.ts non trouve'); return False
    c = read(fp)
    if 'smtpController' in c:
        print('  -> Routes SMTP deja presentes'); return True
    c = c.replace(
        "import * as unavailableSlotController from '../controllers/unavailableSlotController';",
        "import * as unavailableSlotController from '../controllers/unavailableSlotController';\nimport * as smtpController from '../controllers/smtpController';"
    )
    c = c.replace(
        "router.delete('/doctor/unavailable-slots/:id', authenticate, authorizeDoctor, unavailableSlotController.deleteUnavailableSlot);",
        "router.delete('/doctor/unavailable-slots/:id', authenticate, authorizeDoctor, unavailableSlotController.deleteUnavailableSlot);\n\n// SMTP Configuration\nrouter.get('/doctor/smtp-config', authenticate, authorizeDoctor, smtpController.getSmtpConfig);\nrouter.post('/doctor/smtp-config', authenticate, authorizeDoctor, smtpController.saveSmtpConfig);\nrouter.post('/doctor/smtp-config/test', authenticate, authorizeDoctor, smtpController.testSmtpConnection);\nrouter.delete('/doctor/smtp-config', authenticate, authorizeDoctor, smtpController.deleteSmtpConfig);"
    )
    write(fp, c)
    print('  -> Routes SMTP ajoutees')
    return True

# ── 3. Update emailService function signatures (add doctorId param) ──
def patch_appointment_email_calls():
    fp = 'src/controllers/appointmentController.ts'
    if not os.path.exists(fp):
        print('  -> appointmentController.ts non trouve'); return False
    c = read(fp)
    # Already patched with old signatures - update to add doctorId
    if 'sendAppointmentConfirmationEmail(patientEmail, {' not in c:
        print('  -> appointmentController deja a jour ou non patche'); return True
    c = c.replace(
        'await sendAppointmentConfirmationEmail(patientEmail, {',
        'await sendAppointmentConfirmationEmail(doctorId, patientEmail, {'
    )
    c = c.replace(
        'await sendAppointmentCancellationEmail(patientEmail, {',
        'await sendAppointmentCancellationEmail(doctorId, patientEmail, {'
    )
    write(fp, c)
    print('  -> appointmentController mis a jour avec doctorId')
    return True

def patch_secretary_email_calls():
    fp = 'src/controllers/secretaryPortalController.ts'
    if not os.path.exists(fp):
        print('  -> secretaryPortalController.ts non trouve'); return False
    c = read(fp)
    if 'sendAppointmentConfirmationEmail(patientEmail, {' not in c:
        print('  -> secretaryPortal deja a jour ou non patche'); return True
    c = c.replace(
        'await sendAppointmentConfirmationEmail(patientEmail, {',
        'await sendAppointmentConfirmationEmail(patientData.doctorId, patientEmail, {'
    )
    c = c.replace(
        'await sendAppointmentCancellationEmail(patientEmail, {',
        'await sendAppointmentCancellationEmail(patientData.doctorId, patientEmail, {'
    )
    write(fp, c)
    print('  -> secretaryPortal mis a jour avec doctorId')
    return True

# ── 4. Update frontend api.ts ──
def patch_api():
    found = False
    for fp in ['../../frontend/src/services/api.ts', '../frontend/src/services/api.ts', 'src/services/api.ts']:
        if os.path.exists(fp):
            found = True; break
    if not found:
        print('  -> api.ts non trouve (recherche ../frontend/)'); return False
    c = read(fp)
    if 'smtpConfig' in c:
        print('  -> API SMTP deja dans api.ts'); return True
    c = c.replace(
        "  uploadLogo: (file: File) => {",
        "  getSmtpConfig: () => api.get('/doctor/smtp-config'),\n  saveSmtpConfig: (data: any) => api.post('/doctor/smtp-config', data),\n  testSmtpConnection: (data?: any) => api.post('/doctor/smtp-config/test', data),\n  deleteSmtpConfig: () => api.delete('/doctor/smtp-config'),\n  uploadLogo: (file: File) => {"
    )
    write(fp, c)
    print('  -> API SMTP ajoutees dans api.ts')
    return True

# ── 5. Patch Settings.tsx to include SmtpSettings component ──
def patch_settings():
    found = False
    for fp in ['../../frontend/src/pages/doctor/Settings.tsx', '../frontend/src/pages/doctor/Settings.tsx', 'src/pages/doctor/Settings.tsx']:
        if os.path.exists(fp):
            found = True; break
    if not found:
        print('  -> Settings.tsx non trouve'); return False
    c = read(fp)
    if 'SmtpSettings' in c:
        print('  -> SmtpSettings deja dans Settings.tsx'); return True
    # Add import
    c = c.replace(
        "import { doctorAPI } from '../../services/api';",
        "import { doctorAPI } from '../../services/api';\nimport SmtpSettings from './SmtpSettings';"
    )
    # Add component after the form closing tag
    c = c.replace(
        '      </form>\n    </div>\n  );\n};',
        '      </form>\n\n      <div style={{ marginTop: 24 }}>\n        <SmtpSettings />\n      </div>\n    </div>\n  );\n};'
    )
    write(fp, c)
    print('  -> SmtpSettings integre dans Settings.tsx')
    return True

if __name__ == '__main__':
    print('============================================')
    print('  GYNECARE - Patch SMTP Settings UI')
    print('============================================')
    ok = True
    for name, fn in [
        ('1. Schema Prisma', patch_schema),
        ('2. Routes', patch_routes),
        ('3. Appointment email calls', patch_appointment_email_calls),
        ('4. Secretary email calls', patch_secretary_email_calls),
        ('5. Frontend api.ts', patch_api),
        ('6. Frontend Settings.tsx', patch_settings),
    ]:
        print(f'\n[{name}]')
        if not fn(): ok = False
    print('\n' + ('OK' if ok else 'ECHEC'))
    sys.exit(0 if ok else 1)
