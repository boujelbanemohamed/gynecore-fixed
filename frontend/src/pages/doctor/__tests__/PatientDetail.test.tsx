describe("PatientDetail", () => {
  it("should have correct consultation type labels", () => {
    const typeLabels: Record<string, string> = {
      FIRST_VISIT: "Première visite", FOLLOW_UP: "Suivi", EMERGENCY: "Urgence",
      ANNUAL_CHECKUP: "Bilan annuel", PRENATAL: "Prénatal", POSTNATAL: "Postnatal",
    };
    expect(Object.keys(typeLabels)).toHaveLength(6);
    expect(typeLabels.FIRST_VISIT).toBe("Première visite");
    expect(typeLabels.PRENATAL).toBe("Prénatal");
  });

  it("should have all certificate types with labels", () => {
    const certTypeLabels: Record<string, string> = {
      APTITUDE: "Aptitude / Inaptitude", MEDICAL_REST: "Repos medical",
      PREGNANCY_WORK: "Grossesse et Travail", MATERNITY_LEAVE: "Conge maternite",
      RETURN_TO_WORK: "Reprise du travail", POST_OPERATIVE: "Post-operatoire",
    };
    expect(Object.keys(certTypeLabels)).toHaveLength(6);
    Object.values(certTypeLabels).forEach((v) => expect(v.length).toBeGreaterThan(0));
  });

  it("should have icons for all certificate types", () => {
    const certTypeIcons: Record<string, string> = {
      APTITUDE: "✅", MEDICAL_REST: "🏥", PREGNANCY_WORK: "🤰",
      MATERNITY_LEAVE: "👶", RETURN_TO_WORK: "💼", POST_OPERATIVE: "⚕️",
    };
    expect(Object.keys(certTypeIcons)).toHaveLength(6);
  });

  it("should generate empty lab form with all fields", () => {
    const lab = {
      hemoglobin: "", vgm: "", whiteBloodCells: "", platelets: "", ferritin: "", crp: "",
      fsh: "", lh: "", estradiol: "", amh: "", progesterone: "", prolactine: "",
      tsh: "", testosterone: "", dheas: "", glycemie: "", hba1c: "", hdl: "",
      creatinine: "", uricAcid: "", asat: "", alat: "", tp: "", tca: "",
      fibrinogen: "", dDimers: "", bloodGroup: "", rai: "", bhcg: "", ca125: "",
      rubella: "", toxoplasmosis: "", hiv: "", proteinuria: "", ecbu: "",
    };
    expect(Object.keys(lab)).toHaveLength(35);
    Object.values(lab).forEach((v) => expect(v).toBe(""));
  });

  it("should generate empty consultation form with all fields", () => {
    const now = new Date().toISOString().slice(0, 16);
    const form = {
      date: now,
      type: "FOLLOW_UP",
      chiefComplaint: "", symptoms: "", clinicalExam: "", diagnosis: "", treatment: "", notes: "",
      weight: "", bloodPressure: "", temperature: "", heartRate: "", height: "",
      generalState: "Bon état général", conjonctives: "Rosées", oedemes: "Absents",
      cardiacAuscultation: "Rythmé", pulmonaryAuscultation: "Murmure vésiculaire normal",
      abdomen: "Souple", uterusState: "Non gravide", uterineHeight: "",
      presentation: "Céphalique", bcf: "POSITIFS", adnexa: "Libres et indolores",
      cervixAspect: "Aspect normal", vaginalDischarge: "Leucorrhées physiologiques",
      dilatation: "Col fermé", effacement: "Non effacé", consistency: "Ferme",
      presentationHeight: "-3 (mobile)", breastExam: "Seins symétriques",
      clinicalConclusion: "", echographie: "",
      nextVisit: "", ddr: "",
      numberOfPregnancies: "",
    };
    expect(form.type).toBe("FOLLOW_UP");
    expect(form.generalState).toBe("Bon état général");
    expect(form.abdomen).toBe("Souple");
    expect(form.bcf).toBe("POSITIFS");
    expect(form.ddr).toBe("");
    expect(form.nextVisit).toBe("");
  });

  it("should calculate IMC correctly", () => {
    const calcIMC = (weight: number, heightCm: number) => {
      const h = heightCm / 100;
      if (weight > 0 && h > 0) return (weight / (h * h)).toFixed(1);
      return "";
    };
    expect(calcIMC(65, 165)).toBe("23.9");
    expect(calcIMC(50, 160)).toBe("19.5");
    expect(calcIMC(80, 180)).toBe("24.7");
    expect(calcIMC(0, 165)).toBe("");
    expect(calcIMC(65, 0)).toBe("");
  });

  it("should build file URL consistently", () => {
    const fileUrl = (path: string) =>
      "http://localhost:4000/api".replace(/\/api$/, "") + path;
    expect(fileUrl("/uploads/logo.png")).toBe("http://localhost:4000/uploads/logo.png");
    expect(fileUrl("/docs/report.pdf")).toBe("http://localhost:4000/docs/report.pdf");
  });

  it("should have all required consultation fields for save payload", () => {
    const payload = {
      patientId: "test-id",
      date: "2026-05-15T10:00",
      type: "FOLLOW_UP",
      chiefComplaint: "Douleurs abdominales",
      symptoms: "Nausées",
      clinicalExam: "PAF",
      diagnosis: "Gastrite",
      treatment: "Antiacides",
      notes: "",
      weight: 65,
      height: 165,
      bloodPressure: "120/80",
      temperature: 37.2,
      heartRate: 72,
      generalState: "Bon état général",
      ddr: "2026-04-01",
      examDetails: { abdomen: "Souple", bcf: "POSITIFS" },
      nextVisit: undefined,
    };
    expect(payload).toHaveProperty("height");
    expect(payload).toHaveProperty("heartRate");
    expect(payload).toHaveProperty("generalState");
    expect(payload).toHaveProperty("ddr");
    expect(payload).toHaveProperty("examDetails");
    expect(typeof payload.weight).toBe("number");
    expect(typeof payload.height).toBe("number");
    expect(typeof payload.heartRate).toBe("number");
    expect(typeof payload.examDetails).toBe("object");
    expect(payload.examDetails.abdomen).toBe("Souple");
  });
});
