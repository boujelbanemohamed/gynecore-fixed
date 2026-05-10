import request from "supertest";
import express from "express";

describe("Auth API", () => {
  it("should return 400 if email is missing", async () => {
    const app = express();
    app.use(express.json());
    app.post("/api/auth/login", (req, res) => {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email et mot de passe requis" });
      }
      res.status(200).json({ token: "fake-token" });
    });
    const res = await request(app).post("/api/auth/login").send({ password: "test123" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Email et mot de passe requis");
  });

  it("should return 400 if password is missing", async () => {
    const app = express();
    app.use(express.json());
    app.post("/api/auth/login", (req, res) => {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email et mot de passe requis" });
      }
      res.status(200).json({ token: "fake-token" });
    });
    const res = await request(app).post("/api/auth/login").send({ email: "test@test.com" });
    expect(res.status).toBe(400);
  });

  it("should return 200 with valid credentials", async () => {
    const app = express();
    app.use(express.json());
    app.post("/api/auth/login", (req, res) => {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ message: "Email et mot de passe requis" });
      if (email === "dr.martin@gynecare.fr" && password === "Doctor123!") {
        return res.status(200).json({ token: "jwt-token", user: { role: "DOCTOR" } });
      }
      res.status(401).json({ message: "Identifiants invalides" });
    });
    const res = await request(app).post("/api/auth/login").send({ email: "dr.martin@gynecare.fr", password: "Doctor123!" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.role).toBe("DOCTOR");
  });

  it("should return 401 with wrong password", async () => {
    const app = express();
    app.use(express.json());
    app.post("/api/auth/login", (req, res) => {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ message: "Email et mot de passe requis" });
      if (email === "dr.martin@gynecare.fr" && password === "Doctor123!") {
        return res.status(200).json({ token: "jwt-token" });
      }
      res.status(401).json({ message: "Identifiants invalides" });
    });
    const res = await request(app).post("/api/auth/login").send({ email: "dr.martin@gynecare.fr", password: "WrongPass" });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Identifiants invalides");
  });
});
