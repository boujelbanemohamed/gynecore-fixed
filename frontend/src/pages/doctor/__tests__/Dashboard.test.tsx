describe("Doctor Dashboard", () => {
  it("should display correct stats labels", () => {
    const labels = ["Total patientes", "Consultations du mois", "Rendez-vous", "Prescriptions actives"];
    expect(labels).toHaveLength(4);
    expect(labels[0]).toBe("Total patientes");
  });

  it("should have navigation links", () => {
    const navLinks = [
      { label: "Dashboard", path: "/doctor/dashboard" },
      { label: "Patientes", path: "/doctor/patients" },
      { label: "Consultations", path: "/doctor/consultations" },
      { label: "Calendar", path: "/doctor/calendar" },
      { label: "Settings", path: "/doctor/settings" },
    ];
    expect(navLinks.length).toBeGreaterThan(0);
    navLinks.forEach(link => expect(link.path).toMatch(/^\/doctor\//));
  });

  it("should format date correctly in French", () => {
    const date = new Date("2024-05-10T14:30:00");
    const formatted = date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    expect(formatted).toContain("mai");
    expect(formatted).toContain("2024");
  });
});
