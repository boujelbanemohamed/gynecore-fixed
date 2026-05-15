import { prisma } from "../prisma";
import fs from "fs";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "data", "system-config.json");

const DEFAULT_CONFIG: Record<string, string> = {
  CORS_ORIGIN: "http://localhost:3000",
  FRONTEND_URL: "http://localhost:3000",
  JWT_EXPIRES_IN: "24h",
  JWT_PATIENT_EXPIRES_IN: "7d",
  SMTP_HOST: "smtp.gmail.com",
  SMTP_PORT: "587",
  SMTP_FROM_NAME: "GyneCare",
  SMTP_FROM_EMAIL: "",
  SMTP_USER: "",
  SMTP_PASS: "",
  RATE_LIMIT_WINDOW_MS: "900000",
  RATE_LIMIT_MAX: "20",
  GOOGLE_CALENDAR_SYNC_INTERVAL: "300",
  HEALTH_CHECK_INTERVAL: "30",
};

export const ALL_COMPONENTS = ["backend", "frontend", "database", "config", "smtp", "googleCalendar"] as const;
export type ComponentName = (typeof ALL_COMPONENTS)[number];

function readSystemConfig(): Record<string, string> {
  try {
    if (fs.existsSync(CONFIG_PATH))
      return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
  } catch {}
  return {};
}

function writeSystemConfig(config: Record<string, string>) {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

export function getDisabledComponents(): Set<string> {
  const config = readSystemConfig();
  const raw = config.DISABLED_COMPONENTS || "";
  return new Set(raw.split(",").filter(Boolean));
}

function setDisabledComponents(components: Set<string>) {
  const config = readSystemConfig();
  config.DISABLED_COMPONENTS = Array.from(components).join(",");
  writeSystemConfig(config);
}

async function logRecovery(
  component: string,
  status: string,
  action: string,
  message: string,
  durationMs?: number,
) {
  try {
    await prisma.healthAuditLog.create({
      data: { component, status, action, message, durationMs },
    });
  } catch (err) {
    console.error("[HealthAutoRecovery] log error:", err);
  }
}

export type CheckResult = {
  component: string;
  status: "ok" | "warning" | "error";
  message: string;
  recoveryAction?: string;
  recoverySuccess?: boolean;
  durationMs: number;
  disabled?: boolean;
};

export async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const before = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dur = Date.now() - before;
    return { component: "database", status: "ok", message: "Connectee", durationMs: dur };
  } catch (err: any) {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      await logRecovery("database", "error", "RECONNECT", "Base de donnees deconnectee, reconnexion reussie", Date.now() - start);
      return { component: "database", status: "ok", message: "Reconnectee apres interruption", recoveryAction: "Reconnexion Prisma", recoverySuccess: true, durationMs: Date.now() - start };
    } catch {
      await logRecovery("database", "error", "RECONNECT_ECHEC", `Impossible de reconnecter la base: ${err.message}`, Date.now() - start);
      return { component: "database", status: "error", message: `Erreur: ${err.message}`, recoveryAction: "Reconnexion Prisma", recoverySuccess: false, durationMs: Date.now() - start };
    }
  }
}

export async function checkConfig(): Promise<CheckResult> {
  const start = Date.now();
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return { component: "config", status: "ok", message: "Fichier present", durationMs: Date.now() - start };
    }
    writeSystemConfig(DEFAULT_CONFIG);
    await logRecovery("config", "missing", "RECREATE", "Fichier de configuration manquant, cree avec les valeurs par defaut", Date.now() - start);
    return { component: "config", status: "ok", message: "Fichier recrete avec les valeurs par defaut", recoveryAction: "Creation fichier", recoverySuccess: true, durationMs: Date.now() - start };
  } catch (err: any) {
    await logRecovery("config", "error", "RECREATE_ECHEC", `Impossible de creer le fichier: ${err.message}`, Date.now() - start);
    return { component: "config", status: "error", message: `Erreur: ${err.message}`, recoveryAction: "Creation fichier", recoverySuccess: false, durationMs: Date.now() - start };
  }
}

export async function checkSmtp(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const config = readSystemConfig();
    const host = config.SMTP_HOST || process.env.SMTP_HOST || "";
    const user = config.SMTP_USER || process.env.SMTP_USER || "";
    if (!host) {
      return { component: "smtp", status: "warning", message: "Non configure", durationMs: Date.now() - start };
    }
    if (!user) {
      return { component: "smtp", status: "warning", message: "Utilisateur non defini", durationMs: Date.now() - start };
    }
    return { component: "smtp", status: "ok", message: `Configure (${host})`, durationMs: Date.now() - start };
  } catch (err: any) {
    return { component: "smtp", status: "error", message: `Erreur: ${err.message}`, durationMs: Date.now() - start };
  }
}

