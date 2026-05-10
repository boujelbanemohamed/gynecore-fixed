import { Request } from "express";
import { prisma } from "../prisma";

export async function logAudit(
  req: Request,
  action: string,
  resource: string,
  resourceId?: string,
  details?: string,
) {
  try {
    const userId = (req as any).user?.userId || "anonymous";
    const userRole = (req as any).user?.role || "unknown";
    const ipAddress = req.ip || req.socket.remoteAddress || "unknown";

    await prisma.auditLog.create({
      data: { userId, userRole, action, resource, resourceId, details, ipAddress },
    });
  } catch (err) {
    console.error("[AuditLog] Erreur:", err);
  }
}
