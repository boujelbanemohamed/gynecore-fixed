import { Router } from 'express';
import { authenticate, authorizeDoctor, authorizePatient, authorizeSecretary, authorizeSuperadmin } from '../middleware/auth';
import * as authController from '../controllers/authController'
import * as patientController from '../controllers/patientController';
import * as appointmentController from '../controllers/appointmentController';
import * as prescriptionController from '../controllers/prescriptionController';
import * as profileController from '../controllers/profileController';
import * as documentController from '../controllers/documentController';
import * as patientPortalController from '../controllers/patientPortalController';
import * as consultationController from '../controllers/consultationController';
import * as auditController from '../controllers/auditController';
import * as secretaryController from '../controllers/secretaryController';
import * as spController from '../controllers/secretaryPortalController';
import * as passwordResetController from '../controllers/passwordResetController';
import * as certificateController from '../controllers/certificateController';
import * as clinicalExamController from '../controllers/clinicalExamController';
import * as medicalLetterController from '../controllers/medicalLetterController';
import * as unavailableSlotController from '../controllers/unavailableSlotController';
import * as smtpController from '../controllers/smtpController';
import { uploadLogo, uploadDocument } from '../middleware/upload';
import * as superadminController from '../controllers/superadminController';

const router = Router();

router.post('/auth/login', authController.loginDoctor);
router.put('/auth/secretary/profile', authenticate, authController.updateSecretaryProfile);
router.post('/auth/secretary/login', authController.loginSecretary);
router.post('/auth/patient/login', authController.loginPatient);
router.get('/auth/me', authenticate, authController.getMe);
router.post('/auth/forgot-password', passwordResetController.forgotPassword);
router.post('/auth/verify-reset-token', passwordResetController.verifyResetToken);
router.post('/auth/reset-password', passwordResetController.resetPassword);

router.get('/doctor/audit-logs', authenticate, authorizeDoctor, auditController.getAuditLogs);

// Secretary management
router.get('/doctor/secretaries', authenticate, authorizeDoctor, secretaryController.listSecretaries);
router.post('/doctor/secretaries', authenticate, authorizeDoctor, secretaryController.createSecretary);
router.post('/doctor/secretaries/:id/reset-password', authenticate, authorizeDoctor, secretaryController.resetSecretaryPassword);
router.put('/doctor/secretaries/:id', authenticate, authorizeDoctor, secretaryController.updateSecretary);
router.patch('/doctor/secretaries/:id/toggle-status', authenticate, authorizeDoctor, secretaryController.toggleSecretaryStatus);

router.get('/doctor/dashboard', authenticate, authorizeDoctor, patientController.getDashboardStats);

router.get('/doctor/patients', authenticate, authorizeDoctor, patientController.getPatients);
router.get('/doctor/patients/:id', authenticate, authorizeDoctor, patientController.getPatientById);
router.post('/doctor/patients', authenticate, authorizeDoctor, patientController.createPatient);
router.put('/doctor/patients/:id', authenticate, authorizeDoctor, patientController.updatePatient);
router.delete('/doctor/patients/:id', authenticate, authorizeDoctor, patientController.deletePatient);

router.get('/doctor/consultations', authenticate, authorizeDoctor, consultationController.getConsultations);
router.post('/doctor/consultations', authenticate, authorizeDoctor, consultationController.createConsultation);
router.put('/doctor/consultations/:id', authenticate, authorizeDoctor, consultationController.updateConsultation);

router.get('/doctor/appointments', authenticate, authorizeDoctor, appointmentController.getAppointments);
router.post('/doctor/appointments', authenticate, authorizeDoctor, appointmentController.createAppointment);
router.patch('/doctor/appointments/:id/status', authenticate, authorizeDoctor, appointmentController.updateAppointmentStatus);

router.get('/doctor/prescriptions', authenticate, authorizeDoctor, prescriptionController.getPrescriptions);
router.get('/doctor/prescriptions/:id', authenticate, authorizeDoctor, prescriptionController.getPrescriptionById);
router.post('/doctor/prescriptions', authenticate, authorizeDoctor, prescriptionController.createPrescription);
router.put('/doctor/prescriptions/:id', authenticate, authorizeDoctor, prescriptionController.updatePrescription);
router.delete('/doctor/prescriptions/:id', authenticate, authorizeDoctor, prescriptionController.deletePrescription);

router.get('/doctor/certificates', authenticate, authorizeDoctor, certificateController.getCertificates);
router.get('/doctor/certificates/:id', authenticate, authorizeDoctor, certificateController.getCertificateById);
router.post('/doctor/certificates', authenticate, authorizeDoctor, certificateController.createCertificate);
router.delete('/doctor/certificates/:id', authenticate, authorizeDoctor, certificateController.deleteCertificate);

router.get('/doctor/clinical-exams', authenticate, authorizeDoctor, clinicalExamController.getClinicalExams);
router.get('/doctor/clinical-exams/:id', authenticate, authorizeDoctor, clinicalExamController.getClinicalExamById);
router.post('/doctor/clinical-exams', authenticate, authorizeDoctor, clinicalExamController.createClinicalExam);
router.put('/doctor/clinical-exams/:id', authenticate, authorizeDoctor, clinicalExamController.updateClinicalExam);
router.delete('/doctor/clinical-exams/:id', authenticate, authorizeDoctor, clinicalExamController.deleteClinicalExam);
router.get('/doctor/medical-letters', authenticate, authorizeDoctor, medicalLetterController.getMedicalLetters);
router.get('/doctor/medical-letters/:id', authenticate, authorizeDoctor, medicalLetterController.getMedicalLetterById);
router.post('/doctor/medical-letters', authenticate, authorizeDoctor, medicalLetterController.createMedicalLetter);
router.put('/doctor/medical-letters/:id', authenticate, authorizeDoctor, medicalLetterController.updateMedicalLetter);
router.delete('/doctor/medical-letters/:id', authenticate, authorizeDoctor, medicalLetterController.deleteMedicalLetter);

