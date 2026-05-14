import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: '⊞', label: 'Tableau de bord' },
  { to: '/patients', icon: '♀', label: 'Patientes' },
  { to: '/consultations', icon: '📋', label: 'Consultations' },
  { to: '/calendar', icon: '📅', label: 'Planning' },
  { to: '/secretaries', icon: '👤', label: 'Secrétaires' },
  { to: '/unavailable-slots', icon: '🚫', label: 'Indisponibilités' },
  { to: '/profile', icon: '👤', label: 'Mon Profil' },
  { to: '/settings', icon: '⚙', label: 'Paramètres' },
  { to: '/audit-logs', icon: '📊', label: "Journal d'audit" },
];

const pageTitles: Record<string, string> = {
  '/dashboard': 'Tableau de bord', '/patients': 'Patientes',
  '/consultations': 'Consultations', '/calendar': 'Planning', '/settings': 'Paramètres',
  '/audit-logs': "Journal d'audit", '/profile': 'Mon Profil',
};

const DoctorLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const pageTitle = Object.entries(pageTitles).find(([key]) => pathname.startsWith(key))?.[1] ?? 'GyneCare';
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : 'DR';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>Gyne<span>Care</span></h1>
          <p>Espace Médical</p>
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
              <div className="user-name">Dr {user?.lastName}</div>
              <div className="user-role">{user?.role === 'DOCTOR' ? 'Médecin' : 'Assistante'}</div>
            </div>
          </div>
          <button className="btn-logout" onClick={logout}>Déconnexion</button>
        </div>
      </aside>
      <main className="main-content">
        <div className="topbar">
          <span className="topbar-title">{pageTitle}</span>
          <span className="text-sm text-muted">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
        <div className="page-content"><Outlet /></div>
      </main>
    </div>
  );
};

export default DoctorLayout;
