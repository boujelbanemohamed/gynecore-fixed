import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "../prisma";

const forgotSchema = z.object({
  email: z.string().email("Email invalide"),
});

const resetSchema = z.object({
  token: z.string().min(1, "Token requis"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caract\u00e8res"),
});

// Demande de reset - genere un token valide 1h
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = forgotSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Ne pas reveler si l'email existe ou pas (securite)
      return res.json({ success: true, message: "Si un compte existe avec cet email, un lien de reinitialisation a ete envoye." });
    }

    // Generer un token de reset
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const expiresAt = new Date(Date.now() + 3600000); // 1 heure

    // Supprimer les anciens tokens
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    // Creer le nouveau token
    await prisma.passwordResetToken.create({
      data: { userId: user.id, token: hashedToken, expiresAt },
    });

    // En production : envoyer un email ici
    // Pour le moment : afficher le token dans la console
    console.log(`[RESET] Token pour ${email}: ${resetToken}`);

    return res.json({ success: true, message: "Si un compte existe avec cet email, un lien de reinitialisation a ete envoye." });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors[0].message });
    }
    console.error("[forgotPassword] Erreur:", err);
    return res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};

// Verification du token
export const verifyResetToken = async (req: Request, res: Response) => {
  try {
    const { token } = z.object({ token: z.string().min(1) }).parse(req.body);
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const resetEntry = await prisma.passwordResetToken.findFirst({
      where: { token: hashedToken, expiresAt: { gt: new Date() } },
      include: { user: true },
    });

    if (!resetEntry) {
      return res.status(400).json({ success: false, error: "Token invalide ou expire." });
    }

    return res.json({ success: true, data: { email: resetEntry.user.email } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors[0].message });
    }
    console.error("[verifyResetToken] Erreur:", err);
    return res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};

// Nouveau mot de passe
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = resetSchema.parse(req.body);
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const resetEntry = await prisma.passwordResetToken.findFirst({
      where: { token: hashedToken, expiresAt: { gt: new Date() } },
    });

    if (!resetEntry) {
      return res.status(400).json({ success: false, error: "Token invalide ou expire." });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Mettre a jour le mot de passe
    await prisma.user.update({
      where: { id: resetEntry.userId },
      data: { password: hashedPassword },
    });

    // Supprimer le token utilise
    await prisma.passwordResetToken.deleteMany({ where: { userId: resetEntry.userId } });

    return res.json({ success: true, message: "Mot de passe mis a jour avec succes." });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors[0].message });
    }
    console.error("[resetPassword] Erreur:", err);
    return res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};
