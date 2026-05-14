import React, { useState, useEffect } from 'react';
import { doctorAPI } from '../../services/api';
import Alert from '../../components/shared/Alert';
import ConfirmDialog from '../../components/shared/ConfirmDialog';

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
  generalStateOther: '',
  conjonctivesOther: '',
  oedemesOther: '',
  cardiacOther: '',
  pulmonaryOther: '',
  abdomenOther: '',
  uterusOther: '',
  presentationOther: '',
  bcfOther: '',
  adnexaOther: '',
  cervixOther: '',
  vaginalOther: '',
  dilatationOther: '',
  effacementOther: '',
  consistencyOther: '',
  heightOther: '',
  breastOther: '',
});


const OptionSelector: React.FC<{
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; otherKey: string; otherValue: string; onOtherChange: (v: string) => void;
}> = ({ label, value, onChange, options, otherKey, otherValue, onOtherChange }) => {
  const isOther = value === 'Autre' || !options.includes(value);
  return (
    <div style={{ gridColumn: 'span 3' }}>
      <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {options.map(opt => (
          <button key={opt} type="button" onClick={() => onChange(opt)}
            style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
              border: value === opt ? '2px solid #1a5c4a' : '1px solid #ddd',
              background: value === opt ? '#1a5c4a' : '#fff',
              color: value === opt ? '#fff' : '#333', fontWeight: value === opt ? 600 : 400,
            }}>{opt}</button>
        ))}
        <button type="button" onClick={() => onChange('Autre')}
          style={{
            padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
            border: isOther ? '2px solid #1a5c4a' : '1px solid #ddd',
            background: isOther ? '#1a5c4a' : '#fff',
            color: isOther ? '#fff' : '#333', fontWeight: isOther ? 600 : 400,
          }}>Autre</button>
      </div>
      {isOther && (
        <input className="form-control" style={{ marginTop: 6, fontSize: 12 }}
          placeholder="Precisez..." value={otherValue} onChange={e => onOtherChange(e.target.value)} />
      )}
    </div>
  );
};

