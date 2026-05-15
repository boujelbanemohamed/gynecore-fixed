import React, { useState } from 'react';
import { certTypeLabels, certTypeIcons, escapeHtml, fileUrl, printInIframe } from './constants';

interface Props {
  patient: any;
  certificates: any[];
  doctorProfile: any;
  onRefreshCertificates: () => void;
  onAlert: (msg: { type: 'success' | 'error' | 'warning' | 'info'; text: string } | null) => void;
}

const certFields: Record<string, {key:string,label:string,type:'text'|'date'|'textarea'|'select',placeholder?:string,options?:string[]}[]> = {
  APTITUDE: [
    {key:'fullName',label:'Nom complet',type:'text',placeholder:'Nom Prenom'},
    {key:'dateOfBirth',label:'Date de naissance',type:'date'},
    {key:'cin',label:'CIN',type:'text',placeholder:'N CIN'},
    {key:'certDate',label:'Date du certificat',type:'date'},
    {key:'aptitudeType',label:"Type d'aptitude",type:'select',options:["Aptitude a l'effort","Aptitude au travail","Aptitude au sport","Inaptitude temporaire","Inaptitude definitive"]},
    {key:'validityDuration',label:'Duree de validite',type:'text',placeholder:'ex: 6 mois'},
    {key:'observations',label:'Observations',type:'textarea',placeholder:'Observations medicales...'},
  ],
  MEDICAL_REST: [
    {key:'fullName',label:'Nom complet',type:'text',placeholder:'Nom Prenom'},
    {key:'dateOfBirth',label:'Date de naissance',type:'date'},
    {key:'startDate',label:'Du (debut)',type:'date'},
    {key:'endDate',label:'Au (fin)',type:'date'},
    {key:'durationDays',label:'Duree (jours)',type:'text',placeholder:'ex: 7'},
    {key:'medicalReason',label:'Motif medical',type:'text',placeholder:'ex: suites operatoires'},
    {key:'sorties',label:'Sorties',type:'select',options:['Sorties autorisees','Sorties non autorisees','Sorties sur avis medical']},
    {key:'recommendations',label:'Recommandations',type:'textarea',placeholder:'Recommandations...'},
  ],
  PREGNANCY_WORK: [
    {key:'fullName',label:'Nom complet',type:'text',placeholder:'Nom Prenom'},
    {key:'dateOfBirth',label:'Date de naissance',type:'date'},
    {key:'currentTerm',label:'Terme actuel (SA)',type:'text',placeholder:'ex: 28 SA'},
    {key:'dpa',label:'DPA (Date Prevue Accouchement)',type:'date'},
    {key:'measure',label:'Mesure demandee',type:'select',options:["Amenagement poste","Allegement horaires","Arret travail","Pas de port charges > 5kg"]},
    {key:'duration',label:'Duree (texte libre)',type:'text',placeholder:"ex: jusqu'a l'accouchement"},
    {key:'durationDate',label:'Ou choisir une date de fin',type:'date'},
    {key:'medicalContext',label:'Contexte medical',type:'textarea',placeholder:'Elements justifiant...'},
  ],
  MATERNITY_LEAVE: [
    {key:'fullName',label:'Nom complet',type:'text',placeholder:'Nom Prenom'},
    {key:'dateOfBirth',label:'Date de naissance',type:'date'},
    {key:'dpa',label:'DPA',type:'date'},
    {key:'startDate',label:'Debut conge prenatal',type:'date'},
    {key:'leaveType',label:'Type de conge',type:'select',options:['Conge prenatal','Conge postnatal','Conge de maternite complet']},
    {key:'totalDuration',label:'Duree totale',type:'text',placeholder:'ex: 14 semaines'},
    {key:'observations',label:'Observations',type:'textarea',placeholder:'Complications eventuelles...'},
  ],
  RETURN_TO_WORK: [
    {key:'fullName',label:'Nom complet',type:'text',placeholder:'Nom Prenom'},
    {key:'dateOfBirth',label:'Date de naissance',type:'date'},
    {key:'stopReason',label:"Motif de l'arret",type:'text',placeholder:"ex: suites d'accouchement"},
    {key:'returnDate',label:'Date de reprise',type:'date'},
    {key:'returnType',label:'Type de reprise',type:'select',options:['Reprise temps plein','Reprise temps partiel','Reprise progressive']},
    {key:'recommendations',label:'Recommandations',type:'textarea',placeholder:'Recommandations pour le retour...'},
  ],
  POST_OPERATIVE: [
    {key:'fullName',label:'Nom complet',type:'text',placeholder:'Nom Prenom'},
    {key:'dateOfBirth',label:'Date de naissance',type:'date'},
    {key:'surgicalProcedure',label:'Acte chirurgical',type:'text',placeholder:'ex: Coelioscopie pour GEU'},
    {key:'interventionDate',label:"Date d'intervention",type:'date'},
    {key:'restDuration',label:'Repos prescrit',type:'text',placeholder:'ex: 10 jours'},
    {key:'resumptionDate',label:"Reprise activite le",type:'date'},
    {key:'restrictions',label:'Restrictions',type:'select',options:['Pas de port charges',"Pas d'activite physique intense","Repos strict","Activites legeres autorisees"]},
    {key:'recommendations',label:'Recommandations',type:'textarea',placeholder:'Soins, surveillance, alarmes...'},
  ],
};

