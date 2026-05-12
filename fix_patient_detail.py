filepath = 'frontend/src/pages/doctor/PatientDetail.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# 6a. Ajouter 'letters' au type Tab
content = content.replace(
    "type Tab = 'info'|'consultations'|'prescriptions'|'certificates'|'appointments'|'documents';",
    "type Tab = 'info'|'consultations'|'prescriptions'|'certificates'|'letters'|'appointments'|'documents';"
)

# 6b. Ajouter les states pour les courriers
content = content.replace(
    "  // Certificate states",
    "  // Medical Letter states\n  const [letters, setLetters] = useState<any[]>([]);\n  const [letterForm, setLetterForm] = useState({ type: 'SPECIALIST_REFERRAL', recipient: '', subject: '', body: '' });\n  const [letterModal, setLetterModal] = useState(false);\n  const [editingLetterId, setEditingLetterId] = useState<string | null>(null);\n\n  // Certificate states"
)

# 6c. Ajouter loadLetters dans useEffect
content = content.replace(
    "  useEffect(() => { loadCertificates(); }, [id]);",
    "  const loadLetters = () => {\n    doctorAPI.getMedicalLetters({ patientId: id }).then((r: any) => setLetters(r.data.data?.letters || [])).catch(() => {});\n  };\n  useEffect(() => { loadLetters(); }, [id]);\n  useEffect(() => { loadCertificates(); }, [id]);"
)

# 6d. Ajouter les fonctions CRUD pour les courriers avant les fonctions certificate
content = content.replace(
    "  // -- Certificate functions --",
    """  // -- Medical Letter functions --
  const letterTypeLabels: Record<string, string> = { SPECIALIST_REFERRAL: 'Courrier vers specialiste', EMPLOYER: 'Courrier employeur', MEDICAL_REPORT: 'Rapport medical', DISCHARGE_SUMMARY: 'Synthese de sortie', OTHER: 'Autre' };
  const letterTypeIcons: Record<string, string> = { SPECIALIST_REFERRAL: 'urologie', EMPLOYER: 'hospital', MEDICAL_REPORT: 'clipboard2-pulse', DISCHARGE_SUMMARY: 'file-earmark-medical', OTHER: 'envelope' };

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
    if (!letterForm.recipient || !letterForm.subject) { alert('Veuillez remplir le destinataire et l\\'objet'); return; }
    try {
      const data = { patientId: id, type: letterForm.type, recipient: letterForm.recipient, subject: letterForm.subject, content: { body: letterForm.body } };
      if (editingLetterId) { await doctorAPI.updateMedicalLetter(editingLetterId, data); }
      else { await doctorAPI.createMedicalLetter(data); }
      setLetterModal(false);
      loadLetters();
    } catch (e: any) { alert(e.response?.data?.error || 'Erreur'); }
  };

  const handleDeleteLetter = async (letterId: string) => {
    if (!confirm('Supprimer ce courrier ?')) return;
    try { await doctorAPI.deleteMedicalLetter(letterId); loadLetters(); } catch {}
  };

  const handlePrintLetter = async (letterId: string) => {
    try {
      const res = await doctorAPI.getMedicalLetterById(letterId);
      const letter = res.data.data;
      const c = letter.content || {};
      const pName = patient.user?.firstName + ' ' + patient.user?.lastName;
      const pAge = patient.dateOfBirth ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / 31557600000) : '';
      const fmt = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '.......................................';
      const fld = (v: string) => v || '.......................................';
      const fullAddr = [(doctorProfile?.address || ''), (doctorProfile?.city || ''), (doctorProfile?.postalCode || '')].filter(Boolean).join(', ');
      let logoHtml = '';
      if (doctorProfile?.logo) {
        try {
          const imgUrl = API_BASE.replace('/api', '') + doctorProfile.logo;
          const imgRes = await fetch(imgUrl);
          const blob = await imgRes.blob();
          logoHtml = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve('<img class="rx-doctor-logo" src="' + reader.result + '" />');
            reader.readAsDataURL(blob);
          });
        } catch { logoHtml = ''; }
      }
      const bodyContent = c.body || '';
      const html = '<html><head><style>' +
        'body{font-family:Arial,sans-serif;color:#333;max-width:800px;margin:40px auto;padding:20px}' +
        '.rx-doctor-logo{max-height:80px;margin-bottom:10px}' +
        '.rx-header{text-align:right;margin-bottom:30px}' +
        '.rx-recipient{margin-bottom:20px}' +
        '.rx-subject{margin-bottom:20px;font-weight:bold;font-size:16px}' +
        '.rx-body{line-height:1.8;white-space:pre-wrap;margin-bottom:30px}' +
        '.rx-footer{margin-top:40px;text-align:center;border-top:1px solid #ddd;padding-top:15px;font-size:11px;color:#777}' +
        '.rx-signature{margin-top:60px;text-align:right}' +
        '.rx-date{margin-top:20px}' +
        '</style></head><body>' +
        (logoHtml ? '<div>' + logoHtml + '</div>' : '') +
        '<div class="rx-header"><strong>Dr ' + (doctorProfile?.lastName || '') + ' ' + (doctorProfile?.firstName || '') + '</strong><br/>' +
        (doctorProfile?.specialization || 'Medecin specialiste') + '<br/>' +
        fullAddr + '<br/>' +
        'Tel: ' + (doctorProfile?.phone || '') + '</div>' +
        '<div class="rx-recipient"><strong>' + (letterTypeLabels[letter.type] || 'Courrier') + '</strong><br/>' +
        'A l\\'attention de : <strong>' + (letter.recipient || '.......................................') + '</strong></div>' +
        '<div class="rx-subject">Objet : ' + (letter.subject || '') + ' - ' + pName + '</div>' +
        '<div class="rx-body">' + bodyContent + '</div>' +
        '<div class="rx-signature"><p>Fait le ' + fmt(letter.createdAt) + '</p><p>Dr ' + (doctorProfile?.lastName || '') + ' ' + (doctorProfile?.firstName || '') + '</p>' +
        '<p style="font-size:12px;color:#777">' + (doctorProfile?.specialization || '') + '</p></div>' +
        '<div class="rx-footer"><p>' + fullAddr + ' | Tel: ' + (doctorProfile?.phone || '') + '</p></div>' +
        '</body></html>';
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      const doc = iframe.contentDocument || (iframe.contentWindow as any)?.document;
      if (!doc) { document.body.removeChild(iframe); return; }
      doc.open(); doc.write(html); doc.close();
      iframe.contentWindow.focus(); iframe.contentWindow.print();
      setTimeout(() => { try { document.body.removeChild(iframe); } catch {} }, 5000);
    } catch (e) { alert('Erreur lors de l\\'impression'); }
  };

  // -- Certificate functions --"""
)

# 6e. Ajouter l'onglet dans la liste des tabs
content = content.replace(
    "  { key: 'certificates', label: 'Certificats', count: certificates?.length },",
    "  { key: 'certificates', label: 'Certificats', count: certificates?.length },\n  { key: 'letters', label: 'Courriers medicaux', count: letters?.length },"
)

# 6f. Ajouter le rendu de l'onglet courriers apres certificats (avant Rendez-vous)
content = content.replace(
    "            {/* ── TAB: Rendez-vous ── */",
    """      {/* ── TAB: Courriers medicaux ── */}
      {tab === 'letters' && (
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
        </div>
      )}

      {/* Modal Courrier */}
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

            {/* ── TAB: Rendez-vous ── */"""
)

with open(filepath, 'w') as f:
    f.write(content)
print('6. Onglet Courriers medicaux ajoute dans PatientDetail')
