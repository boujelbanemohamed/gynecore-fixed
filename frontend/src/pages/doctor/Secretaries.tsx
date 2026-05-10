import React, { useEffect, useState } from 'react';
import { doctorAPI } from '../../services/api';

const Secretaries: React.FC = () => {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwTarget, setPwTarget] = useState<any>(null);
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', phone: '', cinNumber: '', address: '', city: '', postalCode: '', password: '' });

  const load = () => {
    setLoading(true);
    doctorAPI.listSecretaries().then(r => setList(r.data.data || [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setError('');
    if (!form.email || !form.firstName || !form.lastName || !form.cinNumber || !form.password) {
      setError('Email, nom, prenom, CIN et mot de passe sont requis');
      return;
    }
    try {
      await doctorAPI.createSecretary(form);
      setShowModal(false);
      setForm({ email: '', firstName: '', lastName: '', phone: '', cinNumber: '', address: '', city: '', postalCode: '', password: '' });
      setSuccess('Secretaire creee avec succes');
      setTimeout(() => setSuccess(''), 3000);
      load();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Erreur lors de la creation');
    }
  };

  const handleResetPw = async () => {
    if (!pw) { setError('Le mot de passe est requis'); return; }
    try {
      await doctorAPI.resetSecretaryPassword(pwTarget.id, pw);
      setShowPwModal(false);
      setPw('');
      setPwTarget(null);
      setSuccess('Mot de passe reinitialise');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) { setError(e.response?.data?.error || 'Erreur'); }
  };

  const handleToggle = async (s: any) => {
    try {
      await doctorAPI.toggleSecretaryStatus(s.id);
      load();
    } catch (e: any) { setError(e.response?.data?.error || 'Erreur'); }
  };

  const upd = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Secretaires</h2>
        <button className="btn btn-primary" onClick={() => { setError(''); setShowModal(true); }}>+ Nouvelle secretaire</button>
      </div>
      {success && <div style={{ background: '#d4edda', color: '#155724', padding: 10, borderRadius: 6, marginBottom: 16, fontSize: 14 }}>{success}</div>}
      {error && <div style={{ background: '#f8d7da', color: '#721c24', padding: 10, borderRadius: 6, marginBottom: 16, fontSize: 14 }}>{error}</div>}

      {loading ? <p>Chargement...</p> : list.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}><p>Aucune secretaire enregistree</p></div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {list.map((s: any) => (
            <div key={s.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: s.isActive ? 1 : 0.5 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{s.firstName} {s.lastName}</div>
                <div style={{ fontSize: 13, color: '#666' }}>{s.email}{s.phone ? ' - ' + s.phone : ''}</div>
                <div style={{ fontSize: 13, color: '#888' }}>CIN: {s.cinNumber}{s.address ? ' | ' + s.address : ''}{s.city ? ', ' + s.city : ''}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className={'badge ' + (s.isActive ? 'badge-success' : 'badge-muted')}>{s.isActive ? 'Active' : 'Inactive'}</span>
                <button className="btn btn-outline btn-sm" onClick={() => { setPwTarget(s); setPw(''); setError(''); setShowPwModal(true); }}>Mot de passe</button>
                <button className={'btn btn-outline btn-sm'} style={{ color: s.isActive ? 'var(--danger)' : 'var(--success)' }} onClick={() => handleToggle(s)}>{s.isActive ? 'Desactiver' : 'Activer'}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header"><h3>Nouvelle secretaire</h3><button className="btn-close" onClick={() => setShowModal(false)}>x</button></div>
            <div className="modal-body">
              {error && <div style={{ background: '#f8d7da', color: '#721c24', padding: 8, borderRadius: 4, marginBottom: 12, fontSize: 13 }}>{error}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[['firstName', 'Prenom'], ['lastName', 'Nom'], ['email', 'Email'], ['cinNumber', 'Numero CIN'], ['phone', 'Telephone'], ['address', 'Adresse'], ['city', 'Ville'], ['postalCode', 'Code postal']].map(([k, l]) => (
                  <div key={k}><label className="form-label" style={{ fontSize: 12 }}>{l}</label><input className="form-control" value={(form as any)[k]} onChange={e => upd(k, e.target.value)} /></div>
                ))}
                <div style={{ gridColumn: '1/-1' }}><label className="form-label" style={{ fontSize: 12 }}>Mot de passe</label><input className="form-control" type="password" value={form.password} onChange={e => upd('password', e.target.value)} /></div>
              </div>
            </div>
            <div className="modal-footer"><button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button><button className="btn btn-primary" onClick={handleCreate}>Creer</button></div>
          </div>
        </div>
      )}

      {showPwModal && pwTarget && (
        <div className="modal-overlay" onClick={() => setShowPwModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header"><h3>Reinitialiser le mot de passe</h3><button className="btn-close" onClick={() => setShowPwModal(false)}>x</button></div>
            <div className="modal-body">
              <p style={{ marginBottom: 12, fontSize: 14 }}>Secretaire : <strong>{pwTarget.firstName} {pwTarget.lastName}</strong></p>
              {error && <div style={{ background: '#f8d7da', color: '#721c24', padding: 8, borderRadius: 4, marginBottom: 12, fontSize: 13 }}>{error}</div>}
              <label className="form-label" style={{ fontSize: 12 }}>Nouveau mot de passe</label>
              <input className="form-control" type="password" value={pw} onChange={e => setPw(e.target.value)} />
            </div>
            <div className="modal-footer"><button className="btn btn-outline" onClick={() => setShowPwModal(false)}>Annuler</button><button className="btn btn-primary" onClick={handleResetPw}>Reinitialiser</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Secretaries;
