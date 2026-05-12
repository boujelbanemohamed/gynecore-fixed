import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/secretary/dashboard', label: 'Tableau de bord' },
  { to: '/secretary/patients', label: 'Patientes' },
  { to: '/secretary/consultations', label: 'Consultations' },
  { to: '/secretary/calendar', label: 'Planning' },
  { to: '/secretary/profile', label: 'Mon Profil' },
];

const SecretaryLayout = () => {
  const { user, logout } = useAuth();
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f6fa' }}>
      <aside style={{ width: 240, backgroundColor: '#1a5c4a', color: '#fff', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 100 }}>
        <div style={{ padding: 20, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>GyneCare</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>Espace Secretaire</div>
        </div>
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
              display: 'block', padding: '12px 20px', color: '#fff', textDecoration: 'none', fontSize: 14,
              backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
              borderLeft: isActive ? '3px solid #fff' : '3px solid transparent',
            })}>{item.label}</NavLink>
          ))}
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 13, marginBottom: 8, opacity: 0.8 }}>{user?.firstName} {user?.lastName}</div>
          <button onClick={logout} style={{ width: '100%', padding: 8, backgroundColor: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 13 }}>Deconnexion</button>
        </div>
      </aside>
      <main style={{ flex: 1, marginLeft: 240, display: 'flex', flexDirection: 'column' }}>
        <header style={{ backgroundColor: '#fff', padding: '16px 24px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 18, color: '#333' }}>GyneCare - Secretariat</h2>
          <div style={{ fontSize: 13, color: '#666' }}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </header>
        <div style={{ flex: 1, padding: 24 }}><Outlet /></div>
      </main>
    </div>
  );
};
export default SecretaryLayout;
