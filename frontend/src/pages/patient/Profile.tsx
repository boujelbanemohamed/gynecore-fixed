import React, { useState, useEffect } from 'react';
import { patientAPI } from '../../services/api';

const PatientProfile: React.FC = () => {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '', address: '', city: '', postalCode: '', country: '', cin: '', insurance: '', insuranceNumber: '' });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await patientAPI.getDossier();
        const d = res.data.data;
        const u = d.user || {};
        const p = d.patient || d;
        setForm({ firstName: u.firstName || '', lastName: u.lastName || '', email: u.email || '', phone: u.phone || '', dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '', address: p.address || '', city: p.city || '', postalCode: p.postalCode || '', country: p.country || '', cin: p.cin || '', insurance: p.insurance || '', insuranceNumber: p.insuranceNumber || '' });
      } catch { setErrorMsg('Erreur de chargement'); } finally { setLoading(false); }
    };
    fetch();
  }, []);

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', backgroundColor: '#f7fafc' };
  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: '0.85rem', fontWeight: 600, color: '#4a5568' };
  const cardStyle: React.CSSProperties = { backgroundColor: '#fff', borderRadius: 12, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 24 };
  const cardTitle: React.CSSProperties = { margin: '0 0 24px', fontSize: '1.15rem', fontWeight: 700, color: '#16213e', paddingBottom: 12, borderBottom: '2px solid #f0f0f0' };

  if (loading) return <p style={{ color: '#718096' }}>Chargement...</p>;
  if (errorMsg) return <div style={{ padding: '12px 16px', backgroundColor: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 8, color: '#c53030' }}>{errorMsg}</div>;

  const row = (key: string, label: string, span = 1) => {
    const v = (form as any)[key];
    return <div key={key} style={span > 1 ? { gridColumn: `1 / -1` } : {}}>
      <label style={labelStyle}>{label}</label>
      <input style={inputStyle} type="text" value={v} readOnly />
    </div>;
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <h2 style={{ margin: '0 0 8px', fontSize: '1.1rem', color: '#4a5568' }}>Mon profil</h2>
      <p style={{ margin: '0 0 28px', color: '#a0aec0', fontSize: '0.9rem' }}>Vos informations personnelles (lecture seule).</p>
      <div style={cardStyle}>
        <h3 style={cardTitle}>Informations personnelles</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          {row('firstName', 'Prenom')} {row('lastName', 'Nom')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          {row('email', 'Email')} {row('phone', 'Telephone')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          {row('dateOfBirth', 'Date de naissance')} {row('cin', 'CIN')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
          {row('address', 'Adresse', 1)} {row('city', 'Ville')} {row('postalCode', 'Code postal')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {row('country', 'Pays')} {row('insurance', 'Assurance')}
        </div>
      </div>
    </div>
  );
};
export default PatientProfile;
