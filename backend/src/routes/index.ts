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
import { uploadLogo, uploadDocument } from '../middleware/upload';

const router = Router();

router.post('/auth/login', authController.loginDoctor);
router.post('/auth/patient/login', authController.loginPatient);
router.get('/auth/me', authenticate, authController.getMe);

router.get('/doctor/dashboard', authenticate, authorizeDoctor, patientController.getDashboardStats);

router.get('/doctor/patients', authenticate, authorizeDoctor, patientController.getPatients);
router.get('/doctor/patients/:id', authenticate, authorizeDoctor, patientController.getPatientById);
router.post('/doctor/patients', authenticate, authorizeDoctor, patientController.createPatient);
router.put('/doctor/patients/:id', authenticate, authorizeDoctor, patientController.updatePatient);

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
