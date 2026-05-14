import React, { useState, useEffect } from 'react';
import { superadminAPI } from '../../services/api';

const envLabels: Record<string, string> = {
  NODE_ENV: 'Environnement',
  CORS_ORIGIN: 'Origine CORS',
  FRONTEND_URL: 'URL Frontend',
  JWT_EXPIRES_IN: 'Expiration JWT (médecins)',
  JWT_PATIENT_EXPIRES_IN: 'Expiration JWT (patients)',
  SMTP_HOST: 'Serveur SMTP',
  SMTP_PORT: 'Port SMTP',
  SMTP_USER: 'Utilisateur SMTP',
  SMTP_PASS: 'Mot de passe SMTP',
  SMTP_FROM_EMAIL: 'Email expéditeur',
  SMTP_FROM_NAME: 'Nom expéditeur',
  RATE_LIMIT_WINDOW_MS: 'Fenêtre rate-limit (ms)',
  RATE_LIMIT_MAX: 'Max requêtes rate-limit',
};

const editableKeys = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_FROM_EMAIL', 'SMTP_FROM_NAME', 'SMTP_USER', 'SMTP_PASS',
  'CORS_ORIGIN', 'FRONTEND_URL', 'JWT_EXPIRES_IN', 'JWT_PATIENT_EXPIRES_IN',
  'RATE_LIMIT_WINDOW_MS', 'RATE_LIMIT_MAX'];

const SuperadminSettings: React.FC = () => {
  const [settings, setSettings] = useState<any>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{type:string;text:string}|null>(null);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    superadminAPI.getSettings().then(r => {
      setSettings(r.data.data);
      const env = r.data.data.env || {};
      const init: Record<string, string> = {};
      for (const k of editableKeys) if (env[k] !== undefined) init[k] = env[k];
      setForm(init);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await superadminAPI.updateSettings({ settings: form });
      setMsg({ type: 'ok', text: 'Configuration sauvegardée. Redémarrez le serveur pour appliquer.' });
    } catch (err: any) {
      setMsg({ type: 'err', text: err.response?.data?.error || 'Erreur' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>Configuration système</h2>

      {msg && (
        <div className={`alert ${msg.type === 'ok' ? 'badge-success' : 'alert-error'}`}
          style={{ padding: 10, borderRadius: 6, marginBottom: 16, fontSize: 13 }}>
          {msg.text}
        </div>
      )}

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Variables d'environnement</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {editableKeys.map((key) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label style={{ minWidth: 200, fontSize: 13, fontWeight: 500, color: '#555' }}>
                {envLabels[key] || key}
              </label>
              {key === 'SMTP_PASS' ? (
                <div style={{ flex: 1, display: 'flex', gap: 4 }}>
                  <input
                    className="form-control"
                    style={{ flex: 1, fontSize: 13 }}
                    type={showPass ? 'text' : 'password'}
                    value={form[key] ?? ''}
                    onChange={e => setForm({...form, [key]: e.target.value})}
                    placeholder="Laisser vide pour conserver l'actuel"
                  />
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ whiteSpace: 'nowrap' }}
                    onClick={() => setShowPass(!showPass)}
                  >
                    {showPass ? 'Masquer' : 'Afficher'}
                  </button>
                </div>
              ) : (
                <input
                  className="form-control"
                  style={{ flex: 1, fontSize: 13 }}
                  value={form[key] ?? ''}
                  onChange={e => setForm({...form, [key]: e.target.value})}
                />
              )}
            </div>
          ))}
        </div>
        <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={handleSave} disabled={saving}>
          {saving ? 'Sauvegarde...' : 'Sauvegarder la configuration'}
        </button>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Base de données</h3>
        {settings?.db?.map((row: any, i: number) => (
          <div key={i} style={{ fontSize: 13, color: '#666' }}>{row.version}</div>
        ))}
      </div>
    </div>
  );
};

export default SuperadminSettings;
