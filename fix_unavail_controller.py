filepath = 'backend/src/controllers/unavailableSlotController.ts'
with open(filepath, 'r') as f:
    content = f.read()

# Remplacer getDoctorId pour gerer secretary ET doctor
old_get = """// Obtenir l'ID du médecin depuis le JWT
const getDoctorId = (req: Request): string => (req as any).user.userId;"""

new_get = """// Obtenir l'ID du médecin depuis le JWT (fonctionne pour DOCTOR et SECRETARY)
const getDoctorId = async (req: Request): Promise<string> => {
  const user = (req as any).user;
  if (user.role === 'DOCTOR') return user.userId;
  // Pour la secretaire, chercher son doctorId
  const u = await prisma.user.findUnique({ where: { id: user.userId }, select: { doctorId: true } });
  if (!u?.doctorId) throw new Error('Secretaire non associee a un medecin');
  return u.doctorId;
};"""

content = content.replace(old_get, new_get)

# Maintenant getDoctorId est async, il faut ajouter await devant chaque appel
content = content.replace('const doctorId = getDoctorId(req);', 'const doctorId = await getDoctorId(req);')

with open(filepath, 'w') as f:
    f.write(content)
print('Done')
