import React, { useState, useEffect } from 'react';
import { superadminAPI } from '../../services/api';

const SuperadminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    superadminAPI.getDashboard().then(r => setStats(r.data.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Chargement...</p>;
  if (!stats) return <p>Erreur de chargement</p>;

  const cards = [
    { label: 'Médecins', value: stats.totalDoctors, color: '#1a73e8', icon: '👩‍⚕️' },
    { label: 'Patient(e)s', value: stats.totalPatients, color: '#34a853', icon: '👤' },
    { label: 'Rendez-vous', value: stats.totalAppointments, color: '#fbbc04', icon: '📅' },
    { label: 'Consultations', value: stats.totalConsultations, color: '#ea4335', icon: '📋' },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 24 }}>Dashboard Administration</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {cards.map(c => (
          <div key={c.label} className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{c.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 14, color: '#666' }}>{c.label}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Dernières actions (audit)</h3>
        {stats.recentLogs?.length ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ borderBottom: '2px solid #e0e0e0', textAlign: 'left' }}>
              <th style={{ padding: 8 }}>Date</th><th style={{ padding: 8 }}>Action</th><th style={{ padding: 8 }}>Ressource</th>
            </tr></thead>
            <tbody>
              {stats.recentLogs.map((log: any) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 8 }}>{new Date(log.createdAt).toLocaleString('fr-FR')}</td>
                  <td style={{ padding: 8 }}><span className="badge">{log.action}</span></td>
                  <td style={{ padding: 8 }}>{log.resource}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p style={{ color: '#999' }}>Aucune action récente</p>}
      </div>
    </div>
  );
};

export default SuperadminDashboard;
