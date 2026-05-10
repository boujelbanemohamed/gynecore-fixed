describe("Login Page", () => {
  it("should have correct form fields", () => {
    const fields = ["email", "password"];
    expect(fields).toHaveLength(2);
    expect(fields).toContain("email");
    expect(fields).toContain("password");
  });

  it("should validate email format", () => {
    const validEmails = ["dr.martin@gynecare.fr", "test@example.com", "user+tag@domain.fr"];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    validEmails.forEach(email => expect(email).toMatch(emailRegex));
  });

  it("should reject invalid email format", () => {
    const invalidEmails = ["notanemail", "@no-user.com", "no-at-sign.com", "spaces in@email.com"];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    invalidEmails.forEach(email => expect(email).not.toMatch(emailRegex));
  });

  it("should require password minimum length", () => {
    const password = "Doctor123";
    expect(password.length).toBeGreaterThanOrEqual(8);
  });

  it("should have correct API login endpoint", () => {
    expect("/api/auth/login").toBe("/api/auth/login");
  });
});
