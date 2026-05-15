import { Request, Response } from 'express';
import * as googleCalendarService from '../services/googleCalendarService';
import { prisma } from '../prisma';

export const getAuthUrl = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user!.userId;
    const url = googleCalendarService.getAuthUrl(doctorId);
    res.json({ success: true, data: { url } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const handleCallback = async (req: Request, res: Response) => {
  try {
    const { code, state: doctorId } = req.query as { code: string; state: string };
    if (!code || !doctorId) {
      return res.status(400).json({ success: false, error: 'Code ou state manquant' });
    }
    await googleCalendarService.handleCallback(code, doctorId);
    res.redirect(`${process.env.FRONTEND_URL}/calendar?google=connected`);
  } catch (err: any) {
    console.error('[Google Calendar] Erreur callback:', err.message);
    res.redirect(`${process.env.FRONTEND_URL}/calendar?google=error&msg=${encodeURIComponent(err.message)}`);
  }
};

export const getEvents = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user!.userId;
    const { start, end } = req.query as { start: string; end: string };
    if (!start || !end) {
      return res.status(400).json({ success: false, error: 'Paramètres start et end requis' });
    }
    const events = await googleCalendarService.getCalendarEvents(doctorId, start, end);

    const convertedEvents = await prisma.appointment.findMany({
      where: {
        doctorId,
        googleEventId: { not: null },
        startTime: { gte: new Date(start) },
        endTime: { lte: new Date(end) },
      },
      select: { googleEventId: true },
    });
    const convertedEventIds = new Set(convertedEvents.map(a => a.googleEventId));

    res.json({ success: true, data: { events, convertedEventIds: Array.from(convertedEventIds) } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getStatus = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user!.userId;
    const status = await googleCalendarService.getStatus(doctorId);
    res.json({ success: true, data: status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const disconnect = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user!.userId;
    await googleCalendarService.disconnect(doctorId);
    res.json({ success: true, data: { message: 'Google Agenda déconnecté' } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
