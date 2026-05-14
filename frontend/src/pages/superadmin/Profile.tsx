import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { superadminAPI, authAPI } from '../../services/api';

const SuperadminProfile: React.FC = () => {
  const { user, setUser } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{type:string;text:string}|null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPwd, setChangingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{type:string;text:string}|null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const r = await superadminAPI.updateProfile({ firstName, lastName, email });
      setUser(r.data.data);
      setMsg({ type: 'ok', text: 'Profil mis à jour' });
    } catch (err: any) {
      setMsg({ type: 'err', text: err.response?.data?.message || err.response?.data?.error || 'Erreur' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    if (newPassword.length < 8) { setPwdMsg({ type: 'err', text: 'Minimum 8 caractères' }); return; }
    if (newPassword !== confirmPassword) { setPwdMsg({ type: 'err', text: 'Les mots de passe ne correspondent pas' }); return; }
    setChangingPwd(true);
    try {
      await superadminAPI.changePassword({ currentPassword, newPassword });
      setPwdMsg({ type: 'ok', text: 'Mot de passe mis à jour' });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) {
      setPwdMsg({ type: 'err', text: err.response?.data?.error || 'Erreur' });
    } finally {
      setChangingPwd(false);
    }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>Mon Profil</h2>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Informations personnelles</h3>
        {msg && <div className={`alert ${msg.type === 'ok' ? 'badge-success' : 'alert-error'}`} style={{ padding: 8, borderRadius: 6, marginBottom: 12, fontSize: 13 }}>{msg.text}</div>}
        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label className="form-label">Prénom</label><input className="form-control" value={firstName} onChange={e => setFirstName(e.target.value)} required /></div>
          <div><label className="form-label">Nom</label><input className="form-control" value={lastName} onChange={e => setLastName(e.target.value)} required /></div>
          <div><label className="form-label">Email</label><input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving} style={{ alignSelf: 'flex-start' }}>
            {saving ? 'Sauvegarde...' : 'Enregistrer'}
          </button>
        </form>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Changer le mot de passe</h3>
        {pwdMsg && <div className={`alert ${pwdMsg.type === 'ok' ? 'badge-success' : 'alert-error'}`} style={{ padding: 8, borderRadius: 6, marginBottom: 12, fontSize: 13 }}>{pwdMsg.text}</div>}
        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label className="form-label">Mot de passe actuel</label><input className="form-control" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required /></div>
          <div><label className="form-label">Nouveau mot de passe</label><input className="form-control" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} /></div>
          <div><label className="form-label">Confirmer le nouveau mot de passe</label><input className="form-control" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required /></div>
          <button type="submit" className="btn btn-outline btn-sm" disabled={changingPwd} style={{ alignSelf: 'flex-start' }}>
            {changingPwd ? 'Mise à jour...' : 'Changer le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SuperadminProfile;
