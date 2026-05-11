import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DoctorRoute, PatientRoute, SecretaryRoute, PublicRoute } from './components/shared/RouteGuards';
import DoctorLayout from './components/doctor/Layout';
import PatientLayout from './components/patient/Layout';
import SecretaryLayout from './components/secretary/Layout';
import DoctorLogin from './pages/doctor/Login';
import Dashboard from './pages/doctor/Dashboard';
import Patients from './pages/doctor/Patients';
import PatientDetail from './pages/doctor/PatientDetail';
import Consultations from './pages/doctor/Consultations';
import Calendar from './pages/doctor/Calendar';
import Settings from './pages/doctor/Settings';
import Secretaries from './pages/doctor/Secretaries';
import DoctorProfile from './pages/doctor/Profile';
import PatientLogin from './pages/patient/Login';
import PatientDashboard from './pages/patient/Dashboard';
import PatientDossier from './pages/patient/Dossier';
import PatientPrescriptions from './pages/patient/Prescriptions';
import PatientRendezVous from './pages/patient/RendezVous';
import PatientProfile from './pages/patient/Profile';
import SecretaryLogin from './pages/secretary/Login';
import SecretaryDashboard from './pages/secretary/Dashboard';
import SecretaryProfile from './pages/secretary/Profile';

const App: React.FC = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<DoctorLogin />} />
          <Route path="/patient/login" element={<PatientLogin />} />
          <Route path="/secretary/login" element={<SecretaryLogin />} />
        </Route>
        <Route element={<DoctorRoute />}>
          <Route element={<DoctorLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/patients/:id" element={<PatientDetail />} />
            <Route path="/consultations" element={<Consultations />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/secretaries" element={<Secretaries />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<DoctorProfile />} />
          </Route>
        </Route>
        <Route element={<PatientRoute />}>
          <Route element={<PatientLayout />}>
            <Route path="/patient/dashboard" element={<PatientDashboard />} />
            <Route path="/patient/dossier" element={<PatientDossier />} />
            <Route path="/patient/prescriptions" element={<PatientPrescriptions />} />
            <Route path="/patient/rendez-vous" element={<PatientRendezVous />} />
            <Route path="/patient/profile" element={<PatientProfile />} />
          </Route>
        </Route>
        <Route element={<SecretaryRoute />}>
          <Route element={<SecretaryLayout />}>
            <Route path="/secretary/dashboard" element={<SecretaryDashboard />} />
            <Route path="/secretary/profile" element={<SecretaryProfile />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
