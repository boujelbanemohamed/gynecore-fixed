import React, { useState } from 'react';
import { doctorAPI } from '../../services/api';

const PasswordChange: React.FC = () => {
  const [pw, setPw] = useState({ current: '', newPw: '', confirm: '' });
  const [msg, setMsg] = useState<{type: string; text: string} | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setMsg(null);
    if (!pw.current || !pw.newPw) { setMsg({ type: 'err', text: 'Tous les champs sont requis.' }); return; }
    if (pw.newPw.length < 8) { setMsg({ type: 'err', text: 'Minimum 8 caracteres requis.' }); return; }
    if (pw.newPw !== pw.confirm) { setMsg({ type: 'err', text: 'Les mots de passe ne correspondent pas.' }); return; }
    setLoading(true);
    try {
      await doctorAPI.changePassword({ currentPassword: pw.current, newPassword: pw.newPw });
      setMsg({ type: 'ok', text: 'Mot de passe mis a jour avec succes !' });
      setPw({ current: '', newPw: '', confirm: '' });
    } catch (err: any) { setMsg({ type: 'err', text: err.response?.data?.error || 'Erreur.' }); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #e0e0e0' }}>
      <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 16 }}>Changer le mot de passe</h3>
      <div style={{ maxWidth: 400 }}>
        <div className="form-group">
          <label className="form-label">Ancien mot de passe</label>
          <input className="form-control" type="password" placeholder="Votre mot de passe actuel"
            value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Nouveau mot de passe</label>
          <input className="form-control" type="password" placeholder="Minimum 8 caracteres"
            value={pw.newPw} onChange={e => setPw({ ...pw, newPw: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Confirmer le nouveau mot de passe</label>
          <input className="form-control" type="password" placeholder="Retapez le nouveau mot de passe"
            value={pw.confirm} onChange={e => setPw({ ...pw, confirm: e.target.value })} />
        </div>
        {msg && (
          <div style={{ padding: 8, borderRadius: 6, marginBottom: 12, fontSize: 14,
            background: msg.type === 'ok' ? '#e8f5e9' : '#ffebee',
            color: msg.type === 'ok' ? '#2e7d32' : '#c62828' }}>{msg.text}</div>
        )}
        <button type="button" className="btn btn-primary btn-sm" disabled={loading} onClick={handleSubmit}>
          {loading ? 'Mise a jour...' : 'Changer le mot de passe'}
        </button>
      </div>
    </div>
  );
};

export default PasswordChange;
