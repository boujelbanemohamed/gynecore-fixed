import { Request, Response } from 'express';
import { prisma } from "../prisma";
import { sendSecretaryEmail } from '../services/notificationService';

// Obtenir l'ID du médecin depuis le JWT (fonctionne pour DOCTOR et SECRETARY)
const getDoctorId = async (req: Request): Promise<string> => {
  const user = (req as any).user;
  if (user.role === 'DOCTOR') return user.userId;
  // Pour la secretaire, chercher son doctorId
  const u = await prisma.user.findUnique({ where: { id: user.userId }, select: { doctorId: true } });
  if (!u?.doctorId) throw new Error('Secretaire non associee a un medecin');
  return u.doctorId;
};

// ── LISTE des créneaux indisponibles ──
export const getUnavailableSlots = async (req: Request, res: Response) => {
  try {
    const doctorId = await getDoctorId(req);
    const { startDate, endDate } = req.query;
    const where: any = { doctorId };
    if (startDate && endDate) {
      where.startTime = { gte: new Date(startDate as string) };
      where.endTime = { lte: new Date(endDate as string) };
    } else if (startDate) {
      where.OR = [
        { startTime: { gte: new Date(startDate as string) } },
        { endTime: { gte: new Date(startDate as string) } },
      ];
    }
    const slots = await prisma.unavailableSlot.findMany({
      where,
      orderBy: { startTime: 'asc' },
    });
    res.json({ success: true, data: { slots } });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ── CRÉER un créneau indisponible ──
export const createUnavailableSlot = async (req: Request, res: Response) => {
  try {
    const doctorId = await getDoctorId(req);
    const { startTime, endTime, reason } = req.body;

    if (!startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'Les dates de début et fin sont requises' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return res.status(400).json({ success: false, message: 'La date de fin doit être après la date de début' });
    }

    // Vérifier les chevauchements avec des RDV existants
    const conflictingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        status: { notIn: ['CANCELLED'] },
        OR: [
          { startTime: { lt: end }, endTime: { gt: start } },
        ],
      },
    });

    if (conflictingAppointments.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Ce créneau chevauche ${conflictingAppointments.length} rendez-vous existant(s)`,
        data: { conflictingCount: conflictingAppointments.length },
      });
    }

    // Vérifier les chevauchements avec d'autres créneaux indisponibles
    const conflictingSlots = await prisma.unavailableSlot.findMany({
      where: {
        doctorId,
        OR: [
          { startTime: { lt: end }, endTime: { gt: start } },
        ],
      },
    });

    if (conflictingSlots.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ce créneau chevauche un autre créneau d\'indisponibilité',
        data: { conflictingCount: conflictingSlots.length },
      });
    }

    const slot = await prisma.unavailableSlot.create({
      data: { doctorId, startTime: start, endTime: end, reason: reason || null },
    });

    // Envoi notification indisponibilité à la/les secrétaire(s)
    const doctor = await prisma.user.findUnique({ where: { id: doctorId }, select: { firstName: true, lastName: true } });
    if (doctor) {
      const frD = start.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const frT = `${start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
      sendSecretaryEmail(doctorId, 'unavailable_slot_created', {
        doctorFirstName: doctor.firstName,
        doctorLastName: doctor.lastName,
        appointmentDate: frD,
        appointmentTime: frT,
        reason: reason || 'Non spécifié',
      }).catch(() => {});
    }

    res.status(201).json({ success: true, data: slot });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ── SUPPRIMER un créneau indisponible ──
export const deleteUnavailableSlot = async (req: Request, res: Response) => {
  try {
    const doctorId = await getDoctorId(req);
    const slot = await prisma.unavailableSlot.findFirst({
      where: { id: req.params.id, doctorId },
    });
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Créneau non trouvé' });
    }
    await prisma.unavailableSlot.delete({ where: { id: slot.id } });
    res.json({ success: true, message: 'Créneau supprimé' });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ── VÉRIFIER si un créneau est disponible (utilisé lors de la création de RDV) ──
export const checkSlotAvailability = async (doctorId: string, startTime: Date, endTime: Date): Promise<boolean> => {
  const conflicts = await prisma.unavailableSlot.findMany({
    where: {
      doctorId,
      OR: [
        { startTime: { lt: endTime }, endTime: { gt: startTime } },
      ],
    },
  });
  return conflicts.length === 0;
};
