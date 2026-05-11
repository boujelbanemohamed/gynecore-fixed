import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doctorAPI } from '../../services/api';

const DoctorProfile: React.FC = () => {
  const { user, setUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', speciality: '' });

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: (user as any).phone || '',
        speciality: (user as any).speciality || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSuccess(''); setError('');
  };

  const handleSave = async () => {
    setSaving(true); setSuccess(''); setError('');
    try {
      const res = await doctorAPI.updateProfile(form);
      if (res.data.success) {
        setUser({ ...user!, ...res.data.data });
        setEditing(false);
        setSuccess('Profil mis a jour avec succes');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la mise a jour');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>Mon Profil</h2>
        {!editing && <button className="btn btn-primary" onClick={() => setEditing(true)}>Modifier</button>}
      </div>
      {success && <div style={{ padding: '12px 16px', backgroundColor: '#d4edda', color: '#155724', borderRadius: 8, marginBottom: 20 }}>{success}</div>}
      {error && <div style={{ padding: '12px 16px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: 8, marginBottom: 20 }}>{error}</div>}
      <div className="card" style={{ maxWidth: 600 }}>
        <div style={{ display: 'grid', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 20, borderBottom: '1px solid #eee' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#1a5c4a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 700 }}>
              {(user?.firstName?.[0] || '').toUpperCase()}{(user?.lastName?.[0] || '').toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 18 }}>Dr. {user?.firstName} {user?.lastName}</div>
              <div style={{ color: '#666', fontSize: 13 }}>Medecin Gynecologue-Obstetricien</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#555' }}>Prenom</label>
              <input type="text" name="firstName" value={form.firstName} onChange={handleChange} disabled={!editing} style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, backgroundColor: editing ? '#fff' : '#f9f9f9', color: '#333' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#555' }}>Nom</label>
              <input type="text" name="lastName" value={form.lastName} onChange={handleChange} disabled={!editing} style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, backgroundColor: editing ? '#fff' : '#f9f9f9', color: '#333' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#555' }}>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} disabled={!editing} style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, backgroundColor: editing ? '#fff' : '#f9f9f9', color: '#333', maxWidth: 600 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#555' }}>Telephone</label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} disabled={!editing} placeholder="+216 XX XXX XXX" style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, backgroundColor: editing ? '#fff' : '#f9f9f9', color: '#333' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#555' }}>Specialite</label>
              <input type="text" name="speciality" value={form.speciality} onChange={handleChange} disabled={!editing} style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, backgroundColor: editing ? '#fff' : '#f9f9f9', color: '#333' }} />
            </div>
          </div>
          {editing && (
            <div style={{ display: 'flex', gap: 12, paddingTop: 12, borderTop: '1px solid #eee' }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
              <button className="btn" onClick={() => { setEditing(false); setForm({ firstName: user?.firstName || '', lastName: user?.lastName || '', email: user?.email || '', phone: (user as any).phone || '', speciality: (user as any).speciality || '' }); }} style={{ backgroundColor: '#f0f0f0' }}>Annuler</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default DoctorProfile;
