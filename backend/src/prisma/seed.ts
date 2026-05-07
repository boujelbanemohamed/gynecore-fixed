import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';

async function main() {
  console.log('🌱 Seeding...');

  const doctorPassword = await bcrypt.hash('Doctor123!', 12);
  const doctor = await prisma.user.upsert({
    where: { email: 'dr.martin@gynecare.fr' },
    update: {},
    create: {
      email: 'dr.martin@gynecare.fr',
      password: doctorPassword,
      firstName: 'Sophie',
      lastName: 'Martin',
      role: Role.DOCTOR,
      licenseNumber: 'RPPS123456',
      specialization: 'Gynécologie-Obstétrique',
      phone: '+33 6 12 34 56 78',
    },
  });

  await prisma.user.upsert({
    where: { email: 'assistante@gynecare.fr' },
    update: {},
    create: {
      email: 'assistante@gynecare.fr',
      password: await bcrypt.hash('Assistant123!', 12),
      firstName: 'Marie',
      lastName: 'Dupont',
      role: Role.ASSISTANT,
    },
  });

  const patientPassword = await bcrypt.hash('Patient123!', 12);

  const p1User = await prisma.user.upsert({
    where: { email: 'camille.bernard@email.fr' },
    update: {},
    create: {
      email: 'camille.bernard@email.fr',
      password: patientPassword,
      firstName: 'Camille',
      lastName: 'Bernard',
      role: Role.PATIENT,
      phone: '+33 6 11 22 33 44',
    },
  });

  const p1 = await prisma.patient.upsert({
    where: { userId: p1User.id },
    update: {},
    create: {
      userId: p1User.id,
      doctorId: doctor.id,
      dateOfBirth: new Date('1990-03-15'),
      bloodType: 'A+',
      city: 'Paris',
      allergies: 'Pénicilline',
      contraceptionMethod: 'Pilule',
      numberOfPregnancies: 1,
      numberOfDeliveries: 1,
    },
  });

  const p2User = await prisma.user.upsert({
    where: { email: 'lea.moreau@email.fr' },
    update: {},
    create: {
      email: 'lea.moreau@email.fr',
      password: patientPassword,
      firstName: 'Léa',
      lastName: 'Moreau',
      role: Role.PATIENT,
      phone: '+33 6 55 66 77 88',
    },
  });

  const p2 = await prisma.patient.upsert({
    where: { userId: p2User.id },
    update: {},
    create: {
      userId: p2User.id,
      doctorId: doctor.id,
      dateOfBirth: new Date('1985-07-22'),
      bloodType: 'O-',
      city: 'Lyon',
      chronicDiseases: 'Endométriose',
    },
  });

  // Utilisation de upsert pour l'idempotence
  const consultation = await prisma.consultation.upsert({
    where: { id: 'seed-consultation-p1' },
    update: {},
    create: {
      id: 'seed-consultation-p1',
      patientId: p1.id,
      date: new Date('2024-11-15T10:00:00Z'),
      type: 'ANNUAL_CHECKUP',
      chiefComplaint: 'Bilan annuel',
      diagnosis: 'Examen normal',
      treatment: 'Continuer la contraception',
      weight: 62.5,
      bloodPressure: '120/80',
      nextVisit: new Date('2025-11-15'),
    },
  });

  await prisma.prescription.upsert({
    where: { id: 'seed-prescription-p1' },
    update: {},
    create: {
      id: 'seed-prescription-p1',
      patientId: p1.id,
      consultationId: consultation.id,
      medications: [
        { name: 'Lévonorgestrel', dosage: '0.15mg', frequency: '1/jour', duration: '6 mois', instructions: 'Le soir' },
      ],
      notes: 'Renouvellement contraception',
      expiresAt: new Date('2025-05-15'),
    },
  });

  const now = new Date();
  await prisma.appointment.createMany({
    data: [
      {
        patientId: p1.id, doctorId: doctor.id,
        startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
        type: 'FOLLOW_UP', reason: 'Contrôle contraception', status: 'CONFIRMED',
      },
      {
        patientId: p2.id, doctorId: doctor.id,
        startTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
        type: 'FOLLOW_UP', reason: 'Suivi endométriose', status: 'SCHEDULED',
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Seed terminé !');
  console.log('👩‍⚕️ Médecin:   dr.martin@gynecare.fr / Doctor123!');
  console.log('🧑‍💼 Assistante: assistante@gynecare.fr / Assistant123!');
  console.log('👤 Patient 1:  camille.bernard@email.fr / Patient123!');
  console.log('👤 Patient 2:  lea.moreau@email.fr / Patient123!');
}

main()
  .catch((err) => { console.error('Erreur seed:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
