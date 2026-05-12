import re

# === 1. Ajouter getUnavailableSlots à secretaryAPI ===
filepath = 'frontend/src/services/api.ts'
with open(filepath, 'r') as f:
    content = f.read()

# Trouver la fin de secretaryAPI et ajouter la méthode
# Chercher un pattern près de la fin de secretaryAPI
secretary_unavail = "  getUnavailableSlots: (params?: any) => api.get('/secretary/unavailable-slots', { params }),"

# Ajouter après la dernière méthode de secretaryAPI
# On cherche la fin de secretaryAPI (avant doctorAPI)
if 'getUnavailableSlots' not in content.split('doctorAPI')[0]:
    # Ajouter avant le doctorAPI
    content = content.replace(
        'export const doctorAPI',
        secretary_unavail + '\n\nexport const doctorAPI'
    )
    print('1. secretaryAPI.getUnavailableSlots ajoute')
else:
    print('1. deja present dans secretaryAPI')

with open(filepath, 'w') as f:
    f.write(content)

# === 2. Ajouter les indisponibilites dans le Calendar secretaire ===
filepath2 = 'frontend/src/pages/secretary/Calendar.tsx'
with open(filepath2, 'r') as f:
    cal = f.read()

# 2a. Ajouter le state pour les indisponibilites
if 'unavailSlots' not in cal:
    cal = cal.replace(
        "const [form, setForm]",
        "const [unavailSlots, setUnavailSlots] = useState<any[]>([]);\n  const [form, setForm]"
    )
    print('2a. State unavailSlots ajoute')

# 2b. Ajouter le fetch des indisponibilites dans fetchAppointments
if 'unavailable-slots' not in cal:
    old_fetch = """    try {
      const res = await secretaryAPI.getAppointments();
      setAppointments(res.data.data.appointments);
    } catch {}"""
    new_fetch = """    try {
      const res = await secretaryAPI.getAppointments();
      setAppointments(res.data.data.appointments);
      const resU = await secretaryAPI.getUnavailableSlots();
      setUnavailSlots(resU.data.data || []);
    } catch {}"""
    cal = cal.replace(old_fetch, new_fetch)
    print('2b. Fetch indisponibilites ajoute')

with open(filepath2, 'w') as f:
    f.write(cal)

print('\nTermine !')