const ClinicalExamTab: React.FC<{ patientId: string; patientName: string; doctorProfile?: any; API_BASE?: string }> = ({ patientId, patientName, doctorProfile, API_BASE }) => {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(emptyForm());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string|null>(null);
  const [alertMsg, setAlertMsg] = useState<{type:string;text:string}|null>(null);

  const load = () => {
    setLoading(true);
    doctorAPI.getClinicalExams({ patientId }).then(r => setExams(r.data.data || [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [patientId]);

  const openModal = () => { setForm(emptyForm()); setShowModal(true); };
  const handleEdit = (ex: any) => { setForm({ ...emptyForm(), ...ex }); setShowModal(true); };
  const upd = (p: any) => setForm((prev: any) => ({ ...prev, ...p }));

  const imc = (() => {
    const w = parseFloat(form.weight); const h = parseFloat(form.height) / 100;
    return w > 0 && h > 0 ? (w / (h * h)).toFixed(1) : '';
  })();

  const handleSave = async () => {
    setSaving(true);
    try {
      await (doctorAPI as any).createClinicalExam({ patientId, ...form });
      load(); setShowModal(false);
    } catch (err: any) { setAlertMsg({ type: 'error', text: err.response?.data?.error || 'Erreur' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try { await (doctorAPI as any).deleteClinicalExam(id); load(); setConfirmDeleteId(null); }
    catch { setAlertMsg({ type: 'error', text: 'Erreur' }); }
  };


  const PRINT_CSS = `
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 210mm; height: auto; overflow: hidden; }
    body { font-family: Arial, Helvetica, sans-serif; color: #1a1a2e; padding: 12mm 15mm; background: white; }
    @media print { html, body { width: 100%; height: auto; overflow: hidden; } body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
    .rx-header { display: flex; align-items: flex-start; gap: 16px; padding-bottom: 12px; border-bottom: 3px solid #1a5c4a; margin-bottom: 12px; }
    .rx-info { flex: 1; }
    .rx-info h2 { font-size: 16px; font-weight: 700; color: #1a5c4a; margin: 0; }
    .rx-clinic-name { font-size: 11px; color: #1a5c4a; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; margin-bottom: 1px; }
    .rx-specialty { font-size: 12px; color: #333; margin: 1px 0; }
    .rx-services { font-size: 11px; color: #888; font-style: italic; margin: 1px 0; }
    .rx-contact { font-size: 11px; color: #777; margin-top: 2px; }
    .rx-title { text-align: center; font-size: 18px; font-weight: 700; color: #1a5c4a; text-transform: uppercase; letter-spacing: 2px; margin: 14px 0 12px 0; padding: 8px 0; border: 2px solid #1a5c4a; border-radius: 6px; background: #f0faf6; }
    .rx-patient { display: flex; justify-content: space-between; padding: 10px 14px; background: #f8f9fa; border-radius: 6px; margin-bottom: 14px; font-size: 13px; }
    .rx-patient strong { color: #1a5c4a; }
    .rx-date-place { margin-bottom: 12px; font-size: 12px; color: #555; }
    .exam-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    .exam-table thead th { background: #1a5c4a; color: white; padding: 7px 10px; font-size: 11px; text-transform: uppercase; text-align: left; }
    .exam-table thead th:first-child { border-radius: 6px 0 0 0; }
    .exam-table thead th:last-child { border-radius: 0 6px 0 0; }
    .exam-table tbody td { padding: 6px 10px; font-size: 12px; border-bottom: 1px solid #e8eaed; }
    .exam-table tbody tr:nth-child(even) { background: #f8faf9; }
    .exam-section { margin: 10px 0; }
    .exam-section-title { font-size: 13px; font-weight: 700; color: #1a5c4a; margin: 10px 0 4px; padding: 4px 10px; background: #f0faf6; border-radius: 4px; border-left: 3px solid #1a5c4a; }
    .rx-footer { margin-top: 24px; padding-top: 12px; border-top: 3px solid #1a5c4a; }
    .rx-sig-line { width: 200px; border-top: 1px solid #999; margin: 50px auto 0; padding-top: 6px; font-size: 11px; color: #555; text-align: center; }
  `;

  const printInIframe = (htmlContent: string) => {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;border:none;opacity:0;pointer-events:none;z-index:-1;';
      document.body.appendChild(iframe);
      const doc = iframe.contentDocument || (iframe.contentWindow as any)?.document;
      if (!doc) { document.body.removeChild(iframe); return; }
      doc.open();
      doc.write('<!DOCTYPE html><html><head><style>' + PRINT_CSS + '</style></head><body style="background:white;">' + htmlContent + '</body></html>');
      doc.close();
      setTimeout(() => { try { (iframe.contentWindow as any)?.focus(); (iframe.contentWindow as any)?.print(); } catch(e) {} }, 800);
      const cleanup = () => { try { document.body.removeChild(iframe); } catch {} window.removeEventListener('afterprint', cleanup); };
      window.addEventListener('afterprint', cleanup);
      setTimeout(cleanup, 60000);
    } catch(e) {}
  };

  const handlePrint = async (ex: any) => {
    try {
      const dp = doctorProfile || {};
      const logoUrl = dp.logo && API_BASE ? (API_BASE.replace('/api','') + dp.logo) : '';
      let logoHtml = '';
      if (logoUrl) {
        try {
          const imgRes = await fetch(logoUrl);
          const blob = await imgRes.blob();
          logoHtml = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve('<img style="width:64px;height:64px;border-radius:50%;object-fit:contain;border:2px solid #1a5c4a;" src="' + reader.result + '" />');
            reader.readAsDataURL(blob);
          });
        } catch { logoHtml = ''; }
      }
      const calcImc = ex.weight && ex.height ? (ex.weight / ((ex.height / 100) ** 2)).toFixed(1) : null;
      const d = ex.date ? new Date(ex.date).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '';
      const dt = ex.date ? new Date(ex.date) : new Date();

      const sec = (title: string, rows: string) => {
        if (!rows) return '';
        return '<div class="exam-section"><div class="exam-section-title">' + title + '</div><table class="exam-table"><tbody>' + rows + '</tbody></table></div>';
      };
      const row = (label: string, val: any) => val ? '<tr><td style="font-weight:600;color:#1a5c4a;width:45%;padding:5px 10px;">' + label + '</td><td style="padding:5px 10px;">' + val + '</td></tr>' : '';

      const html = '<div>' +
        '<div class="rx-header">' + logoHtml +
        '<div class="rx-info">' +
        '<div class="rx-clinic-name">' + (dp.clinicName||'') + '</div>' +
        '<h2>Dr ' + (dp.lastName||'') + ' ' + (dp.firstName||'') + '</h2>' +
        '<div class="rx-specialty">' + (dp.specialization||'Gynecologie-Obstetrique') + '</div>' +
        '<div class="rx-services">' + (dp.services||'') + '</div>' +
        '<div class="rx-contact">' + (dp.phone||'') + (dp.email?' | ':'') + (dp.email||'') + '</div>' +
        '</div></div>' +
        '<div class="rx-title">Examen Clinique</div>' +
        '<div class="rx-patient"><div><strong>Patiente :</strong> ' + patientName + '</div><div><strong>Date :</strong> ' + d + '</div></div>' +
        '<div class="rx-date-place">Fait a ' + (dp.city||'') + ', le ' + d + '</div>' +
        sec('Constantes', row('Poids', ex.weight ? ex.weight+' kg' : '') + row('Taille', ex.height ? ex.height+' cm' : '') + row('IMC', calcImc ? calcImc+' kg/m2' : '') + row('TA', ex.bloodPressure) + row('Pouls', ex.heartRate ? ex.heartRate+' bpm' : '') + row('Temperature', ex.temperature ? ex.temperature+' C' : '')) +
        sec('Examen general', row('Etat general', ex.generalState) + row('Conjonctives', ex.conjonctives) + row('Oedemes', ex.oedemes)) +
        sec('Cardio-respiratoire', row('Auscultation cardiaque', ex.cardiacAuscultation) + row('Auscultation pulmonaire', ex.pulmonaryAuscultation)) +
        sec('Abdomino-pelvien', row('Abdomen', ex.abdomen) + row('Uterus', ex.uterusState) + row('Hauteur uterine', ex.uterineHeight ? ex.uterineHeight+' cm' : '') + row('Presentation', ex.presentation) + row('BCF', ex.bcf) + row('Annexes', ex.adnexa)) +
        sec('Examen au speculum / Toucher vaginal', row('Col uterin', ex.cervixAspect) + row('Vagin / Pertes', ex.vaginalDischarge) + row('Dilatation', ex.dilatation) + row('Effacement', ex.effacement) + row('Consistance', ex.consistency) + row('Hauteur presentation', ex.presentationHeight)) +
        sec('Examen des seins', row('Inspection / Palpation', ex.breastExam)) +
        (ex.clinicalConclusion ? '<div style="margin:10px 0;padding:10px 14px;background:#fef9ef;border-left:4px solid #e67e22;border-radius:0 6px 6px 0;font-size:12px;"><strong>Conclusion :</strong> ' + ex.clinicalConclusion + '</div>' : '') +
        (ex.notes ? '<div style="margin:8px 0;font-size:11px;color:#666;"><em>Notes : ' + ex.notes + '</em></div>' : '') +
        '<div class="rx-footer"><div class="rx-sig-line">Signature et cachet du medecin</div></div></div>';
      printInIframe(html);
    } catch(e) { console.error('Print error:', e); }
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
                      <span style={{ fontWeight: 500 }}>{new Date(ex.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      {ex.generalState && <span className="badge badge-success" style={{ marginLeft: 8 }}>{ex.generalState}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button className="btn btn-outline btn-sm" onClick={e => { e.stopPropagation(); handleEdit(ex); }}>Modifier</button>
                      <button className="btn btn-outline btn-sm" onClick={e => { e.stopPropagation(); handlePrint(ex); }}>Imprimer</button>
                      <button className="btn btn-outline btn-sm" style={{ color: '#e74c3c', borderColor: '#f5c6c3' }} onClick={e => { e.stopPropagation(); setConfirmDeleteId(ex.id); }}>Supprimer</button>
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
                <OptionSelector label="Etat general" value={form.generalState} onChange={v => upd({ generalState: v })}
                  options={['Bon etat general', 'Altere', 'Astenie', 'Paleur cutaneo-muqueuse', 'Ictere', 'Fievre']}
                  otherKey="generalStateOther" otherValue={form.generalStateOther || ''} onOtherChange={v => upd({ generalStateOther: v })} />
                <OptionSelector label="Conjonctives" value={form.conjonctives} onChange={v => upd({ conjonctives: v })}
                  options={['Rosees', 'Pales', 'Icteriques']}
                  otherKey="conjonctivesOther" otherValue={form.conjonctivesOther || ''} onOtherChange={v => upd({ conjonctivesOther: v })} />
                <OptionSelector label="Oedemes" value={form.oedemes} onChange={v => upd({ oedemes: v })}
                  options={['Absents', 'Membres inf.', 'Generalises', 'Prenant le godet']}
                  otherKey="oedemesOther" otherValue={form.oedemesOther || ''} onOtherChange={v => upd({ oedemesOther: v })} />
              </div>

              {/* Cardio-respiratoire */}
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a5c4a', margin: '16px 0 8px' }}>heart Examen cardio-respiratoire</div>
              <div className="form-grid-3">
                <OptionSelector label="Auscultation cardiaque" value={form.cardiacAuscultation} onChange={v => upd({ cardiacAuscultation: v })}
                  options={['Rythme', 'Regulier', 'Souffle systolique', 'Arythmie', 'Tachycardie', 'Bradycardie']}
                  otherKey="cardiacOther" otherValue={form.cardiacOther || ''} onOtherChange={v => upd({ cardiacOther: v })} />
                <OptionSelector label="Auscultation pulmonaire" value={form.pulmonaryAuscultation} onChange={v => upd({ pulmonaryAuscultation: v })}
                  options={['Murmure vesiculaire normal', 'Rates crepitants', 'Sibilants', 'Silence aerique']}
                  otherKey="pulmonaryOther" otherValue={form.pulmonaryOther || ''} onOtherChange={v => upd({ pulmonaryOther: v })} />
              </div>

              {/* Abdomino-pelvien */}
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a5c4a', margin: '16px 0 8px' }}>baby Examen abdomino-pelvien</div>
              <div className="form-grid-3">
                <OptionSelector label="Abdomen" value={form.abdomen} onChange={v => upd({ abdomen: v })}
                  options={['Souple', 'Sensible', 'Douloureux', 'Defense', 'Contracture', 'Masse palpable', 'Cicatrice Pfannenstiel']}
                  otherKey="abdomenOther" otherValue={form.abdomenOther || ''} onOtherChange={v => upd({ abdomenOther: v })} />
                <OptionSelector label="Uterus" value={form.uterusState} onChange={v => upd({ uterusState: v })}
                  options={['Gravide', 'Non gravide', 'Augmente de volume', 'Regulier', 'Irregulier (fibromes)', 'Douloureux a la mobilisation']}
                  otherKey="uterusOther" otherValue={form.uterusOther || ''} onOtherChange={v => upd({ uterusOther: v })} />
                <div className="form-group"><label className="form-label">Hauteur uterine (cm)</label><input className="form-control" type="number" step="0.1" value={form.uterineHeight} onChange={e => upd({ uterineHeight: e.target.value })} /></div>
                <OptionSelector label="Presentation" value={form.presentation} onChange={v => upd({ presentation: v })}
                  options={['Cephalique', 'Siege', 'Transverse', 'Non precisee']}
                  otherKey="presentationOther" otherValue={form.presentationOther || ''} onOtherChange={v => upd({ presentationOther: v })} />
                <OptionSelector label="BCF" value={form.bcf} onChange={v => upd({ bcf: v })}
                  options={['Positif', 'Negatif']}
                  otherKey="bcfOther" otherValue={form.bcfOther || ''} onOtherChange={v => upd({ bcfOther: v })} />
                <OptionSelector label="Annexes" value={form.adnexa} onChange={v => upd({ adnexa: v })}
                  options={['Libres et indolores', 'Masse latero-uterine droite', 'Masse latero-uterine gauche', 'Douleur a la palpation']}
                  otherKey="adnexaOther" otherValue={form.adnexaOther || ''} onOtherChange={v => upd({ adnexaOther: v })} />
              </div>


              {/* Examen au speculum / Toucher vaginal */}
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a5c4a', margin: '16px 0 8px' }}>Examen au speculum / Toucher vaginal</div>
              <div className="form-grid-3">
                <OptionSelector label="Col uterin" value={form.cervixAspect} onChange={v => upd({ cervixAspect: v })}
                  options={['Aspect normal', 'Ectropion', 'Polype cervical', 'Lesion suspecte', 'Beant', 'Ferme', 'Saignement au contact']}
                  otherKey="cervixOther" otherValue={form.cervixOther || ''} onOtherChange={v => upd({ cervixOther: v })} />
                <OptionSelector label="Vagin / Pertes" value={form.vaginalDischarge} onChange={v => upd({ vaginalDischarge: v })}
                  options={['Leucorrhees physiologiques', 'Leucorrhees abondantes', 'Leucorrhees purulentes', 'Metrorragies actives', 'Liquide amniotique', 'Pas de pertes']}
                  otherKey="vaginalOther" otherValue={form.vaginalOther || ''} onOtherChange={v => upd({ vaginalOther: v })} />
                <OptionSelector label="Dilatation" value={form.dilatation} onChange={v => upd({ dilatation: v })}
                  options={['Col ferme', '1 cm', '2 cm', '3 cm', '4 cm', '5 cm', '6 cm', '7 cm', '8 cm', '9 cm', 'Complete (10 cm)']}
                  otherKey="dilatationOther" otherValue={form.dilatationOther || ''} onOtherChange={v => upd({ dilatationOther: v })} />
                <OptionSelector label="Effacement" value={form.effacement} onChange={v => upd({ effacement: v })}
                  options={['Non efface', '25%', '50%', '75%', 'Efface']}
                  otherKey="effacementOther" otherValue={form.effacementOther || ''} onOtherChange={v => upd({ effacementOther: v })} />
                <OptionSelector label="Consistance" value={form.consistency} onChange={v => upd({ consistency: v })}
                  options={['Ferme', 'Moyenne', 'Molle']}
                  otherKey="consistencyOther" otherValue={form.consistencyOther || ''} onOtherChange={v => upd({ consistencyOther: v })} />
                <OptionSelector label="Hauteur presentation" value={form.presentationHeight} onChange={v => upd({ presentationHeight: v })}
                  options={['-3 (mobile)', '-2', '-1', '0', '+1', '+2']}
                  otherKey="heightOther" otherValue={form.heightOther || ''} onOtherChange={v => upd({ heightOther: v })} />
              </div>

              {/* Seins */}
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a5c4a', margin: '16px 0 8px' }}>Examen des seins</div>
              <div className="form-grid-3">
                <OptionSelector label="Inspection / Palpation" value={form.breastExam} onChange={v => upd({ breastExam: v })}
                  options={['Seins symetriques', 'Seins asymetriques', 'Nodules', 'Galactorrhee']}
                  otherKey="breastOther" otherValue={form.breastOther || ''} onOtherChange={v => upd({ breastOther: v })} />
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

      {confirmDeleteId && (
        <ConfirmDialog
          isOpen={true}
          message="Supprimer cet examen clinique ?"
          confirmLabel="Oui, supprimer"
          confirmDanger={true}
          onConfirm={() => handleDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
      {alertMsg && <Alert type="error" message={alertMsg.text} onClose={() => setAlertMsg(null)} autoClose={4000} />}
    </div>
  );
};
export default ClinicalExamTab;
