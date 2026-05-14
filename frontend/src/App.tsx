import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DoctorRoute, PatientRoute, SecretaryRoute, PublicRoute, SuperadminRoute } from './components/shared/RouteGuards';
import DoctorLayout from './components/doctor/Layout';
import PatientLayout from './components/patient/Layout';
import SecretaryLayout from './components/secretary/Layout';
import SuperadminLayout from './components/superadmin/Layout';

const DoctorLogin = lazy(() => import('./pages/doctor/Login'));
const Dashboard = lazy(() => import('./pages/doctor/Dashboard'));
const Patients = lazy(() => import('./pages/doctor/Patients'));
const PatientDetail = lazy(() => import('./pages/doctor/PatientDetail'));
const Consultations = lazy(() => import('./pages/doctor/Consultations'));
const Calendar = lazy(() => import('./pages/doctor/Calendar'));
const Settings = lazy(() => import('./pages/doctor/Settings'));
const AuditLogs = lazy(() => import('./pages/doctor/AuditLogs'));
const UnavailableSlots = lazy(() => import('./pages/doctor/UnavailableSlots'));
const Secretaries = lazy(() => import('./pages/doctor/Secretaries'));
const DoctorProfile = lazy(() => import('./pages/doctor/Profile'));
const PatientLogin = lazy(() => import('./pages/patient/Login'));
const PatientDashboard = lazy(() => import('./pages/patient/Dashboard'));
const PatientDossier = lazy(() => import('./pages/patient/Dossier'));
const PatientPrescriptions = lazy(() => import('./pages/patient/Prescriptions'));
const PatientRendezVous = lazy(() => import('./pages/patient/RendezVous'));
const PatientProfile = lazy(() => import('./pages/patient/Profile'));
const SecretaryLogin = lazy(() => import('./pages/secretary/Login'));
const SecretaryDashboard = lazy(() => import('./pages/secretary/Dashboard'));
const SecretaryPatients = lazy(() => import('./pages/secretary/Patients'));
const SecretaryConsultations = lazy(() => import('./pages/secretary/Consultations'));
const SecretaryCalendar = lazy(() => import('./pages/secretary/Calendar'));
const SecretaryProfile = lazy(() => import('./pages/secretary/Profile'));
const ForgotPassword = lazy(() => import('./pages/shared/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/shared/ResetPassword'));
const SuperadminLogin = lazy(() => import('./pages/superadmin/Login'));
const SuperadminDashboard = lazy(() => import('./pages/superadmin/Dashboard'));
const SuperadminDoctors = lazy(() => import('./pages/superadmin/Doctors'));
const SuperadminAuditLogs = lazy(() => import('./pages/superadmin/AuditLogs'));
const SuperadminSettings = lazy(() => import('./pages/superadmin/Settings'));
const SuperadminProfile = lazy(() => import('./pages/superadmin/Profile'));
const SuperadminTemplates = lazy(() => import('./pages/superadmin/Templates'));
const SuperadminHealth = lazy(() => import('./pages/superadmin/SystemHealth'));
const NotFound = lazy(() => import('./pages/shared/NotFound'));

const LazyLoad: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<div className="loading-screen"><div className="spinner" /></div>}>
    {children}
  </Suspense>
);

const App: React.FC = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LazyLoad><DoctorLogin /></LazyLoad>} />
          <Route path="/patient/login" element={<LazyLoad><PatientLogin /></LazyLoad>} />
          <Route path="/secretary/login" element={<LazyLoad><SecretaryLogin /></LazyLoad>} />
          <Route path="/forgot-password" element={<LazyLoad><ForgotPassword /></LazyLoad>} />
          <Route path="/reset-password" element={<LazyLoad><ResetPassword /></LazyLoad>} />
          <Route path="/superadmin/login" element={<LazyLoad><SuperadminLogin /></LazyLoad>} />
        </Route>
        <Route element={<DoctorRoute />}>
          <Route element={<DoctorLayout />}>
            <Route path="/dashboard" element={<LazyLoad><Dashboard /></LazyLoad>} />
            <Route path="/patients" element={<LazyLoad><Patients /></LazyLoad>} />
            <Route path="/patients/:id" element={<LazyLoad><PatientDetail /></LazyLoad>} />
            <Route path="/consultations" element={<LazyLoad><Consultations /></LazyLoad>} />
            <Route path="/calendar" element={<LazyLoad><Calendar /></LazyLoad>} />
            <Route path="/secretaries" element={<LazyLoad><Secretaries /></LazyLoad>} />
            <Route path="/unavailable-slots" element={<LazyLoad><UnavailableSlots /></LazyLoad>} />
            <Route path="/audit-logs" element={<LazyLoad><AuditLogs /></LazyLoad>} />
            <Route path="/settings" element={<LazyLoad><Settings /></LazyLoad>} />
            <Route path="/profile" element={<LazyLoad><DoctorProfile /></LazyLoad>} />
          </Route>
        </Route>
        <Route element={<PatientRoute />}>
          <Route element={<PatientLayout />}>
            <Route path="/patient/dashboard" element={<LazyLoad><PatientDashboard /></LazyLoad>} />
            <Route path="/patient/dossier" element={<LazyLoad><PatientDossier /></LazyLoad>} />
            <Route path="/patient/prescriptions" element={<LazyLoad><PatientPrescriptions /></LazyLoad>} />
            <Route path="/patient/rendez-vous" element={<LazyLoad><PatientRendezVous /></LazyLoad>} />
            <Route path="/patient/profile" element={<LazyLoad><PatientProfile /></LazyLoad>} />
          </Route>
        </Route>
        <Route element={<SecretaryRoute />}>
          <Route element={<SecretaryLayout />}>
            <Route path="/secretary/patients" element={<LazyLoad><SecretaryPatients /></LazyLoad>} />
            <Route path="/secretary/consultations" element={<LazyLoad><SecretaryConsultations /></LazyLoad>} />
            <Route path="/secretary/calendar" element={<LazyLoad><SecretaryCalendar /></LazyLoad>} />
            <Route path="/secretary/dashboard" element={<LazyLoad><SecretaryDashboard /></LazyLoad>} />
            <Route path="/secretary/profile" element={<LazyLoad><SecretaryProfile /></LazyLoad>} />
          </Route>
        </Route>
        <Route element={<SuperadminRoute />}>
          <Route element={<SuperadminLayout />}>
            <Route path="/superadmin/dashboard" element={<LazyLoad><SuperadminDashboard /></LazyLoad>} />
            <Route path="/superadmin/doctors" element={<LazyLoad><SuperadminDoctors /></LazyLoad>} />
            <Route path="/superadmin/audit-logs" element={<LazyLoad><SuperadminAuditLogs /></LazyLoad>} />
            <Route path="/superadmin/settings" element={<LazyLoad><SuperadminSettings /></LazyLoad>} />
            <Route path="/superadmin/profile" element={<LazyLoad><SuperadminProfile /></LazyLoad>} />
            <Route path="/superadmin/templates" element={<LazyLoad><SuperadminTemplates /></LazyLoad>} />
            <Route path="/superadmin/health" element={<LazyLoad><SuperadminHealth /></LazyLoad>} />
          </Route>
        </Route>
        <Route path="*" element={<LazyLoad><NotFound /></LazyLoad>} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
