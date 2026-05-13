import React, { useState, useEffect } from 'react';
import { doctorAPI } from '../../services/api';

const emptyForm = () => ({
  date: new Date().toISOString().slice(0, 16),
  weight: '', height: '', heartRate: '', bloodPressure: '', temperature: '',
  generalState: 'Bon etat general', conjonctives: 'Rosees', oedemes: 'Absents',
  cardiacAuscultation: 'Rythme', pulmonaryAuscultation: 'Murmure vesiculaire normal',
  abdomen: 'Souple', uterusState: 'Non gravide', uterineHeight: '',
  presentation: 'Cephalique', bcf: 'POSITIFS', adnexa: 'Libres et indolores',
  cervixAspect: 'Aspect normal', vaginalDischarge: 'Leucorrhees physiologiques',
  dilatation: 'Col ferme', effacement: 'Non efface', consistency: 'Ferme', presentationHeight: '-3 (mobile)',
  breastExam: 'Seins symetriques', clinicalConclusion: '', notes: '',
});

const ClinicalExamTab: React.FC<{ patientId: string; patientName: string }> = ({ patientId, patientName }) => {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    doctorAPI.getClinicalExams({ patientId }).then(r => setExams(r.data.data.exams || [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [patientId]);

  const openModal = () => { setForm(emptyForm()); setShowModal(true); };
  const upd = (p: any) => setForm(prev => ({ ...prev, ...p }));

  const imc = (() => {
    const w = parseFloat(form.weight); const h = parseFloat(form.height) / 100;
    return w > 0 && h > 0 ? (w / (h * h)).toFixed(1) : '';
  })();

  const handleSave = async () => {
    setSaving(true);
    try {
      await (doctorAPI as any).createClinicalExam({ patientId, ...form });
      load(); setShowModal(false);
    } catch (err: any) { alert(err.response?.data?.error || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try { await (doctorAPI as any).deleteClinicalExam(id); load(); setConfirmDelete(null); }
    catch { alert('Erreur'); }
  };

  const section = (title: string, icon: string, rows: [string, string][]) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#1a5c4a', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>{icon}</span>{title}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {rows.map(([label, value]) => (
          <div key={label}>
            <label style={{ fontSize: 10, fontWeight: 600, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
            <div style={{ fontSize: 13, marginTop: 2 }}>{value || '—'}</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p className="text-muted text-sm">{exams.length} examen(s) clinique(s)</p>
        <button className="btn btn-primary btn-sm" onClick={openModal}>+ Nouvel examen</button>
      </div>

      {!exams.length ? (
        <div className="card"><div className="empty-state"><div className="empty-icon">🩺</div><p>Aucun examen clinique</p></div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {exams.map((ex: any) => {
            const isExpanded = expandedId === ex.id;
            const calcImc = ex.weight && ex.height ? (ex.weight / ((ex.height / 100) ** 2)).toFixed(1) : null;
            return (
              <div className="card" key={ex.id}>
                <div className="card-header" style={{ cursor: 'pointer' }} onClick={() => setExpandedId(isExpanded ? null : ex.id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>🩺</span>
                    <div>
                      <span style={{ fontWeight: 500 }}>{new Date(ex.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      {ex.generalState && <span className="badge badge-success" style={{ marginLeft: 8 }}>{ex.generalState}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button className="btn btn-outline btn-sm" style={{ color: '#e74c3c', borderColor: '#f5c6c3' }} onClick={e => { e.stopPropagation(); setConfirmDelete(ex.id); }}>Supprimer</button>
                    <span style={{ fontSize: 12, color: '#999' }}>{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>
                {isExpanded && (
                  <div style={{ paddingTop: 12, borderTop: '1px solid #e9ecef' }}>
                    {section('Donnees generales', '📊', [
                      ['TA (mmHg)', ex.bloodPressure || '—'],
                      ['Poids (kg)', ex.weight ? ex.weight + ' kg' : '—'],
                      ['Pouls (bpm)', ex.heartRate || '—'],
                      ['Taille (cm)', ex.height ? ex.height + ' cm' : '—'],
                      ['Temp. (C)', ex.temperature ? ex.temperature + ' C' : '—'],
                      ['IMC', calcImc || '—'],
                    ])}
                    {section('Examen general', '🩺', [
                      ['Etat general', ex.generalState || '—'],
                      ['Conjonctives', ex.conjonctives || '—'],
                      ['Oedemes', ex.oedemes || '—'],
                    ])}
                    {section('Examen cardio-respiratoire', '❤️', [
                      ['Auscultation cardiaque', ex.cardiacAuscultation || '—'],
                      ['Auscultation pulmonaire', ex.pulmonaryAuscultation || '—'],
                    ])}
                    {section('Examen abdomino-pelvien', '🫁', [
                      ['Abdomen', ex.abdomen || '—'],
                      ['Uterus', ex.uterusState || '—'],
                      ['Hauteur uterine (cm)', ex.uterineHeight || '—'],
                      ['Presentation', ex.presentation || '—'],
                      ['BCF', ex.bcf || '—'],
                      ['Annexes', ex.adnexa || '—'],
                    ])}
                    {section('Examen au speculum', '🔬', [
                      ['Col uterin', ex.cervixAspect || '—'],
                      ['Vagin / Pertes', ex.vaginalDischarge || '—'],
                      ['Dilatation', ex.dilatation || '—'],
                      ['Effacement', ex.effacement || '—'],
                      ['Consistance', ex.consistency || '—'],
                      ['Hauteur presentation', ex.presentationHeight || '—'],
                    ])}
                    {section('Examen des seins', '🤱', [
                      ['Inspection / Palpation', ex.breastExam || '—'],
                    ])}
                    {(ex.clinicalConclusion || ex.notes) && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a5c4a', marginBottom: 6 }}>📝 Conclusion</div>
                        {ex.clinicalConclusion && <div style={{ padding: 10, background: '#f0faf6', borderRadius: 6, fontSize: 13, marginBottom: 8, whiteSpace: 'pre-wrap' }}>{ex.clinicalConclusion}</div>}
                        {ex.notes && <div style={{ fontSize: 12, color: '#666' }}>Notes : {ex.notes}</div>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Creation */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 820, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <span className="modal-title">Examen clinique — {patientName}</span>
              <button className="btn-close" onClick={() => setShowModal(false)}>x</button>
            </div>
            <div className="modal-body" style={{ overflowY: 'auto' }}>
              {/* Donnees generales */}
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a5c4a', marginBottom: 8 }}>📊 Donnees generales</div>
              <div className="form-grid-3">
                <div className="form-group"><label className="form-label">Date</label><input className="form-control" type="datetime-local" value={form.date} onChange={e => upd({ date: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Poids (kg)</label><input className="form-control" type="number" step="0.1" value={form.weight} onChange={e => upd({ weight: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Taille (cm)</label><input className="form-control" type="number" value={form.height} onChange={e => upd({ height: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">TA (mmHg)</label><input className="form-control" placeholder="120/80" value={form.bloodPressure} onChange={e => upd({ bloodPressure: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Pouls (bpm)</label><input className="form-control" value={form.heartRate} onChange={e => upd({ heartRate: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Temp. (C)</label><input className="form-control" type="number" step="0.1" value={form.temperature} onChange={e => upd({ temperature: e.target.value })} /></div>
              </div>
              {imc && <div style={{ fontSize: 12, color: '#27ae60', marginBottom: 12 }}>IMC calcule : <strong>{imc}</strong></div>}

              {/* Examen general */}
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a5c4a', margin: '16px 0 8px' }}>🩺 Examen general</div>
              <div className="form-grid-3">
                <div className="form-group"><label className="form-label">Etat general</label><input className="form-control" value={form.generalState} onChange={e => upd({ generalState: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Conjonctives</label><input className="form-control" value={form.conjonctives} onChange={e => upd({ conjonctives: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Oedemes</label><input className="form-control" value={form.oedemes} onChange={e => upd({ oedemes: e.target.value })} /></div>
              </div>

              {/* Cardio-respiratoire */}
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a5c4a', margin: '16px 0 8px' }}>❤️ Examen cardio-respiratoire</div>
              <div className="form-grid-2">
                <div className="form-group"><label className="form-label">Auscultation cardiaque</label><input className="form-control" value={form.cardiacAuscultation} onChange={e => upd({ cardiacAuscultation: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Auscultation pulmonaire</label><input className="form-control" value={form.pulmonaryAuscultation} onChange={e => upd({ pulmonaryAuscultation: e.target.value })} /></div>
              </div>

              {/* Abdomino-pelvien */}
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a5c4a', margin: '16px 0 8px' }}>🫁 Examen abdomino-pelvien</div>
              <div className="form-grid-3">
                <div className="form-group"><label className="form-label">Abdomen</label><input className="form-control" value={form.abdomen} onChange={e => upd({ abdomen: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Etat uterin</label><input className="form-control" value={form.uterusState} onChange={e => upd({ uterusState: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Hauteur uterine (cm)</label><input className="form-control" type="number" step="0.1" value={form.uterineHeight} onChange={e => upd({ uterineHeight: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Presentation</label><input className="form-control" value={form.presentation} onChange={e => upd({ presentation: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">BCF</label><input className="form-control" value={form.bcf} onChange={e => upd({ bcf: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Annexes</label><input className="form-control" value={form.adnexa} onChange={e => upd({ adnexa: e.target.value })} /></div>
              </div>

              {/* Examen au speculum */}
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a5c4a', margin: '16px 0 8px' }}>🔬 Examen au speculum / Toucher vaginal</div>
              <div className="form-grid-3">
                <div className="form-group"><label className="form-label">Col uterin</label><input className="form-control" value={form.cervixAspect} onChange={e => upd({ cervixAspect: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Vagin / Pertes</label><input className="form-control" value={form.vaginalDischarge} onChange={e => upd({ vaginalDischarge: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Dilatation</label><input className="form-control" value={form.dilatation} onChange={e => upd({ dilatation: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Effacement</label><input className="form-control" value={form.effacement} onChange={e => upd({ effacement: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Consistance</label><input className="form-control" value={form.consistency} onChange={e => upd({ consistency: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Hauteur presentation</label><input className="form-control" value={form.presentationHeight} onChange={e => upd({ presentationHeight: e.target.value })} /></div>
              </div>

              {/* Seins */}
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a5c4a', margin: '16px 0 8px' }}>🤱 Examen des seins</div>
              <div className="form-grid-2">
                <div className="form-group"><label className="form-label">Inspection / Palpation</label><input className="form-control" value={form.breastExam} onChange={e => upd({ breastExam: e.target.value })} /></div>
              </div>

              {/* Conclusion */}
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a5c4a', margin: '16px 0 8px' }}>📝 Conclusion</div>
              <div className="form-group"><label className="form-label">Resume semiologique</label><textarea className="form-control" rows={4} value={form.clinicalConclusion} onChange={e => upd({ clinicalConclusion: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Notes</label><textarea className="form-control" rows={2} value={form.notes} onChange={e => upd({ notes: e.target.value })} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <p>Supprimer cet examen clinique ?</p>
            <div className="confirm-actions">
              <button className="btn btn-outline" onClick={() => setConfirmDelete(null)}>Non</button>
              <button className="btn btn-primary" style={{ background: 'var(--danger)' }} onClick={() => handleDelete(confirmDelete)}>Oui, supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ClinicalExamTab;
