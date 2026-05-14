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
    <div className="section-sep">
      <h3 className="fs-16 fw-500 mb-16">Changer le mot de passe</h3>
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
          <div className={`alert ${msg.type === 'ok' ? 'badge-success' : 'alert-error'}`} style={{ padding: 8, borderRadius: 6, marginBottom: 12, fontSize: 14 }}>{msg.text}</div>
        )}
        <button type="button" className="btn btn-primary btn-sm" disabled={loading} onClick={handleSubmit}>
          {loading ? 'Mise a jour...' : 'Changer le mot de passe'}
        </button>
      </div>
    </div>
  );
};

export default PasswordChange;
