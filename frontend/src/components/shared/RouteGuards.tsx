import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const DoctorRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'PATIENT') return <Navigate to="/patient/dashboard" replace />;
  if (user.role === 'SECRETARY') return <Navigate to="/secretary/dashboard" replace />;
  return <Outlet />;
};

export const PatientRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/patient/login" replace />;
  if (user.role !== 'PATIENT') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};

export const PublicRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (user) {
    if (user.role === 'SUPERADMIN') return <Navigate to="/superadmin/dashboard" replace />;
    if (user.role === 'PATIENT') return <Navigate to="/patient/dashboard" replace />;
    if (user.role === 'SECRETARY') return <Navigate to="/secretary/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
};

export const SecretaryRoute: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-container" style={{textAlign:'center',paddingTop:60}}>Chargement...</div>;
  if (!user || user.role !== 'SECRETARY') return <Navigate to="/secretary/login" replace />;
  return <Outlet />;
};

export const SuperadminRoute: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-container" style={{textAlign:'center',paddingTop:60}}>Chargement...</div>;
  if (!user || user.role !== 'SUPERADMIN') return <Navigate to="/superadmin/login" replace />;
  return <Outlet />;
};
