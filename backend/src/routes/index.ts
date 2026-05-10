import { Router } from 'express';
import { authenticate, authorizeDoctor, authorizePatient } from '../middleware/auth';
import * as authController from '../controllers/authController';
import * as patientController from '../controllers/patientController';
import * as appointmentController from '../controllers/appointmentController';
import * as prescriptionController from '../controllers/prescriptionController';
import * as profileController from '../controllers/profileController';
import * as documentController from '../controllers/documentController';
import * as patientPortalController from '../controllers/patientPortalController';
import * as consultationController from '../controllers/consultationController';
import * as auditController from '../controllers/auditController';
import * as passwordResetController from '../controllers/passwordResetController';
import * as certificateController from '../controllers/certificateController';
import { uploadLogo, uploadDocument } from '../middleware/upload';

const router = Router();

router.post('/auth/login', authController.loginDoctor);
router.post('/auth/patient/login', authController.loginPatient);
router.get('/auth/me', authenticate, authController.getMe);
router.post('/auth/forgot-password', passwordResetController.forgotPassword);
router.post('/auth/verify-reset-token', passwordResetController.verifyResetToken);
router.post('/auth/reset-password', passwordResetController.resetPassword);

router.get('/doctor/audit-logs', authenticate, authorizeDoctor, auditController.getAuditLogs);

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

router.get('/doctor/profile', authenticate, authorizeDoctor, profileController.getProfile);
router.put('/doctor/profile', authenticate, authorizeDoctor, profileController.updateProfile);
router.post('/doctor/profile/logo', authenticate, authorizeDoctor, uploadLogo.single('file'), profileController.uploadLogo);

router.post('/doctor/documents', authenticate, authorizeDoctor, uploadDocument.single('file'), documentController.uploadDocument);
router.get('/doctor/documents/:patientId', authenticate, authorizeDoctor, documentController.getPatientDocuments);
router.delete('/doctor/documents/:documentId', authenticate, authorizeDoctor, documentController.deleteDocument);

router.get('/patient/dossier', authenticate, authorizePatient, patientPortalController.getMyDossier);
router.get('/patient/consultations', authenticate, authorizePatient, patientPortalController.getMyConsultations);
router.get('/patient/prescriptions', authenticate, authorizePatient, prescriptionController.getPatientPrescriptions);
router.get('/patient/appointments', authenticate, authorizePatient, appointmentController.getPatientAppointments);

export default router;
