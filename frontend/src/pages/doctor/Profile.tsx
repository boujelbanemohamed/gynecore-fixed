import React, { useState, useEffect } from 'react';
import { doctorAPI } from '../../services/api';

const DoctorProfile: React.FC = () => {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', specialization: '', address: '', city: '', postalCode: '', country: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await doctorAPI.getProfile();
        const d = res.data.data;
        setForm({ firstName: d.firstName || '', lastName: d.lastName || '', email: d.email || '', phone: d.phone || '', specialization: d.specialization || '', address: d.address || '', city: d.city || '', postalCode: d.postalCode || '', country: d.country || '' });
      } catch { setErrorMsg('Erreur de chargement'); } finally { setLoading(false); }
    };
    fetch();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try { setSaving(true); setErrorMsg(null); setSuccessMsg(null);
      await doctorAPI.updateProfile(form);
      setSuccessMsg('Profil mis a jour');
    } catch { setErrorMsg('Erreur de mise a jour'); } finally { setSaving(false); }
  };

  const handleLogo = async () => {
    if (!logoFile) return;
    try { await doctorAPI.uploadLogo(logoFile); setSuccessMsg('Logo mis a jour'); } catch { setErrorMsg('Erreur logo'); }
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: '0.85rem', fontWeight: 600, color: '#4a5568' };
  const cardStyle: React.CSSProperties = { backgroundColor: '#fff', borderRadius: 12, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 24 };
  const cardTitle: React.CSSProperties = { margin: '0 0 24px', fontSize: '1.15rem', fontWeight: 700, color: '#16213e', paddingBottom: 12, borderBottom: '2px solid #f0f0f0' };
  const btnPrimary: React.CSSProperties = { padding: '10px 28px', backgroundColor: '#e94560', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 };
  const field = (key: string, label: string, type = 'text') => (
    <div key={key}>
      <label style={labelStyle}>{label}</label>
      <input style={inputStyle} type={type} value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
    </div>
  );

  if (loading) return <p style={{ color: '#718096' }}>Chargement...</p>;

  return (
    <div style={{ maxWidth: 720 }}>
      <h2 style={{ margin: '0 0 8px', fontSize: '1.1rem', color: '#4a5568' }}>Mon profil</h2>
      <p style={{ margin: '0 0 28px', color: '#a0aec0', fontSize: '0.9rem' }}>Gerez vos informations professionnelles.</p>
      {successMsg && <div style={{ padding: '12px 16px', marginBottom: 16, backgroundColor: '#f0fff4', border: '1px solid #c6f6d5', borderRadius: 8, color: '#22543d', fontSize: '0.9rem' }}>{successMsg}</div>}
      {errorMsg && <div style={{ padding: '12px 16px', marginBottom: 16, backgroundColor: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 8, color: '#c53030', fontSize: '0.9rem' }}>{errorMsg}</div>}
      <div style={cardStyle}>
        <h3 style={cardTitle}>Informations personnelles</h3>
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {field('firstName', 'Prenom')} {field('lastName', 'Nom')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {field('email', 'Email', 'email')} {field('phone', 'Telephone', 'tel')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {field('specialization', 'Specialisation')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
            {field('address', 'Adresse')} {field('city', 'Ville')} {field('postalCode', 'Code postal')}
          </div>
          <div style={{ marginBottom: 20 }}>{field('country', 'Pays')}</div>
          <button type="submit" style={btnPrimary} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
        </form>
      </div>
      <div style={cardStyle}>
        <h3 style={cardTitle}>Logo du cabinet</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files?.[0] || null)} />
          <button type="button" style={btnPrimary} onClick={handleLogo} disabled={!logoFile}>Uploader</button>
        </div>
      </div>
    </div>
  );
};
export default DoctorProfile;
