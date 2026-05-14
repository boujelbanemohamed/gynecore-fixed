import React, { useState, useEffect } from 'react';
import { superadminAPI } from '../../services/api';

const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const modalBox: React.CSSProperties = {
  background: '#fff', borderRadius: 12, padding: 28, minWidth: 480, maxWidth: 600,
  maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
};
const fieldRow: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', padding: '6px 0',
  borderBottom: '1px solid #f0f0f0', fontSize: 13,
};
const fieldLabel: React.CSSProperties = { color: '#888', fontWeight: 500 };
const fieldValue: React.CSSProperties = { color: '#333', textAlign: 'right' as const };

const DoctorModal = ({ doctor, onClose }: { doctor: any; onClose: () => void }) => (
  <div style={modalOverlay} onClick={onClose}>
    <div style={modalBox} onClick={e => e.stopPropagation()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{doctor.firstName} {doctor.lastName}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#999' }}>×</button>
      </div>
      <div>
        <div style={fieldRow}><span style={fieldLabel}>Email</span><span style={fieldValue}>{doctor.email}</span></div>
        <div style={fieldRow}><span style={fieldLabel}>Téléphone</span><span style={fieldValue}>{doctor.phone || '-'}</span></div>
        <div style={fieldRow}><span style={fieldLabel}>Spécialité</span><span style={fieldValue}>{doctor.specialization || '-'}</span></div>
        <div style={fieldRow}><span style={fieldLabel}>RPPS</span><span style={fieldValue}>{doctor.licenseNumber || '-'}</span></div>
        <div style={fieldRow}><span style={fieldLabel}>Cabinet</span><span style={fieldValue}>{doctor.clinicName || '-'}</span></div>
        <div style={fieldRow}><span style={fieldLabel}>Adresse</span><span style={fieldValue}>{doctor.address ? `${doctor.address}${doctor.city ? ', ' + doctor.city : ''}` : '-'}</span></div>
        <div style={fieldRow}><span style={fieldLabel}>Statut</span><span style={fieldValue}><span className={`badge ${doctor.isActive ? 'badge-success' : 'badge-error'}`}>{doctor.isActive ? 'Actif' : 'Inactif'}</span></span></div>
        <div style={fieldRow}><span style={fieldLabel}>Inscrit le</span><span style={fieldValue}>{new Date(doctor.createdAt).toLocaleDateString('fr-FR')}</span></div>
        <div style={fieldRow}><span style={fieldLabel}>Patients</span><span style={fieldValue}>{doctor.patientsCount}</span></div>
        <div style={fieldRow}><span style={fieldLabel}>Rendez-vous</span><span style={fieldValue}>{doctor.appointmentsCount}</span></div>
        <div style={fieldRow}><span style={fieldLabel}>Secrétaires</span><span style={fieldValue}>{doctor.secretariesCount}</span></div>
      </div>
      {doctor.secretaries?.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <strong style={{ fontSize: 13, color: '#666' }}>Secrétaires rattachées :</strong>
          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {doctor.secretaries.map((s: any) => (
              <div key={s.id} style={{ fontSize: 13, padding: '4px 8px', background: '#f9f9f9', borderRadius: 6, display: 'flex', gap: 12 }}>
                <span style={{ fontWeight: 500 }}>{s.firstName} {s.lastName}</span>
                <span style={{ color: '#666' }}>{s.email}</span>
                <span className={`badge ${s.isActive ? 'badge-success' : 'badge-error'}`} style={{ fontSize: 11 }}>
                  {s.isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);

const SecretaryModal = ({ secretary, doctorName, onClose }: { secretary: any; doctorName: string; onClose: () => void }) => (
  <div style={modalOverlay} onClick={onClose}>
    <div style={modalBox} onClick={e => e.stopPropagation()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{secretary.firstName} {secretary.lastName}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#999' }}>×</button>
      </div>
      <div>
        <div style={fieldRow}><span style={fieldLabel}>Email</span><span style={fieldValue}>{secretary.email}</span></div>
        <div style={fieldRow}><span style={fieldLabel}>Téléphone</span><span style={fieldValue}>{secretary.phone || '-'}</span></div>
        <div style={fieldRow}><span style={fieldLabel}>Médecin rattaché</span><span style={fieldValue}>{doctorName}</span></div>
        <div style={fieldRow}><span style={fieldLabel}>Statut</span><span style={fieldValue}><span className={`badge ${secretary.isActive ? 'badge-success' : 'badge-error'}`}>{secretary.isActive ? 'Actif' : 'Inactif'}</span></span></div>
      </div>
    </div>
  </div>
);

const SuperadminDoctors: React.FC = () => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', phone: '', licenseNumber: '', specialization: '', clinicName: '' });
  const [msg, setMsg] = useState<{type:string;text:string}|null>(null);
  const [detailDoctor, setDetailDoctor] = useState<any>(null);
  const [detailSecretary, setDetailSecretary] = useState<{secretary: any; doctorName: string} | null>(null);

  const load = () => {
    setLoading(true);
    superadminAPI.getDoctors().then(r => setDoctors(r.data.data)).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      await superadminAPI.createDoctor(form);
      setMsg({ type: 'ok', text: 'Médecin créé' });
      setForm({ email: '', password: '', firstName: '', lastName: '', phone: '', licenseNumber: '', specialization: '', clinicName: '' });
      setShowForm(false);
      load();
    } catch (err: any) { setMsg({ type: 'err', text: err.response?.data?.error || 'Erreur' }); }
  };

  const handleResetPassword = async (id: string) => {
    if (!window.confirm('Réinitialiser le mot de passe ?')) return;
    try {
      const r = await superadminAPI.resetDoctorPassword(id);
      alert(`Nouveau mot de passe: ${r.data.data.tempPassword}`);
    } catch { alert('Erreur'); }
  };

  const toggleStatus = async (id: string, current: boolean) => {
    try {
      await superadminAPI.updateDoctor(id, { isActive: !current });
      load();
    } catch { alert('Erreur'); }
  };

  const handleResetSecretaryPassword = async (id: string) => {
    if (!window.confirm('Réinitialiser le mot de passe de cette secrétaire ?')) return;
    try {
      const r = await superadminAPI.resetSecretaryPassword(id);
      alert(`Nouveau mot de passe: ${r.data.data.tempPassword}`);
    } catch { alert('Erreur'); }
  };

  const toggleSecretaryStatus = async (id: string) => {
    try {
      await superadminAPI.toggleSecretaryStatus(id);
      load();
    } catch { alert('Erreur'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>Gestion des Médecins</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '+ Nouveau médecin'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Créer un médecin</h3>
          {msg && <div className={`alert ${msg.type === 'ok' ? 'badge-success' : 'alert-error'}`} style={{ padding: 8, borderRadius: 6, marginBottom: 12, fontSize: 13 }}>{msg.text}</div>}
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 600 }}>
            <div><label className="form-label">Email *</label><input className="form-control" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
            <div><label className="form-label">Mot de passe *</label><input className="form-control" required type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} /></div>
            <div><label className="form-label">Prénom *</label><input className="form-control" required value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} /></div>
            <div><label className="form-label">Nom *</label><input className="form-control" required value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} /></div>
            <div><label className="form-label">Téléphone</label><input className="form-control" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
            <div><label className="form-label">RPPS</label><input className="form-control" value={form.licenseNumber} onChange={e => setForm({...form, licenseNumber: e.target.value})} /></div>
            <div><label className="form-label">Spécialité</label><input className="form-control" value={form.specialization} onChange={e => setForm({...form, specialization: e.target.value})} /></div>
            <div><label className="form-label">Cabinet</label><input className="form-control" value={form.clinicName} onChange={e => setForm({...form, clinicName: e.target.value})} /></div>
            <div style={{ gridColumn: '1 / -1' }}><button type="submit" className="btn btn-primary btn-sm">Créer</button></div>
          </form>
        </div>
      )}

      {loading ? <p>Chargement...</p> : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ borderBottom: '2px solid #e0e0e0', textAlign: 'left', background: '#f9f9f9' }}>
              <th style={{ padding: 10, width: 28 }}></th><th style={{ padding: 10 }}>Nom</th><th style={{ padding: 10 }}>Email</th><th style={{ padding: 10 }}>Spécialité</th>
              <th style={{ padding: 10 }}>Patients</th><th style={{ padding: 10 }}>RDV</th><th style={{ padding: 10 }}>Secrétaires</th><th style={{ padding: 10 }}>Statut</th><th style={{ padding: 10 }}>Actions</th>
            </tr></thead>
            <tbody>
              {doctors.map((d: any) => (
                <>
                  <tr key={d.id} style={{ borderBottom: '1px solid #eee', cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}>
                    <td style={{ padding: 10, textAlign: 'center' }}>{expandedId === d.id ? '▼' : '▶'}</td>
                    <td style={{ padding: 10, fontWeight: 500 }}>{d.firstName} {d.lastName}</td>
                    <td style={{ padding: 10 }}>{d.email}</td>
                    <td style={{ padding: 10 }}>{d.specialization || '-'}</td>
                    <td style={{ padding: 10 }}>{d.patientsCount}</td>
                    <td style={{ padding: 10 }}>{d.appointmentsCount}</td>
                    <td style={{ padding: 10 }}>{d.secretariesCount}</td>
                    <td style={{ padding: 10 }}>
                      <span className={`badge ${d.isActive ? 'badge-success' : 'badge-error'}`}>
                        {d.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td style={{ padding: 10 }}>
                      <button className="btn btn-outline btn-sm" style={{ marginRight: 4 }} onClick={e => { e.stopPropagation(); setDetailDoctor(d); }}>Voir</button>
                      <button className="btn btn-outline btn-sm" style={{ marginRight: 4 }} onClick={e => { e.stopPropagation(); handleResetPassword(d.id); }}>Reset MDP</button>
                      <button className="btn btn-outline btn-sm" onClick={e => { e.stopPropagation(); toggleStatus(d.id, d.isActive); }}>
                        {d.isActive ? 'Désactiver' : 'Activer'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === d.id && (
                    <tr key={`${d.id}-sec`}>
                      <td colSpan={9} style={{ padding: '0 10px 12px 38px', background: '#fafafa' }}>
                        <strong style={{ fontSize: 12, color: '#666' }}>Secrétaires rattachées :</strong>
                        {d.secretaries?.length > 0 ? (
                          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {d.secretaries.map((s: any) => (
                              <div key={s.id} style={{ fontSize: 13, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 500 }}>{s.firstName} {s.lastName}</span>
                                <span style={{ color: '#666' }}>{s.email}</span>
                                {s.phone && <span style={{ color: '#999' }}>{s.phone}</span>}
                                <span className={`badge ${s.isActive ? 'badge-success' : 'badge-error'}`}>
                                  {s.isActive ? 'Actif' : 'Inactif'}
                                </span>
                                <button className="btn btn-outline btn-sm" style={{ fontSize: 11 }} onClick={() => setDetailSecretary({ secretary: s, doctorName: `${d.firstName} ${d.lastName}` })}>Voir</button>
                                <button className="btn btn-outline btn-sm" style={{ fontSize: 11 }} onClick={() => handleResetSecretaryPassword(s.id)}>Reset MDP</button>
                                <button className="btn btn-outline btn-sm" style={{ fontSize: 11 }} onClick={() => toggleSecretaryStatus(s.id)}>
                                  {s.isActive ? 'Désactiver' : 'Activer'}
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ fontSize: 12, color: '#999', margin: '4px 0' }}>Aucune secrétaire</p>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {doctors.length === 0 && (
                <tr><td colSpan={9} style={{ padding: 30, textAlign: 'center', color: '#999' }}>Aucun médecin</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {detailDoctor && <DoctorModal doctor={detailDoctor} onClose={() => setDetailDoctor(null)} />}
      {detailSecretary && <SecretaryModal secretary={detailSecretary.secretary} doctorName={detailSecretary.doctorName} onClose={() => setDetailSecretary(null)} />}
    </div>
  );
};

export default SuperadminDoctors;
