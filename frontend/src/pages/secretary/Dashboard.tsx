import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { secretaryAPI } from '../../services/api';

const SecretaryDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ patients: 0, consultations: 0, appointments: 0 });

  useEffect(() => {
    secretaryAPI.getDashboard().then(r => {
      const d = r.data.data;
      setStats({ patients: d.totalPatients || 0, consultations: d.totalConsultations || 0, appointments: d.totalAppointments || 0 });
    }).catch(() => {});
  }, []);

  return (
    <div className="page-container">
      <h2>Bonjour, {user?.firstName} {user?.lastName}</h2>
      <p style={{ color: '#666', marginBottom: 24 }}>Espace secretaire - Vue d'ensemble</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { label: 'Patientes', value: stats.patients, icon: 'Q', color: '#1a5c4a' },
          { label: 'Consultations', value: stats.consultations, icon: 'R', color: '#2196F3' },
          { label: 'Rendez-vous', value: stats.appointments, icon: 'S', color: '#FF9800' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: 20, borderTop: '3px solid ' + s.color }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ color: '#666', fontSize: 14 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default SecretaryDashboard;
