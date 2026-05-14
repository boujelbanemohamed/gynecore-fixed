import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const nav = [
  { to: '/superadmin/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/superadmin/doctors', label: 'Médecins', icon: '👩‍⚕️' },
  { to: '/superadmin/templates', label: 'Emails', icon: '📧' },
  { to: '/superadmin/audit-logs', label: 'Audit', icon: '📋' },
  { to: '/superadmin/settings', label: 'Configuration', icon: '⚙️' },
  { to: '/superadmin/profile', label: 'Mon Profil', icon: '👤' },
  { to: '/superadmin/health', label: 'Santé', icon: '❤️' },
];

const SuperadminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{ width: 250, background: '#1a1a2e', color: '#fff', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 14, opacity: 0.6 }}>SuperAdmin</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>GyneCare</div>
        </div>
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {nav.map(item => (
            <NavLink key={item.to} to={item.to} end style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px',
              color: isActive ? '#fff' : 'rgba(255,255,255,0.65)', textDecoration: 'none',
              background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
              borderRight: isActive ? '3px solid #4fc3f7' : '3px solid transparent',
              fontSize: 14,
            })}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 13, opacity: 0.5, marginBottom: 4 }}>{user?.email}</div>
          <button onClick={() => { logout(); navigate('/superadmin/login'); }} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
            padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 13,
          }}>Déconnexion</button>
        </div>
      </div>
      <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default SuperadminLayout;
