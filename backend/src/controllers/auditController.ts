import { Request, Response } from "express";
import { prisma } from "../prisma";

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const resource = req.query.resource as string;
    const userId = req.query.userId as string;

    const where: any = {};
    if (resource) where.resource = resource;
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return res.json({
      success: true,
      data: { logs, total, page, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[getAuditLogs] Erreur:", err);
    return res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};
