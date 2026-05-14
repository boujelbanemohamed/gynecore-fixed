import React, { useState, useEffect } from 'react';
import { superadminAPI } from '../../services/api';
import Alert from '../../components/shared/Alert';
import ConfirmDialog from '../../components/shared/ConfirmDialog';

const TEMPLATE_LABELS: Record<string, string> = {
  appointment_created_doctor: 'Nouveau RDV (médecin)',
  appointment_created_patient: 'Nouveau RDV (patiente)',
  appointment_status_changed: 'Changement statut RDV',
  appointment_modified_doctor: 'RDV modifié (médecin)',
  unavailable_slot_created: 'Indisponibilité (secrétaire)',
  reminder_patient: 'Rappel patient',
};

const TEMPLATE_DESCRIPTIONS: Record<string, string> = {
  appointment_created_doctor: 'Envoyé au médecin quand un rendez-vous est créé',
  appointment_created_patient: 'Envoyé à la patiente quand son rendez-vous est créé',
  appointment_status_changed: 'Envoyé au médecin quand le statut d\'un RDV change',
  appointment_modified_doctor: 'Envoyé au médecin quand un RDV est modifié par la secrétaire',
  unavailable_slot_created: 'Envoyé à la/les secrétaire(s) quand le médecin ajoute une indisponibilité',
  reminder_patient: 'Envoyé à la patiente avant son rendez-vous (rappel automatique)',
};

const AVAILABLE_VARS = [
  '{{doctorFirstName}}', '{{doctorLastName}}', '{{doctorEmail}}',
  '{{patientFirstName}}', '{{patientLastName}}', '{{patientEmail}}',
  '{{appointmentDate}}', '{{appointmentTime}}', '{{appointmentType}}',
  '{{appointmentStatus}}', '{{appointmentReason}}',
  '{{clinicName}}', '{{clinicAddress}}',
  '{{secretaryFirstName}}', '{{secretaryLastName}}',
  '{{reason}}',
];

const TEMPLATE_KEYS = [
  'appointment_created_doctor',
  'appointment_created_patient',
  'appointment_status_changed',
  'appointment_modified_doctor',
  'unavailable_slot_created',
  'reminder_patient',
];

const SuperadminTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<Record<string, { subject: string; body: string; isCustom: boolean }>>({});
  const [reminderTimings, setReminderTimings] = useState<number[]>([24]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ subject: '', body: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testForm, setTestForm] = useState<{ key: string; to: string }>({ key: '', to: '' });
  const [testing, setTesting] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const r = await superadminAPI.getTemplates();
      const body = r.data;
      if (!body?.data?.templates) throw new Error('Format de réponse invalide');
      const map: Record<string, any> = {};
      for (const t of body.data.templates) {
        map[t.key] = t;
      }
      setTemplates(map);
      setReminderTimings(body.data.reminderTimings || [24]);
      setMsg(null);
    } catch (err) {
      console.error('[Templates] Erreur chargement:', err);
      setMsg({ type: 'error', text: 'Erreur chargement templates' });
    } finally { setLoading(false); }
  };

  const openEdit = (key: string) => {
    const t = templates[key];
    if (!t) {
      loadTemplates();
      return;
    }
    setEditForm({ subject: t.subject, body: t.body });
    setEditingKey(key);
    setMsg(null);
  };

  const insertVar = (v: string) => {
    setEditForm(prev => ({ ...prev, body: prev.body + v }));
  };

  const handleSave = async () => {
    if (!editingKey) return;
    setSaving(true);
    setMsg(null);
    try {
      await superadminAPI.updateTemplate(editingKey, editForm);
      setMsg({ type: 'success', text: 'Template mis à jour' });
      loadTemplates();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Erreur' });
    } finally { setSaving(false); }
  };

  const handleReset = async (key: string) => {
    try {
      const r = await superadminAPI.resetTemplate(key);
      if (editingKey === key) {
        setEditForm({ subject: r.data.data.subject, body: r.data.data.body });
      }
      setMsg({ type: 'success', text: 'Template réinitialisé' });
      loadTemplates();
    } catch { setMsg({ type: 'error', text: 'Erreur réinitialisation' }); }
    setShowResetConfirm(null);
  };

  const handleTest = async () => {
    if (!testForm.to || !testForm.key) return;
    setTesting(true);
    try {
      await superadminAPI.testTemplate({
        key: testForm.key,
        to: testForm.to,
        ...(editingKey === testForm.key ? editForm : {}),
      });
      setMsg({ type: 'success', text: `Email test envoyé à ${testForm.to}` });
      setShowTestModal(false);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Erreur envoi test' });
    } finally { setTesting(false); }
  };

  const handleAddReminder = () => {
    setReminderTimings(prev => {
      const next = [...prev, 24];
      return Array.from(new Set(next)).sort((a, b) => b - a);
    });
  };

  const handleRemoveReminder = (h: number) => {
    setReminderTimings(prev => prev.filter(v => v !== h));
  };

  const handleUpdateReminderTiming = (oldH: number, newH: number) => {
    setReminderTimings(prev => {
      const next = prev.map(v => v === oldH ? newH : v);
      return Array.from(new Set(next)).sort((a, b) => b - a);
    });
  };

  const handleSaveReminder = async () => {
    if (reminderTimings.length === 0) {
      setMsg({ type: 'error', text: 'Ajoutez au moins un rappel' });
      return;
    }
    setSaving(true);
    try {
      await superadminAPI.updateReminderSettings({ reminderTimings });
      const labels = reminderTimings.map(h => h >= 24 ? `${Math.floor(h / 24)}j` : `${h}h`).join(', ');
      setMsg({ type: 'success', text: `Rappels programmés : ${labels} avant le rendez-vous` });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Erreur' });
    } finally { setSaving(false); }
  };

  const openTest = (key: string) => {
    setTestForm({ key, to: '' });
    setShowTestModal(true);
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Gestion des templates email</h2>
      <p className="text-muted" style={{ marginBottom: 24 }}>
        Personnalisez les emails envoyés automatiquement. Utilisez les variables <code>{'{{variable}}'}</code> pour insérer des données dynamiques.
      </p>

      {msg && <Alert type={msg.type} message={msg.text} onClose={() => setMsg(null)} autoClose={4000} />}

      {/* Liste des templates */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {TEMPLATE_KEYS.map(key => {
          const t = templates[key];
          const isEditing = editingKey === key;
          return (
            <div className="card" key={key} style={{ padding: 0, overflow: 'hidden' }}>
              <div
                style={{
                  padding: '16px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: isEditing ? 'var(--primary-light)' : undefined,
                  borderBottom: isEditing ? '1px solid var(--border)' : undefined,
                }}
                onClick={() => isEditing ? setEditingKey(null) : openEdit(key)}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{TEMPLATE_LABELS[key] || key}</div>
                  <div className="text-muted" style={{ fontSize: 13 }}>{TEMPLATE_DESCRIPTIONS[key]}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {t?.isCustom && <span className="badge badge-primary">Personnalisé</span>}
                  <span style={{ fontSize: 12, color: '#999' }}>{isEditing ? '▲' : '▼'}</span>
                </div>
              </div>

              {isEditing && (
                <div style={{ padding: '20px 24px' }}>
                  <div className="form-group">
                    <label className="form-label">Sujet</label>
                    <input
                      className="form-control"
                      value={editForm.subject}
                      onChange={e => setEditForm({ ...editForm, subject: e.target.value })}
                      placeholder="Sujet de l'email..."
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Corps (HTML)</label>
                    <div style={{ marginBottom: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      <span style={{ fontSize: 12, color: '#666', marginRight: 8 }}>Variables :</span>
                      {AVAILABLE_VARS.map(v => (
                        <button
                          key={v}
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: 11, padding: '3px 8px' }}
                          onClick={() => insertVar(v)}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                    <textarea
                      className="form-control"
                      style={{ minHeight: 200, fontFamily: 'monospace', fontSize: 13 }}
                      value={editForm.body}
                      onChange={e => setEditForm({ ...editForm, body: e.target.value })}
                      placeholder="Corps de l'email en HTML..."
                    />
                    <div style={{ marginTop: 8 }}>
                      <strong style={{ fontSize: 12, color: '#666' }}>Aperçu :</strong>
                      <div
                        style={{
                          marginTop: 4,
                          padding: 16,
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          background: '#fafafa',
                          fontSize: 14,
                          maxHeight: 200,
                          overflow: 'auto',
                        }}
                        dangerouslySetInnerHTML={{
                          __html: editForm.body
                            .replace(/\{\{doctorFirstName\}\}/g, 'Jean')
                            .replace(/\{\{doctorLastName\}\}/g, 'Martin')
                            .replace(/\{\{patientFirstName\}\}/g, 'Marie')
                            .replace(/\{\{patientLastName\}\}/g, 'Dupont')
                            .replace(/\{\{appointmentDate\}\}/g, '15 juin 2026')
                            .replace(/\{\{appointmentTime\}\}/g, '14h30'),
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                      {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => openTest(key)}>
                      Envoyer un test
                    </button>
                    <button className="btn btn-outline btn-sm" style={{ color: '#e53935', borderColor: '#e53935' }} onClick={() => setShowResetConfirm(key)}>
                      Réinitialiser
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Configuration rappels multiples */}
      <div className="card" style={{ padding: 20 }}>
        <div className="card-header">
          <span className="card-title">Rappels automatiques patient</span>
        </div>
        <p className="text-muted" style={{ fontSize: 13, marginBottom: 16 }}>
          Définissez un ou plusieurs rappels envoyés à la patiente avant son rendez-vous. Le système vérifie toutes les 15 minutes.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {reminderTimings.map((h, i) => (
            <div key={`${h}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 500, minWidth: 140 }}>Rappel #{i + 1}</span>
              <select
                className="form-control"
                style={{ width: 240 }}
                value={h}
                onChange={e => handleUpdateReminderTiming(h, parseInt(e.target.value, 10))}
              >
                <option value={1}>1 heure avant</option>
                <option value={2}>2 heures avant</option>
                <option value={4}>4 heures avant</option>
                <option value={6}>6 heures avant</option>
                <option value={12}>12 heures avant</option>
                <option value={24}>24 heures avant</option>
                <option value={48}>48 heures avant (2 jours)</option>
                <option value={72}>72 heures avant (3 jours)</option>
                <option value={168}>168 heures avant (7 jours)</option>
              </select>
              {reminderTimings.length > 1 && (
                <button
                  className="btn btn-outline btn-sm"
                  style={{ color: '#e53935', borderColor: '#e53935', padding: '6px 10px' }}
                  onClick={() => handleRemoveReminder(h)}
                >
                  Supprimer
                </button>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-outline btn-sm" onClick={handleAddReminder}>
            + Ajouter un rappel
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleSaveReminder} disabled={saving}>
            {saving ? 'Sauvegarde...' : 'Sauvegarder les rappels'}
          </button>
        </div>
      </div>

      {/* Modal test */}
      {showTestModal && (
        <div className="modal-overlay" onClick={() => setShowTestModal(false)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Envoyer un email de test</span>
              <button className="btn-close" onClick={() => setShowTestModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p className="text-muted" style={{ fontSize: 13, marginBottom: 16 }}>
                Template : <strong>{TEMPLATE_LABELS[testForm.key]}</strong>
              </p>
              <div className="form-group">
                <label className="form-label">Adresse email de test</label>
                <input
                  className="form-control"
                  type="email"
                  placeholder="exemple@email.com"
                  value={testForm.to}
                  onChange={e => setTestForm({ ...testForm, to: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowTestModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleTest} disabled={testing || !testForm.to}>
                {testing ? 'Envoi...' : 'Envoyer le test'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm reset */}
      {showResetConfirm && (
        <ConfirmDialog
          isOpen={true}
          message="Réinitialiser ce template aux valeurs par défaut ?"
          confirmLabel="Réinitialiser"
          confirmDanger={true}
          onConfirm={() => handleReset(showResetConfirm)}
          onCancel={() => setShowResetConfirm(null)}
        />
      )}
    </div>
  );
};

export default SuperadminTemplates;
