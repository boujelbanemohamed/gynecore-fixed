import { google } from 'googleapis';
import { prisma } from '../prisma';

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(doctorId: string): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: doctorId,
  });
}

export async function handleCallback(code: string, doctorId: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  const data: any = {
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token || undefined,
    scope: tokens.scope || null,
    tokenType: tokens.token_type || null,
    expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
  };

  await prisma.googleCalendarToken.upsert({
    where: { doctorId },
    update: data,
    create: { doctorId, ...data },
  });
}

export async function refreshAccessToken(doctorId: string): Promise<string> {
  const token = await prisma.googleCalendarToken.findUnique({ where: { doctorId } });
  if (!token) throw new Error('Aucun token Google trouvé');

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: token.accessToken,
    refresh_token: token.refreshToken,
    expiry_date: token.expiryDate?.getTime(),
  });

  const { credentials } = await oauth2Client.refreshAccessToken();

  await prisma.googleCalendarToken.update({
    where: { doctorId },
    data: {
      accessToken: credentials.access_token!,
      expiryDate: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
    },
  });

  return credentials.access_token!;
}

export async function getCalendarEvents(doctorId: string, start: string, end: string) {
  const token = await prisma.googleCalendarToken.findUnique({ where: { doctorId } });
  if (!token) throw new Error('Aucun token Google trouvé');

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: token.accessToken,
    refresh_token: token.refreshToken,
    expiry_date: token.expiryDate?.getTime(),
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: start,
      timeMax: end,
      singleEvents: true,
      orderBy: 'startTime',
    });
    return res.data.items || [];
  } catch (err: any) {
    if (err.message?.includes('Token has expired') || err.message?.includes('Invalid Credentials')) {
      const newToken = await refreshAccessToken(doctorId);
      oauth2Client.setCredentials({ access_token: newToken });
      const res = await calendar.events.list({
        calendarId: 'primary',
        timeMin: start,
        timeMax: end,
        singleEvents: true,
        orderBy: 'startTime',
      });
      return res.data.items || [];
    }
    throw err;
  }
}

export async function getStatus(doctorId: string) {
  const token = await prisma.googleCalendarToken.findUnique({ where: { doctorId } });
  return { connected: !!token, email: token?.scope?.split(' ')[0] || null };
}

export async function disconnect(doctorId: string) {
  await prisma.googleCalendarToken.delete({ where: { doctorId } });
}
