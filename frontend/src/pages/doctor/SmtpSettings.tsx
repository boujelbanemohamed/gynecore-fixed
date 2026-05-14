import React, { useState, useEffect } from 'react';
import { doctorAPI } from '../../services/api';
import ConfirmDialog from '../../components/shared/ConfirmDialog';

const SmtpSettings: React.FC = () => {
  const [form, setForm] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: '',
    smtpPass: '',
    smtpFromName: 'GyneCare',
    smtpFromEmail: '',
    enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    doctorAPI.getSmtpConfig().then(r => {
      if (r.data.data) {
        setForm(prev => ({ ...prev, ...r.data.data }));
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const update = (patch: any) => setForm(prev => ({ ...prev, ...patch }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');
    setTestResult(null);
    try {
      await doctorAPI.saveSmtpConfig(form);
      setSuccess('Configuration SMTP sauvegardee avec succes !');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la sauvegarde');
    } finally { setSaving(false); }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    setError('');
    try {
      const r = await doctorAPI.testSmtpConnection(form);
      setTestResult({ ok: true, msg: r.data.message || 'Connexion reussie !' });
    } catch (err: any) {
      setTestResult({ ok: false, msg: err.response?.data?.error || err.message || 'Echec de la connexion' });
    } finally { setTesting(false); }
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = async () => {
    setShowResetConfirm(false);
    try {
      await doctorAPI.deleteSmtpConfig();
      setForm({
        smtpHost: 'smtp.gmail.com', smtpPort: 587, smtpSecure: false,
        smtpUser: '', smtpPass: '', smtpFromName: 'GyneCare', smtpFromEmail: '', enabled: true,
      });
      setSuccess('Configuration reinitialisee. Les parametres .env seront utilises.');
      setTestResult(null);
      setTimeout(() => setSuccess(''), 4000);
    } catch { setError('Erreur lors de la reinitialisation'); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div>;

  return (
    <form onSubmit={handleSave}>
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title">Configuration SMTP (Email)</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
            <input type="checkbox" checked={form.enabled} onChange={e => update({ enabled: e.target.checked })} />
            Activer l'envoi d'emails
          </label>
        </div>

        <p className="text-muted" style={{ fontSize: 13, marginBottom: 20 }}>
          Configurez le serveur SMTP pour l'envoi d'emails (reinitialisation de mot de passe, confirmation de rendez-vous).
          Ces parametres sont specifiques a votre compte medecin.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">Serveur SMTP (Host)</label>
            <input className="form-control" value={form.smtpHost} onChange={e => update({ smtpHost: e.target.value })}
              placeholder="smtp.gmail.com" disabled={!form.enabled} />
          </div>
          <div className="form-group">
            <label className="form-label">Port</label>
            <input className="form-control" type="number" value={form.smtpPort} onChange={e => update({ smtpPort: parseInt(e.target.value) || 587 })}
              placeholder="587" disabled={!form.enabled} />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
            <input type="checkbox" checked={form.smtpSecure} onChange={e => update({ smtpSecure: e.target.checked })} disabled={!form.enabled} />
            Utiliser SSL/TLS (port 465)
          </label>
        </div>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">Email SMTP (Identifiant)</label>
          <input className="form-control" type="email" value={form.smtpUser} onChange={e => update({ smtpUser: e.target.value })}
            placeholder="votre-email@gmail.com" disabled={!form.enabled} />
        </div>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">Mot de passe SMTP</label>
          <div style={{ position: 'relative' }}>
            <input className="form-control" type={showPassword ? 'text' : 'password'} value={form.smtpPass}
              onChange={e => update({ smtpPass: e.target.value })}
              placeholder={form.smtpPass ? 'Mot de passe deja configure - modifiez si necessaire' : 'Votre mot de passe d\'application'}
              style={{ paddingRight: 100 }} disabled={!form.enabled} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: 13 }}
              disabled={!form.enabled}>
              {showPassword ? 'Masquer' : 'Afficher'}
            </button>
          </div>
          <p className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
            Gmail : utilisez un <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" style={{ color: '#e91e63' }}>mot de passe d'application</a>, pas votre mot de passe habituel.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">Nom de l'expediteur</label>
            <input className="form-control" value={form.smtpFromName} onChange={e => update({ smtpFromName: e.target.value })}
              placeholder="GyneCare" disabled={!form.enabled} />
          </div>
          <div className="form-group">
            <label className="form-label">Email de l'expediteur</label>
            <input className="form-control" type="email" value={form.smtpFromEmail} onChange={e => update({ smtpFromEmail: e.target.value })}
              placeholder="votre-email@gmail.com" disabled={!form.enabled} />
          </div>
        </div>

        {/* Presets rapides */}
        <div style={{ marginBottom: 20 }}>
          <label className="form-label" style={{ marginBottom: 8 }}>Preset rapide :</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-outline btn-sm"
              onClick={() => update({ smtpHost: 'smtp.gmail.com', smtpPort: 587, smtpSecure: false })}>
              Gmail
            </button>
            <button type="button" className="btn btn-outline btn-sm"
              onClick={() => update({ smtpHost: 'smtp.office365.com', smtpPort: 587, smtpSecure: false })}>
              Outlook / Office365
            </button>
            <button type="button" className="btn btn-outline btn-sm"
              onClick={() => update({ smtpHost: 'smtp-relay.sendinblue.com', smtpPort: 587, smtpSecure: false })}>
              Brevo (Sendinblue)
            </button>
            <button type="button" className="btn btn-outline btn-sm"
              onClick={() => update({ smtpHost: 'smtp.mailtrap.io', smtpPort: 587, smtpSecure: false })}>
              Mailtrap
            </button>
          </div>
        </div>

        {/* Resultat du test */}
        {testResult && (
          <div style={{
            padding: '12px 16px', borderRadius: 8, marginBottom: 16,
            background: testResult.ok ? '#e8f5e9' : '#ffebee',
            borderLeft: `4px solid ${testResult.ok ? '#43a047' : '#e53935'}`,
          }}>
            <span style={{ fontWeight: 600, color: testResult.ok ? '#2e7d32' : '#c62828' }}>
              {testResult.ok ? '✓ ' : '✗ '}
            </span>
            <span style={{ color: testResult.ok ? '#2e7d32' : '#c62828' }}>{testResult.msg}</span>
          </div>
        )}

        {success && <div style={{ padding: '10px 16px', borderRadius: 8, marginBottom: 16, background: '#e8f5e9', color: '#2e7d32', fontSize: 14 }}>{success}</div>}
        {error && <div style={{ padding: '10px 16px', borderRadius: 8, marginBottom: 16, background: '#ffebee', color: '#c62828', fontSize: 14 }}>{error}</div>}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="submit" className="btn btn-primary" disabled={saving || !form.enabled}>
            {saving ? 'Enregistrement...' : 'Sauvegarder'}
          </button>
          <button type="button" className="btn btn-outline" onClick={handleTest} disabled={testing || !form.enabled || !form.smtpUser}>
            {testing ? 'Test en cours...' : 'Tester la connexion'}
          </button>
          <button type="button" className="btn btn-outline" style={{ color: '#e53935', borderColor: '#e53935' }} onClick={handleReset}>
            Reinitialiser
          </button>
        </div>
      </div>
      {showResetConfirm && (
        <ConfirmDialog
          isOpen={true}
          message="Revenir aux valeurs par defaut ? La configuration SMTP sera supprimee."
          onConfirm={confirmReset}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}
    </form>
  );
};

export default SmtpSettings;
