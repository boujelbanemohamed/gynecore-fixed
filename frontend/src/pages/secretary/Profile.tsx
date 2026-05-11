import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI, secretaryAPI } from '../../services/api';

const SecretaryProfile = () => {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [docInfo, setDocInfo] = useState<any>(null);
  const [pw, setPw] = useState({ current: '', new: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState({ success: '', error: '' });
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    if (user) setForm({ firstName: user.firstName || '', lastName: user.lastName || '', email: user.email || '', phone: (user as any).phone || '' });
    secretaryAPI.getDoctorInfo().then(r => setDocInfo(r.data.data)).catch(() => {});
  }, [user]);

  const handleSaveProfile = async () => {
    setSaving(true); setSuccess(''); setError('');
    try {
      const res = await authAPI.updateSecretaryProfile(form);
      if (res.data.success) { setEditing(false); setSuccess('Profil mis a jour'); }
    } catch (e: any) { setError(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    setPwSaving(true); setPwMsg({ success: '', error: '' });
    try {
      const res = await secretaryAPI.changePassword({ currentPassword: pw.current, newPassword: pw.new, confirmPassword: pw.confirm });
      if (res.data.success) { setPw({ current: '', new: '', confirm: '' }); setPwMsg({ success: 'Mot de passe modifie', error: '' }); }
    } catch (e: any) { setPwMsg({ success: '', error: e.response?.data?.message || 'Erreur' }); }
    finally { setPwSaving(false); }
  };

  const ss = { backgroundColor: '#fff', borderRadius: 12, padding: 24, marginBottom: 20, border: '1px solid #eee' };
  const ls = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#555' };
  const inp = { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, backgroundColor: '#fff', color: '#333' };
  const dis = { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, backgroundColor: '#f9f9f9', color: '#333' };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Mon Profil</h2>
      {success && <div style={{ padding: '12px 16px', backgroundColor: '#d4edda', color: '#155724', borderRadius: 8, marginBottom: 16 }}>{success}</div>}
      {error && <div style={{ padding: '12px 16px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: 8, marginBottom: 16 }}>{error}</div>}
      <div style={ss}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Informations personnelles</h3>
          {!editing && <button className="btn btn-primary" onClick={() => setEditing(true)}>Modifier</button>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #eee' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#1a5c4a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 700 }}>{(user?.firstName?.[0] || '').toUpperCase()}{(user?.lastName?.[0] || '').toUpperCase()}</div>
          <div><div style={{ fontWeight: 600 }}>{user?.firstName} {user?.lastName}</div><div style={{ color: '#666', fontSize: 13 }}>Secretaire Medicale</div></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div><label style={ls}>Prenom</label><input style={editing ? inp : dis} disabled={!editing} value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} /></div>
          <div><label style={ls}>Nom</label><input style={editing ? inp : dis} disabled={!editing} value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} /></div>
          <div><label style={ls}>Email</label><input style={editing ? inp : dis} disabled={!editing} value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
          <div><label style={ls}>Telephone</label><input style={editing ? inp : dis} disabled={!editing} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
        </div>
        <div style={{ marginTop: 16, padding: '8px 12px', backgroundColor: '#f0f7f5', borderRadius: 6, fontSize: 13, color: '#666' }}>Compte cree le {(user as any)?.createdAt ? new Date((user as any).createdAt).toLocaleDateString('fr-FR') : 'N/A'}</div>
        {editing && (<div style={{ display: 'flex', gap: 12, marginTop: 16 }}><button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}>{saving ? '...' : 'Enregistrer'}</button><button className="btn" onClick={() => setEditing(false)} style={{ backgroundColor: '#f0f0f0' }}>Annuler</button></div>)}
      </div>
      <div style={ss}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Informations du medecin</h3>
        {docInfo ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><label style={ls}>Nom</label><div style={{ padding: '10px 12px', backgroundColor: '#f9f9f9', borderRadius: 8, border: '1px solid #eee' }}>Dr. {docInfo.firstName} {docInfo.lastName}</div></div>
            <div><label style={ls}>Specialite</label><div style={{ padding: '10px 12px', backgroundColor: '#f9f9f9', borderRadius: 8, border: '1px solid #eee' }}>{docInfo.specialization || '-'}</div></div>
            <div><label style={ls}>Cabinet</label><div style={{ padding: '10px 12px', backgroundColor: '#f9f9f9', borderRadius: 8, border: '1px solid #eee' }}>{docInfo.clinicName || '-'}</div></div>
            <div><label style={ls}>Telephone</label><div style={{ padding: '10px 12px', backgroundColor: '#f9f9f9', borderRadius: 8, border: '1px solid #eee' }}>{docInfo.phone || '-'}</div></div>
            <div style={{ gridColumn: '1/-1' }}><label style={ls}>Adresse</label><div style={{ padding: '10px 12px', backgroundColor: '#f9f9f9', borderRadius: 8, border: '1px solid #eee' }}>{[docInfo.address, docInfo.city, docInfo.postalCode, docInfo.country].filter(Boolean).join(', ') || '-'}</div></div>
            <div style={{ gridColumn: '1/-1' }}><label style={ls}>Email</label><div style={{ padding: '10px 12px', backgroundColor: '#f9f9f9', borderRadius: 8, border: '1px solid #eee' }}>{docInfo.email || '-'}</div></div>
          </div>
        ) : <div style={{ color: '#999' }}>Chargement...</div>}
      </div>
      <div style={ss}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Securite - Changer le mot de passe</h3>
        {pwMsg.success && <div style={{ padding: '10px 14px', backgroundColor: '#d4edda', color: '#155724', borderRadius: 8, marginBottom: 12 }}>{pwMsg.success}</div>}
        {pwMsg.error && <div style={{ padding: '10px 14px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: 8, marginBottom: 12 }}>{pwMsg.error}</div>}
        <div style={{ display: 'grid', gap: 14, maxWidth: 400 }}>
          <div><label style={ls}>Mot de passe actuel</label><input type="password" style={inp} value={pw.current} onChange={e => setPw({...pw, current: e.target.value})} /></div>
          <div><label style={ls}>Nouveau mot de passe</label><input type="password" style={inp} value={pw.new} onChange={e => setPw({...pw, new: e.target.value})} /></div>
          <div><label style={ls}>Confirmer</label><input type="password" style={inp} value={pw.confirm} onChange={e => setPw({...pw, confirm: e.target.value})} /></div>
          <button className="btn btn-primary" onClick={handleChangePassword} disabled={pwSaving} style={{ width: 'fit-content' }}>{pwSaving ? '...' : 'Changer le mot de passe'}</button>
        </div>
      </div>
    </div>
  );
};
export default SecretaryProfile;
