import React from 'react';

interface Props {
  patient: any;
  onEdit: () => void;
}

const calcAge = (dob: string) => Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

const PatientInfoTab: React.FC<Props> = ({ patient, onEdit }) => {
  const u = patient.user;
  return (
    <div className="grid-2">
      <div className="card">
        <div className="card-header">
          <span className="card-title">Informations personnelles</span>
          <button className="btn btn-outline btn-sm" onClick={onEdit}>Modifier</button>
        </div>
        {[
          ['Nom complet', `${u.firstName} ${u.lastName}`],
          ['Email', u.email],
          ['Téléphone', u.phone || '—'],
          ['Âge', `${calcAge(patient.dateOfBirth)} ans`],
          ['Adresse', patient.address || '—'],
          ['Ville', patient.city || '—'],
          ['Code postal', patient.postalCode || '—'],
          ['Pays', patient.country || '—'],
        ].map(([label, value]) => (
          <div className="detail-row" key={label}><span className="detail-label">{label}</span><span>{value}</span></div>
        ))}
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">Antécédents médicaux</span></div>
        {[
          ['Groupe sanguin', patient.bloodType || '—'],
          ['Allergies', patient.allergies || 'Aucune'],
          ['Maladies chroniques', patient.chronicDiseases || 'Aucune'],
          ['Antécédents familiaux', patient.familyHistory || 'Aucun'],
          ['Médicaments actuels', patient.currentMedications || 'Aucun'],
          ['Dernières règles', patient.lastMenstrualPeriod ? new Date(patient.lastMenstrualPeriod).toLocaleDateString('fr-FR') : '—'],
          ['Contraception', patient.contraceptionMethod || '—'],
          ['Grossesses', patient.numberOfPregnancies],
          ['Accouchements', patient.numberOfDeliveries],
          ['Contact urgence', patient.emergencyContact || '—'],
          ['Tél. urgence', patient.emergencyPhone || '—'],
        ].map(([label, value]) => (
          <div className="detail-row" key={label}><span className="detail-label">{label}</span><span>{value}</span></div>
        ))}
      </div>
    </div>
  );
};

export default PatientInfoTab;