router.get('/doctor/profile', authenticate, authorizeDoctor, profileController.getProfile);
router.put('/doctor/profile', authenticate, authorizeDoctor, profileController.updateProfile);
router.post('/doctor/profile/logo', authenticate, authorizeDoctor, uploadLogo.single('file'), profileController.uploadLogo);
router.put('/doctor/profile/password', authenticate, authorizeDoctor, profileController.changePassword);
router.post('/doctor/documents', authenticate, authorizeDoctor, uploadDocument.single('file'), documentController.uploadDocument);
router.get('/doctor/documents/:patientId', authenticate, authorizeDoctor, documentController.getPatientDocuments);
router.delete('/doctor/documents/:documentId', authenticate, authorizeDoctor, documentController.deleteDocument);

router.get('/patient/dossier', authenticate, authorizePatient, patientPortalController.getMyDossier);
router.get('/patient/consultations', authenticate, authorizePatient, patientPortalController.getMyConsultations);
router.get('/patient/prescriptions', authenticate, authorizePatient, prescriptionController.getPatientPrescriptions);
router.get('/patient/appointments', authenticate, authorizePatient, appointmentController.getPatientAppointments);

// ===== Secretary portal routes =====
router.get('/secretary/dashboard', authenticate, authorizeSecretary, spController.getDashboardStats);
router.get('/secretary/doctor-info', authenticate, authorizeSecretary, spController.getDoctorInfo);
router.put('/auth/secretary/password', authenticate, authorizeSecretary, spController.changePassword);
router.get('/secretary/patients', authenticate, authorizeSecretary, spController.getPatients);
router.get('/secretary/patients/:id', authenticate, authorizeSecretary, spController.getPatientById);
router.post('/secretary/patients', authenticate, authorizeSecretary, spController.createPatient);
router.put('/secretary/patients/:id', authenticate, authorizeSecretary, spController.updatePatientAdmin);
router.get('/secretary/consultations', authenticate, authorizeSecretary, spController.getConsultations);
router.get('/secretary/appointments', authenticate, authorizeSecretary, spController.getAppointments);
router.post('/secretary/appointments', authenticate, authorizeSecretary, spController.createAppointment);
router.put('/secretary/appointments/:id', authenticate, authorizeSecretary, spController.updateAppointment);
router.patch('/secretary/appointments/:id/status', authenticate, authorizeSecretary, spController.updateAppointmentStatus);
router.delete('/secretary/appointments/:id', authenticate, authorizeSecretary, spController.deleteAppointment);



router.get('/doctor/unavailable-slots', authenticate, authorizeDoctor, unavailableSlotController.getUnavailableSlots);
router.post('/doctor/unavailable-slots', authenticate, authorizeDoctor, unavailableSlotController.createUnavailableSlot);
router.delete('/doctor/unavailable-slots/:id', authenticate, authorizeDoctor, unavailableSlotController.deleteUnavailableSlot);

// SMTP Configuration
router.get('/doctor/smtp-config', authenticate, authorizeDoctor, smtpController.getSmtpConfig);
router.post('/doctor/smtp-config', authenticate, authorizeDoctor, smtpController.saveSmtpConfig);
router.post('/doctor/smtp-config/test', authenticate, authorizeDoctor, smtpController.testSmtpConnection);
router.delete('/doctor/smtp-config', authenticate, authorizeDoctor, smtpController.deleteSmtpConfig);

router.get('/secretary/unavailable-slots', authenticate, authorizeSecretary, unavailableSlotController.getUnavailableSlots);

// ===== Superadmin routes =====
router.post('/auth/superadmin/login', authController.loginSuperadmin);
router.get('/superadmin/dashboard', authenticate, authorizeSuperadmin, superadminController.getDashboard);
router.get('/superadmin/doctors', authenticate, authorizeSuperadmin, superadminController.getDoctors);
router.post('/superadmin/doctors', authenticate, authorizeSuperadmin, superadminController.createDoctor);
router.put('/superadmin/doctors/:id', authenticate, authorizeSuperadmin, superadminController.updateDoctor);
router.post('/superadmin/doctors/:id/reset-password', authenticate, authorizeSuperadmin, superadminController.resetDoctorPassword);
router.get('/superadmin/users', authenticate, authorizeSuperadmin, superadminController.getAllUsers);
router.get('/superadmin/audit-logs', authenticate, authorizeSuperadmin, superadminController.getAllAuditLogs);
router.get('/superadmin/settings', authenticate, authorizeSuperadmin, superadminController.getSystemSettings);
router.put('/superadmin/settings', authenticate, authorizeSuperadmin, superadminController.updateSystemSettings);
router.post('/superadmin/secretaries/:id/reset-password', authenticate, authorizeSuperadmin, superadminController.resetSecretaryPassword);
router.patch('/superadmin/secretaries/:id/toggle-status', authenticate, authorizeSuperadmin, superadminController.toggleSecretaryStatus);
router.put('/superadmin/profile', authenticate, authorizeSuperadmin, authController.updateSuperadminProfile);
router.put('/superadmin/password', authenticate, authorizeSuperadmin, superadminController.changeSuperadminPassword);

export default router;
