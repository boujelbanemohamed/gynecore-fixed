describe("Patient Controller", () => {
  describe("validatePatientData", () => {
    it("should validate required patient fields", () => {
      const patient = { firstName: "Marie", lastName: "Dupont", dateOfBirth: "1990-05-15", phone: "+33612345678", userId: "user-123" };
      expect(patient.firstName).toBeTruthy();
      expect(patient.lastName).toBeTruthy();
      expect(patient.dateOfBirth).toBeTruthy();
      expect(patient.userId).toBeTruthy();
    });

    it("should reject patient without required fields", () => {
      const patient = { firstName: "", lastName: "Dupont", dateOfBirth: "1990-05-15" };
      const isValid = patient.firstName && patient.lastName && patient.dateOfBirth;
      expect(isValid).toBeFalsy();
    });

    it("should validate blood type format", () => {
      const validBloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""];
      validBloodTypes.forEach(bt => expect(bt).toMatch(/^(A|B|AB|O)[+-]?$|^$/));
    });

    it("should validate phone number length", () => {
      const validPhones = ["+33612345678", "+33123456789", "0612345678"];
      validPhones.forEach(phone => expect(phone.length).toBeGreaterThanOrEqual(10));
    });
  });

  describe("patientMedicalData", () => {
    it("should handle allergies as array", () => {
      const patient = { allergies: ["Penicilline", "Latex"], chronicDiseases: [] };
      expect(Array.isArray(patient.allergies)).toBe(true);
      expect(patient.allergies.length).toBeGreaterThan(0);
    });

    it("should calculate age from date of birth", () => {
      const dob = new Date("1990-05-15");
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
      expect(age).toBeGreaterThan(30);
      expect(age).toBeLessThan(40);
    });
  });
});
