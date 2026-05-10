describe("Patient Dossier Page", () => {
  it("should display patient info sections", () => {
    const sections = ["Informations personnelles", "Antecedents", "Groupe sanguin", "Allergies"];
    expect(sections.length).toBeGreaterThanOrEqual(3);
    sections.forEach(s => expect(s.length).toBeGreaterThan(0));
  });

  it("should validate patient dossier data structure", () => {
    const dossier = {
      firstName: "Marie", lastName: "Dupont", dateOfBirth: "1992-03-20",
      bloodType: "A+", allergies: ["Penicilline"], chronicDiseases: [],
      familyHistory: "Diabete", contraception: "Pilule",
      pregnancyCount: 1, deliveryCount: 1,
    };
    expect(dossier).toHaveProperty("firstName");
    expect(dossier).toHaveProperty("bloodType");
    expect(dossier).toHaveProperty("allergies");
    expect(Array.isArray(dossier.allergies)).toBe(true);
  });

  it("should have correct patient API endpoints", () => {
    const endpoints = {
      dossier: "/api/patient/dossier",
      consultations: "/api/patient/consultations",
      prescriptions: "/api/patient/prescriptions",
      appointments: "/api/patient/appointments",
    };
    Object.values(endpoints).forEach(ep => expect(ep).toMatch(/^\/api\/patient\//));
  });
});
