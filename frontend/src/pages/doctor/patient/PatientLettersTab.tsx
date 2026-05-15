import React, { useState } from 'react';
import { letterTypeLabels, escapeHtml, fileUrl, printInIframe } from './constants';

interface Props {
  patient: any;
  letters: any[];
  doctorProfile: any;
  onRefreshLetters: () => void;
  onAlert: (msg: { type: 'success' | 'error' | 'warning' | 'info'; text: string } | null) => void;
  onConfirm: (dialog: { message: string; onConfirm: () => void; danger?: boolean } | null) => void;
}

const PatientLettersTab: React.FC<Props> = ({ patient, letters, doctorProfile, onRefreshLetters, onAlert, onConfirm }) => {
  const [letterModal, setLetterModal] = useState(false);
  const [editingLetterId, setEditingLetterId] = useState<string | null>(null);
  const [letterForm, setLetterForm] = useState({ type: 'SPECIALIST_REFERRAL', recipient: '', subject: '', body: '' });

  const openLetterModal = (type: string = 'SPECIALIST_REFERRAL') => {
    setEditingLetterId(null);
    setLetterForm({ type, recipient: '', subject: '', body: '' });
    setLetterModal(true);
  };

  const handleEditLetter = (letter: any) => {
    setEditingLetterId(letter.id);
    const c = letter.content || {};
    setLetterForm({ type: letter.type, recipient: letter.recipient || '', subject: letter.subject || '', body: c.body || '' });
    setLetterModal(true);
  };

  const handleSaveLetter = async () => {
    if (!letterForm.recipient || !letterForm.subject) { onAlert({ type: 'warning', text: "Veuillez remplir le destinataire et l'objet" }); return; }
    try {
      const { doctorAPI } = await import('../../../services/api');
      const data = { patientId: patient.id, type: letterForm.type, recipient: letterForm.recipient, subject: letterForm.subject, content: { body: letterForm.body } };
      if (editingLetterId) { await doctorAPI.updateMedicalLetter(editingLetterId, data); }
      else { await doctorAPI.createMedicalLetter(data); }
      setLetterModal(false);
      onRefreshLetters();
    } catch (e: any) { onAlert({ type: 'error', text: e.response?.data?.error || 'Erreur' }); }
  };

  const handleDeleteLetter = async (letterId: string) => {
    onConfirm({
      message: 'Supprimer ce courrier ?',
      onConfirm: async () => {
        try { const { doctorAPI } = await import('../../../services/api'); await doctorAPI.deleteMedicalLetter(letterId); onRefreshLetters(); } catch {}
      }
    });
  };

  const handlePrintLetter = async (letterId: string) => {
    try {
      const { doctorAPI } = await import('../../../services/api');
      const res = await doctorAPI.getMedicalLetterById(letterId);
      const letter = res.data.data;
      const c = letter.content || {};
      const pName = escapeHtml((patient.user?.firstName||'') + ' ' + (patient.user?.lastName||''));
      const pAge = patient.dateOfBirth ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25*24*60*60*1000)) + ' ans' : '--';
      const fullAddr = escapeHtml([(doctorProfile?.address||''), (doctorProfile?.city||''), (doctorProfile?.postalCode||'')].filter(Boolean).join(', '));
      let logoHtml = '';
      if (doctorProfile?.logo) {
        try {
          const imgUrl = fileUrl(doctorProfile.logo);
          const imgRes = await fetch(imgUrl);
          const blob = await imgRes.blob();
          logoHtml = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve('<img class="rx-doctor-logo" src="' + reader.result + '" />');
            reader.readAsDataURL(blob);
          });
        } catch { logoHtml = ''; }
      }
      const letterTitles: Record<string,string> = {
        SPECIALIST_REFERRAL: "COURRIER D'ORIENTATION SPECIALISTE",
        EMPLOYER: "COURRIER MEDICAL - EMPLOYEUR",
        MEDICAL_REPORT: 'COMPTE RENDU MEDICAL',
        DISCHARGE_SUMMARY: "COMPTE RENDU D'HOSPITALISATION",
        OTHER: 'COURRIER MEDICAL',
      };
      const title = letterTitles[letter.type] || 'COURRIER MEDICAL';
      const fmt = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'}) : '.......................................';
      let bodyHtml = '';
      if (letter.recipient) bodyHtml += '<div class="cert-details"><p><strong>A l\'attention de :</strong> ' + escapeHtml(letter.recipient) + '</p></div>';
      if (letter.subject) bodyHtml += '<div class="cert-details"><p><strong>Objet :</strong> ' + escapeHtml(letter.subject) + '</p></div>';
      if (c.body) bodyHtml += '<div class="cert-observations" style="white-space:pre-wrap;line-height:1.8">' + escapeHtml(c.body) + '</div>';
      const html = '<div>' +
        '<div class="rx-header">' + logoHtml +
        '<div class="rx-info">' +
        '<div class="rx-clinic-name">' + escapeHtml(doctorProfile?.clinicName||'') + '</div>' +
        '<h2>Dr ' + escapeHtml(doctorProfile?.lastName||'') + ' ' + escapeHtml(doctorProfile?.firstName||'') + '</h2>' +
        '<div class="rx-specialty">' + escapeHtml(doctorProfile?.specialization||'Gynecologie-Obstetrique') + '</div>' +
        '<div class="rx-services">' + escapeHtml(doctorProfile?.services||'') + '</div>' +
        '<div class="rx-address">' + fullAddr + '</div>' +
        '<div class="rx-contact">' + escapeHtml(doctorProfile?.phone||'') + (doctorProfile?.email?' . ':'') + escapeHtml(doctorProfile?.email||'') + '</div>' +
        '</div></div>' +
        '<div class="rx-title">' + title + '</div>' +
        '<div class="rx-patient"><div><strong>Patiente :</strong> ' + pName + '</div><div><strong>Age :</strong> ' + pAge + '</div></div>' +
        '<div class="rx-date-place">Fait a ' + escapeHtml(doctorProfile?.city||'Tunis') + ', le ' + fmt(letter.createdAt) + '</div>' +
        '<div class="cert-body">' + bodyHtml + '</div>' +
        '<div class="rx-footer"><div class="rx-signature"><div class="rx-sig-line">Signature et cachet du medecin</div></div></div>' +
        '</div>';
      printInIframe(html);
    } catch { onAlert({ type: 'error', text: 'Erreur lors du chargement' }); }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {Object.entries(letterTypeLabels).map(([k, v]) => (
          <button key={k} className={'btn btn-sm ' + (letterForm.type === k ? 'btn-primary' : 'btn-outline')} onClick={() => openLetterModal(k)} style={{ fontSize: 12 }}>
            + {v}
          </button>
        ))}
      </div>
      {!letters?.length ? (
        <div className="card"><div className="empty-state"><div className="empty-icon">✉️</div><p>Aucun courrier medical</p><p className="text-muted text-sm">Choisissez un type ci-dessus pour en creer un</p></div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {letters.map((letter: any) => (
            <div className="card" key={letter.id} style={{ borderLeft: '3px solid #6f42c1' }}>
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>✉️</span>
                  <span style={{ fontWeight: 500 }}>{letterTypeLabels[letter.type] || letter.type}</span>
                  <span className="badge badge-info">{new Date(letter.createdAt).toLocaleDateString('fr-FR')}</span>
                  <span className="text-muted text-sm">→ {letter.recipient}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => handlePrintLetter(letter.id)}>🖨 Imprimer</button>
                  <button className="btn btn-outline btn-sm" onClick={() => handleEditLetter(letter)}>✏ Modifier</button>
                  <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)', borderColor: '#f5c6c3' }} onClick={() => handleDeleteLetter(letter.id)}>Supprimer</button>
                </div>
              </div>
              <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}><strong>Objet :</strong> {letter.subject}</div>
            </div>
          ))}
        </div>
      )}

      {letterModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: 600, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3>{editingLetterId ? 'Modifier le courrier' : 'Nouveau courrier medical'}</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setLetterModal(false)}>Fermer</button>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Type</label>
                <select value={letterForm.type} onChange={e => setLetterForm({ ...letterForm, type: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6 }}>
                  {Object.entries(letterTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Destinataire</label>
                <input value={letterForm.recipient} onChange={e => setLetterForm({ ...letterForm, recipient: e.target.value })} placeholder="Dr Dupont, Hopital Saint-Louis..." style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Objet</label>
                <input value={letterForm.subject} onChange={e => setLetterForm({ ...letterForm, subject: e.target.value })} placeholder="Objet du courrier" style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Contenu du courrier</label>
                <textarea value={letterForm.body} onChange={e => setLetterForm({ ...letterForm, body: e.target.value })} placeholder="Redigez le contenu du courrier ici..." rows={12} style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontFamily: 'inherit', lineHeight: 1.7 }} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-outline" onClick={() => setLetterModal(false)}>Annuler</button>
                <button className="btn btn-primary" onClick={handleSaveLetter}>{editingLetterId ? 'Modifier' : 'Creer le courrier'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientLettersTab;