const PatientCertificatesTab: React.FC<Props> = ({ patient, certificates, doctorProfile, onRefreshCertificates, onAlert }) => {
  const [showCertModal, setShowCertModal] = useState(false);
  const [certSaving, setCertSaving] = useState(false);
  const [certType, setCertType] = useState<string>('APTITUDE');
  const [certForm, setCertForm] = useState<Record<string,string>>({});
  const [editingCertId, setEditingCertId] = useState<string | null>(null);

  const getCertFields = (t: string) => {
    if (t === 'MATERNITY_LEAVE') {
      const base = [
        {key:'fullName',label:'Nom complet',type:'text',placeholder:'Nom Prenom'},
        {key:'dateOfBirth',label:'Date de naissance',type:'date'},
        {key:'leaveType',label:'Type de conge',type:'select',options:['Conge prenatal','Conge postnatal','Conge de maternite complet']},
      ];
      const obs = {key:'observations',label:'Observations',type:'textarea',placeholder:'Complications eventuelles...'};
      const dur = {key:'totalDuration',label:'Duree totale (jours)',type:'text',placeholder:'auto-calcule'};
      const lt = certForm.leaveType;
      if (lt === 'Conge postnatal') {
        return [...base, {key:'dpa',label:"DPA ou Date d'accouchement",type:'date'}, {key:'endDate',label:'Fin du conge postnatal',type:'date'}, dur, obs];
      }
      if (lt === 'Conge de maternite complet') {
        return [...base, {key:'dpa',label:'DPA (Date Prevue Accouchement)',type:'date'}, {key:'endDate',label:'Fin du conge de maternite',type:'date'}, dur, obs];
      }
      return [...base, {key:'dpa',label:'DPA (Date Prevue Accouchement)',type:'date'}, {key:'startDate',label:'Debut conge prenatal',type:'date'}, dur, obs];
    }
    return certFields[t];
  };

  const updCert = (patch: Record<string,string>) => setCertForm(prev => {
    const updated = { ...prev, ...patch };
    if (certType === 'MEDICAL_REST' && ('startDate' in patch || 'endDate' in patch)) {
      if (updated.startDate && updated.endDate) {
        const diffTime = Math.abs(new Date(updated.endDate).getTime() - new Date(updated.startDate).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0) updated.durationDays = String(diffDays);
      }
    }
    if (certType === 'MATERNITY_LEAVE') {
      if ('leaveType' in patch) {
        if (patch.leaveType !== 'Conge prenatal') updated.startDate = '';
        if (patch.leaveType !== 'Conge postnatal' && patch.leaveType !== 'Conge de maternite complet') updated.endDate = '';
        updated.totalDuration = '';
      }
      const lt = updated.leaveType;
      if (lt === 'Conge prenatal' && updated.startDate && updated.dpa) {
        const diff = Math.ceil(Math.abs(new Date(updated.dpa).getTime() - new Date(updated.startDate).getTime()) / (1000*60*60*24));
        if (diff >= 0) updated.totalDuration = String(diff) + ' jours';
      } else if ((lt === 'Conge postnatal' || lt === 'Conge de maternite complet') && updated.endDate && updated.dpa) {
        const diff = Math.ceil(Math.abs(new Date(updated.endDate).getTime() - new Date(updated.dpa).getTime()) / (1000*60*60*24));
        if (diff >= 0) updated.totalDuration = String(diff) + ' jours';
      }
    }
    if (certType === 'POST_OPERATIVE' && (updated.interventionDate && updated.resumptionDate) && ('interventionDate' in patch || 'resumptionDate' in patch)) {
      const diff = Math.ceil(Math.abs(new Date(updated.resumptionDate).getTime() - new Date(updated.interventionDate).getTime()) / (1000*60*60*24));
      if (diff >= 0) updated.restDuration = String(diff) + ' jours';
    }
    return updated;
  });

  const openCertModal = (type?: string) => {
    setCertType(type || 'APTITUDE');
    const fields = certFields[type || 'APTITUDE'] || [];
    const defaults: Record<string,string> = { certDate: new Date().toISOString().slice(0,10) };
    fields.forEach(f => { if (f.type === 'date' && f.key === 'certDate') return; defaults[f.key] = ''; });
    if (patient) {
      defaults.fullName = (patient.user?.firstName || '') + ' ' + (patient.user?.lastName || '');
      if (patient.dateOfBirth) defaults.dateOfBirth = new Date(patient.dateOfBirth).toISOString().slice(0,10);
    }
    setCertForm(defaults);
    setEditingCertId(null);
    setShowCertModal(true);
  };

  const handleSaveCert = async () => {
    setCertSaving(true);
    try {
      const { doctorAPI } = await import('../../../services/api');
      await (doctorAPI as any).createCertificate({ patientId: patient.id, type: certType, content: certForm });
      onRefreshCertificates();
      setShowCertModal(false);
    } catch (err: any) { onAlert({ type: 'error', text: err.response?.data?.error || 'Erreur lors de la creation' }); }
    finally { setCertSaving(false); }
  };

  const handleEditCert = (cert: any) => {
    setCertType(cert.type);
    setEditingCertId(cert.id);
    const data = typeof cert.content === 'string' ? JSON.parse(cert.content || '{}') : (cert.content || {});
    const fields = certFields[cert.type] || [];
    const defaults: Record<string,string> = {};
    fields.forEach((f: any) => { defaults[f.key] = (data[f.key] || '') + ''; });
    setCertForm(defaults);
    setShowCertModal(true);
  };

  const handleUpdateCert = async () => {
    if (!editingCertId) return;
    setCertSaving(true);
    try {
      const { doctorAPI } = await import('../../../services/api');
      await (doctorAPI as any).updateCertificate(editingCertId, { type: certType, content: certForm });
      onRefreshCertificates();
      setShowCertModal(false);
      setEditingCertId(null);
    } catch (err: any) { onAlert({ type: 'error', text: err.response?.data?.error || 'Erreur lors de la modification' }); }
    finally { setCertSaving(false); }
  };

  const handlePrintCert = async (certId: string) => {
    try {
      const { doctorAPI } = await import('../../../services/api');
      const res = await (doctorAPI as any).getCertificateById(certId);
      const cert = res.data.data;
      const c = typeof cert.content === 'string' ? JSON.parse(cert.content || '{}') : (cert.content || {});
      const pName = escapeHtml((cert.patient?.user?.firstName||'') + ' ' + (cert.patient?.user?.lastName||''));
      const pAge = cert.patient?.dateOfBirth ? Math.floor((Date.now() - new Date(cert.patient.dateOfBirth).getTime()) / (365.25*24*60*60*1000)) + ' ans' : '--';
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
      const fmt = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '.......................................';
      const fld = (v: string) => escapeHtml(v) || '.......................................';
      let bodyHtml = '';
      const dp = doctorProfile;
      switch (cert.type) {
        case 'APTITUDE':
          bodyHtml = '<p>Je soussigne(e), Dr <strong>' + escapeHtml(dp?.lastName||'') + ' ' + escapeHtml(dp?.firstName||'') + '</strong>, ' + escapeHtml(dp?.specialization||'medecin specialiste') + ', certifie que :</p>' +
            '<div class="cert-details"><p><strong>Patiente :</strong> Mme/Mlle ' + pName + ', agee de ' + pAge + '</p>' +
            '<p><strong>Date de naissance :</strong> ' + fmt(c.dateOfBirth) + '</p>' + (c.cin ? '<p><strong>CIN :</strong> ' + escapeHtml(c.cin) + '</p>' : '') +
            '<p><strong>Date du certificat :</strong> ' + fmt(c.certDate) + '</p></div>' +
            '<p>Apres examen medical, je certifie que la patiente est :</p>' +
            '<div class="cert-details"><p><strong>' + fld(c.aptitudeType) + '</strong></p></div>' +
            (c.validityDuration ? '<p>Ce certificat est valable pour une duree de <strong>' + escapeHtml(c.validityDuration) + '</strong>.</p>' : '') +
            (c.observations ? '<div class="cert-observations"><strong>Observations :</strong> ' + escapeHtml(c.observations) + '</div>' : '');
          break;
        case 'MEDICAL_REST':
          bodyHtml = '<p>Je soussigne(e), Dr <strong>' + escapeHtml(dp?.lastName||'') + ' ' + escapeHtml(dp?.firstName||'') + '</strong>, ' + escapeHtml(dp?.specialization||'medecin specialiste') + ', certifie que :</p>' +
            '<div class="cert-details"><p><strong>Patiente :</strong> Mme/Mlle ' + pName + ', agee de ' + pAge + '</p>' +
            '<p><strong>Date de naissance :</strong> ' + fmt(c.dateOfBirth) + '</p></div>' +
            '<p>La patiente necessite un repos medical pour la duree et les conditions suivantes :</p>' +
            '<div class="cert-details"><p><strong>Du :</strong> ' + fmt(c.startDate) + ' <strong>Au :</strong> ' + fmt(c.endDate) + ' (' + fld(c.durationDays) + ' jours)</p>' +
            '<p><strong>Motif medical :</strong> ' + fld(c.medicalReason) + '</p>' + (c.sorties ? '<p><strong>Sorties :</strong> ' + escapeHtml(c.sorties) + '</p>' : '') + '</div>' +
            (c.recommendations ? '<div class="cert-observations"><strong>Recommandations :</strong> ' + escapeHtml(c.recommendations) + '</div>' : '');
          break;
        case 'PREGNANCY_WORK':
          bodyHtml = '<p>Je soussigne(e), Dr <strong>' + escapeHtml(dp?.lastName||'') + ' ' + escapeHtml(dp?.firstName||'') + '</strong>, ' + escapeHtml(dp?.specialization||'medecin specialiste') + ', certifie la grossesse de :</p>' +
            '<div class="cert-details"><p><strong>Patiente :</strong> Mme/Mlle ' + pName + ', agee de ' + pAge + '</p>' +
            '<p><strong>Date de naissance :</strong> ' + fmt(c.dateOfBirth) + '</p>' +
            '<p><strong>Terme :</strong> ' + fld(c.currentTerm) + '</p>' +
            '<p><strong>DPA :</strong> ' + fmt(c.dpa) + '</p></div>' +
            '<p>Je recommande la mesure suivante :</p>' +
            '<div class="cert-details"><p><strong>Mesure :</strong> ' + fld(c.measure) + '</p>' +
            '<p><strong>Duree :</strong> ' + (c.durationDate ? "jusqu'au " + fmt(c.durationDate) : '') + (c.durationDate && c.duration ? ' - ' : '') + fld(c.duration) + '</p></div>' +
            (c.medicalContext ? '<div class="cert-observations"><strong>Contexte medical :</strong> ' + escapeHtml(c.medicalContext) + '</div>' : '');
          break;
        case 'MATERNITY_LEAVE':
          const matDates = (c.leaveType === 'Conge postnatal')
            ? '<p><strong>DPA ou Date accouchement :</strong> ' + fmt(c.dpa) + '</p><p><strong>Fin conge :</strong> ' + fmt(c.endDate) + '</p>'
            : (c.leaveType === 'Conge de maternite complet')
            ? '<p><strong>DPA :</strong> ' + fmt(c.dpa) + '</p><p><strong>Fin conge :</strong> ' + fmt(c.endDate) + '</p>'
            : '<p><strong>DPA :</strong> ' + fmt(c.dpa) + '</p><p><strong>Debut :</strong> ' + fmt(c.startDate) + '</p>';
          bodyHtml = '<p>Je soussigne(e), Dr <strong>' + escapeHtml(dp?.lastName||'') + ' ' + escapeHtml(dp?.firstName||'') + '</strong>, certifie que :</p>' +
            '<div class="cert-details"><p><strong>Patiente :</strong> Mme ' + pName + '</p>' +
            '<p><strong>Date naissance :</strong> ' + fmt(c.dateOfBirth) + '</p></div>' +
            '<p>La patiente beneficie d\'un conge de maternite :</p>' +
            '<div class="cert-details"><p><strong>Type :</strong> ' + fld(c.leaveType) + '</p>' + matDates +
            '<p><strong>Duree :</strong> ' + fld(c.totalDuration) + '</p></div>' +
            (c.observations ? '<div class="cert-observations"><strong>Observations :</strong> ' + escapeHtml(c.observations) + '</div>' : '');
          break;
        case 'RETURN_TO_WORK':
          bodyHtml = '<p>Je soussigne(e), Dr <strong>' + escapeHtml(dp?.lastName||'') + ' ' + escapeHtml(dp?.firstName||'') + '</strong>, autorise la reprise du travail de :</p>' +
            '<div class="cert-details"><p><strong>Patiente :</strong> Mme/Mlle ' + pName + '</p>' +
            '<p><strong>Date naissance :</strong> ' + fmt(c.dateOfBirth) + '</p></div>' +
            '<div class="cert-details"><p><strong>Motif arret :</strong> ' + fld(c.stopReason) + '</p>' +
            '<p><strong>Date reprise :</strong> ' + fmt(c.returnDate) + '</p>' +
            '<p><strong>Type :</strong> ' + fld(c.returnType) + '</p></div>' +
            (c.recommendations ? '<div class="cert-observations"><strong>Recommandations :</strong> ' + escapeHtml(c.recommendations) + '</div>' : '');
          break;
        case 'POST_OPERATIVE':
          bodyHtml = '<p>Je soussigne(e), Dr <strong>' + escapeHtml(dp?.lastName||'') + ' ' + escapeHtml(dp?.firstName||'') + '</strong>, certifie que :</p>' +
            '<div class="cert-details"><p><strong>Patiente :</strong> Mme/Mlle ' + pName + '</p>' +
            '<p><strong>Date naissance :</strong> ' + fmt(c.dateOfBirth) + '</p></div>' +
            '<div class="cert-details"><p><strong>Acte chirurgical :</strong> ' + fld(c.surgicalProcedure) + '</p>' +
            '<p><strong>Date intervention :</strong> ' + fmt(c.interventionDate) + '</p>' +
            '<p><strong>Repos prescrit :</strong> ' + fld(c.restDuration) + '</p>' +
            '<p><strong>Reprise le :</strong> ' + fmt(c.resumptionDate) + '</p>' +
            (c.restrictions ? '<p><strong>Restrictions :</strong> ' + escapeHtml(c.restrictions) + '</p>' : '') + '</div>' +
            (c.recommendations ? '<div class="cert-observations"><strong>Recommandations :</strong> ' + escapeHtml(c.recommendations) + '</div>' : '');
          break;
        default:
          bodyHtml = '<p>Contenu du certificat</p>';
      }
      const certTitles: Record<string,string> = {
        APTITUDE: 'CERTIFICAT MEDICAL', MEDICAL_REST: 'CERTIFICAT DE REPOS MEDICAL',
        PREGNANCY_WORK: 'CERTIFICAT MEDICAL - GROSSESSE ET TRAVAIL',
        MATERNITY_LEAVE: 'CERTIFICAT DE CONGE MATERNITE', RETURN_TO_WORK: 'CERTIFICAT DE REPRISE DU TRAVAIL',
        POST_OPERATIVE: 'CERTIFICAT MEDICAL POST-OPERATOIRE',
      };
      const title = certTitles[cert.type] || 'CERTIFICAT MEDICAL';
      const html = '<div>' +
        '<div class="rx-header">' + logoHtml +
        '<div class="rx-info">' +
        '<div class="rx-clinic-name">' + escapeHtml(dp?.clinicName||'') + '</div>' +
        '<h2>Dr ' + escapeHtml(dp?.lastName||'') + ' ' + escapeHtml(dp?.firstName||'') + '</h2>' +
        '<div class="rx-specialty">' + escapeHtml(dp?.specialization||'Gynecologie-Obstetrique') + '</div>' +
        '<div class="rx-address">' + fullAddr + '</div>' +
        '<div class="rx-contact">' + escapeHtml(dp?.phone||'') + (dp?.email?' . ':'') + escapeHtml(dp?.email||'') + '</div>' +
        '</div></div>' +
        '<div class="rx-title">' + title + '</div>' +
        '<div class="rx-patient"><div><strong>Patiente :</strong> ' + pName + '</div><div><strong>Age :</strong> ' + pAge + '</div></div>' +
        '<div class="rx-date-place">Fait a ' + escapeHtml(dp?.city||'Tunis') + ', le ' + new Date(cert.date).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'}) + '</div>' +
        '<div class="cert-body">' + bodyHtml + '</div>' +
        '<div class="rx-footer"><div class="rx-signature"><div class="rx-sig-line">Signature et cachet du medecin</div></div></div>' +
        '</div>';
      printInIframe(html);
    } catch { onAlert({ type: 'error', text: 'Erreur lors du chargement' }); }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {Object.entries(certTypeLabels).map(([k, v]) => (
          <button key={k} className={`btn btn-sm ${certType === k ? 'btn-primary' : 'btn-outline'}`} onClick={() => openCertModal(k)} style={{ fontSize: 12 }}>
            {certTypeIcons[k]} {v}
          </button>
        ))}
      </div>
      {!certificates?.length ? (
        <div className="card"><div className="empty-state"><div className="empty-icon">📄</div><p>Aucun certificat genere</p><p className="text-muted text-sm">Choisissez un type ci-dessus pour en creer un</p></div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {certificates.map((cert: any) => (
            <div className="card" key={cert.id} style={{ borderLeft: '3px solid var(--primary)' }}>
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{certTypeIcons[cert.type] || '📄'}</span>
                  <span style={{ fontWeight: 500 }}>{certTypeLabels[cert.type] || cert.type}</span>
                  <span className="badge badge-info">{new Date(cert.date).toLocaleDateString('fr-FR') + ' ' + new Date(cert.date).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => handlePrintCert(cert.id)}>🖨 Imprimer</button>
                  <button className="btn btn-outline btn-sm" onClick={() => handleEditCert(cert)}>✏ Modifier</button>
                  <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)', borderColor: '#f5c6c3' }}
                    onClick={() => {
                      const { doctorAPI: _api } = {} as any;
                      // handled via onAlert/confirm in parent — but for simplicity, direct call
                      if (window.confirm('Supprimer ce certificat ?')) {
                        (async () => {
                          try { const { doctorAPI } = await import('../../../services/api'); await (doctorAPI as any).deleteCertificate(cert.id); onRefreshCertificates(); }
                          catch { onAlert({ type: 'error', text: 'Erreur lors de la suppression' }); }
                        })();
                      }
                    }}>
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCertModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCertModal(false)}>
          <div className="modal" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <span className="modal-title">{certTypeIcons[certType]} {certTypeLabels[certType] || 'Certificat'}</span>
              <button className="btn-close" onClick={() => setShowCertModal(false)}>x</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {(getCertFields(certType) || []).map((field: any) => (
                  <div key={field.key} style={field.type === 'textarea' ? { gridColumn: '1/-1' } : {}}>
                    <label className="form-label" style={{ fontSize: 12 }}>{field.label}</label>
                    {field.type === 'select' ? (
                      <select className="form-control" value={certForm[field.key] || ''} onChange={e => updCert({ [field.key]: e.target.value })}>
                        <option value="">-- Choisir --</option>
                        {(field.options || []).map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea className="form-control" rows={3} placeholder={field.placeholder} value={certForm[field.key] || ''} onChange={e => updCert({ [field.key]: e.target.value })} />
                    ) : (
                      <input className="form-control" type={field.type === 'date' ? 'date' : 'text'} placeholder={field.placeholder} value={certForm[field.key] || ''} onChange={e => updCert({ [field.key]: e.target.value })} />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowCertModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={editingCertId ? handleUpdateCert : handleSaveCert} disabled={certSaving}>
                {certSaving ? 'Enregistrement...' : 'Generer le certificat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientCertificatesTab;
