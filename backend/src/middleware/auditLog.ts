import { Request, Response, NextFunction } from "express";
import { logAudit } from "../services/auditService";

export const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.on("finish", () => {
    if (!["GET", "OPTIONS", "HEAD"].includes(req.method) && res.statusCode < 400 && (req as any).user) {
      const segments = req.originalUrl.split("/").filter(Boolean);
      const resource = segments.slice(1).join("/") || req.originalUrl;
      let methodAction = req.method;
      if (req.method === "POST") methodAction = "CREATE";
      else if (req.method === "PUT") methodAction = "UPDATE";
      else if (req.method === "DELETE") methodAction = "DELETE";
      logAudit(req, `${methodAction}_${resource.toUpperCase()}`, resource).catch(() => {});
    }
  });
  next();
};
