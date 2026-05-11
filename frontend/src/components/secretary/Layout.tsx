import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SecretaryLayout: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f6fa' }}>
      <aside style={{ width: 240, backgroundColor: '#1a5c4a', color: '#fff', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>GyneCare</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>Espace Secretaire</div>
        </div>
        <nav style={{ flex: 1, padding: '12px 0' }}>
          <NavLink to="/secretary/dashboard" style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', color: '#fff', textDecoration: 'none',
            backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
            borderLeft: isActive ? '3px solid #fff' : '3px solid transparent',
          })}>
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/secretary/profile" style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', color: '#fff', textDecoration: 'none',
            backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
            borderLeft: isActive ? '3px solid #fff' : '3px solid transparent',
          })}>
            <span>Mon Profil</span>
          </NavLink>
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 13, marginBottom: 8, opacity: 0.8 }}>{user?.firstName} {user?.lastName}</div>
          <button onClick={logout} style={{
            width: '100%', padding: '8px', backgroundColor: 'rgba(255,255,255,0.15)',
            border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 13,
          }}>
            Deconnexion
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ backgroundColor: '#fff', padding: '16px 24px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 18, color: '#333' }}>GyneCare - Secretariat</h2>
          <div style={{ fontSize: 13, color: '#666' }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>
        <div style={{ flex: 1, padding: 24 }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SecretaryLayout;