export async function checkGoogleCalendar(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const tokens = await prisma.googleCalendarToken.findMany({
      select: { doctorId: true },
    });
    return {
      component: "googleCalendar",
      status: tokens.length > 0 ? "ok" : "warning",
      message: tokens.length > 0 ? `${tokens.length} medecin(s) connecte(s)` : "Aucun medecin connecte",
      durationMs: Date.now() - start,
    };
  } catch (err: any) {
    return { component: "googleCalendar", status: "error", message: `Erreur: ${err.message}`, durationMs: Date.now() - start };
  }
}

export async function checkFrontend(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const config = readSystemConfig();
    const url = config.FRONTEND_URL || process.env.FRONTEND_URL || "http://localhost:3000";
    const res = await fetch(url);
    const dur = Date.now() - start;
    if (res.ok) {
      return { component: "frontend", status: "ok", message: `Repond (${res.status})`, durationMs: dur };
    }
    return { component: "frontend", status: "error", message: `Code ${res.status}`, durationMs: dur };
  } catch (err: any) {
    return { component: "frontend", status: "error", message: `Inaccessible: ${err.message}`, durationMs: Date.now() - start };
  }
}

export async function checkBackend(): Promise<CheckResult> {
  const start = Date.now();
  const mem = process.memoryUsage();
  const memRssMb = Math.round(mem.rss / 1024 / 1024);
  const uptimeHours = Math.floor(process.uptime() / 3600);

  let status: "ok" | "warning" | "error" = "ok";
  const warnings: string[] = [];

  if (memRssMb > 500) {
    warnings.push(`Memoire elevee: ${memRssMb} Mo`);
    status = "warning";
  }
  if (uptimeHours > 168) {
    warnings.push(`Uptime > 7 jours (${uptimeHours}h)`);
    status = "warning";
  }

  return {
    component: "backend",
    status,
    message: warnings.length > 0 ? warnings.join("; ") : "Fonctionnel",
    durationMs: Date.now() - start,
  };
}

const checkFns: Record<string, () => Promise<CheckResult>> = {
  backend: checkBackend,
  frontend: checkFrontend,
  database: checkDatabase,
  config: checkConfig,
  smtp: checkSmtp,
  googleCalendar: checkGoogleCalendar,
};

export async function toggleComponent(
  component: ComponentName,
  enabled: boolean,
): Promise<{ success: boolean; logs: string[] }> {
  const start = Date.now();
  const disabled = getDisabledComponents();
  const logs: string[] = [];

  if (enabled) {
    disabled.delete(component);
    setDisabledComponents(disabled);
    const result = await checkFns[component]();
    const ok = result.status === "ok";
    await logRecovery(
      component,
      result.status,
      ok ? "ENABLE_OK" : "ENABLE_ECHEC",
      `[ADMIN] Activation ${
        ok ? "reussie" : "echouee"
      } — commandes lancees : verification → ${result.message}`,
      Date.now() - start,
    );
    logs.push(`Activation de ${component}: ${ok ? "OK" : "ECHEC"} — ${result.message}`);
    return { success: ok, logs };
  } else {
    disabled.add(component);
    setDisabledComponents(disabled);
    await logRecovery(
      component,
      "disabled",
      "DISABLE",
      `[ADMIN] Desactivation de ${component} — arret des verifications`,
      Date.now() - start,
    );
    logs.push(`Desactivation de ${component}: OK`);
    return { success: true, logs };
  }
}

export async function runFullCheck(): Promise<CheckResult[]> {
  const disabled = getDisabledComponents();
  const results: CheckResult[] = [];

  for (const comp of ALL_COMPONENTS) {
    if (disabled.has(comp)) {
      results.push({
        component: comp,
        status: "error",
        message: "Composant desactive par l'administrateur",
        durationMs: 0,
        disabled: true,
      });
      continue;
    }
    const r = await checkFns[comp]();
    const action = r.recoveryAction
      ? r.recoverySuccess
        ? "RECOVERY_OK"
        : "RECOVERY_FAIL"
      : "CHECK_OK";
    await logRecovery(
      r.component,
      r.status,
      action,
      r.recoveryAction
        ? `[AUTO] ${r.recoveryAction} — ${r.recoverySuccess ? "succes" : "echec"} : ${r.message}`
        : `Verification OK : ${r.message}`,
      r.durationMs,
    );
    results.push(r);
  }

  return results;
}

export async function recoverComponent(component: string): Promise<CheckResult> {
  const fn = checkFns[component];
  if (!fn) throw new Error(`Composant inconnu: ${component}`);
  const result = await fn();
  const action = result.recoveryAction
    ? result.recoverySuccess ? "RECOVERY_OK" : "RECOVERY_FAIL"
    : "CHECK_OK";
  await logRecovery(
    result.component,
    result.status,
    action,
    result.recoveryAction
      ? `[MANUAL] ${result.recoveryAction} — ${result.recoverySuccess ? "succes" : "echec"} : ${result.message}`
      : `Reparation manuelle : ${result.message}`,
    result.durationMs,
  );
  return result;
}
