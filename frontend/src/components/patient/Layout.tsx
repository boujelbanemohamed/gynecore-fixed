import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/patient/dashboard', icon: '⊞', label: 'Mon espace' },
  { to: '/patient/dossier', icon: '📁', label: 'Mon dossier' },
  { to: '/patient/prescriptions', icon: '💊', label: 'Mes ordonnances' },
  { to: '/patient/rendez-vous', icon: '📅', label: 'Mes rendez-vous' },
];

const PatientLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : 'PT';

  return (
    <div className="patient-layout">
      <aside className="patient-sidebar sidebar">
        <div className="sidebar-logo">
          <h1>Gyne<span style={{ color: '#74b9f5' }}>Care</span></h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase', marginTop: 2 }}>Portail Patient</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <span className="nav-icon">{item.icon}</span>{item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{initials}</div>
            <div>
              <div className="user-name">{user?.firstName} {user?.lastName}</div>
              <div className="user-role">Patient</div>
            </div>
          </div>
          <button className="btn-logout" onClick={logout}>Déconnexion</button>
        </div>
      </aside>
      <main className="main-content">
        <div className="topbar">
          <span className="topbar-title">Portail Patient — GyneCare</span>
          <span className="text-sm text-muted">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
        <div className="page-content"><Outlet /></div>
      </main>
    </div>
  );
};

export default PatientLayout;
