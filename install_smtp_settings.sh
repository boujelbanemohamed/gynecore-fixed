#!/bin/bash
set -e

echo "============================================"
echo "  GYNECARE - Installation SMTP Settings UI"
echo "============================================"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR=""
FRONTEND_DIR=""

# Detect project root (look for backend/src AND frontend/src)
for candidate in "$SCRIPT_DIR/.." "$SCRIPT_DIR"; do
  if [ -d "$candidate/backend/src/controllers" ]; then
    BACKEND_DIR="$candidate/backend"
    if [ -d "$candidate/frontend/src/pages/doctor" ]; then
      FRONTEND_DIR="$candidate/frontend"
    fi
    break
  fi
done

if [ -z "$BACKEND_DIR" ]; then
  echo "ERREUR: Placez ce script a la racine du projet Gynecare"
  echo "  (ou executez-le depuis un sous-dossier)"
  echo "  Dossier attendu : backend/src/controllers/"
  exit 1
fi

echo "=> Backend :  $BACKEND_DIR"
echo "=> Frontend : ${FRONTEND_DIR:-non trouve}"
cd "$BACKEND_DIR"

# ── Step 1: Copy new files ──
echo ""
echo "[1/4] Copie des nouveaux fichiers..."
mkdir -p src/controllers src/services

cp "$SCRIPT_DIR/new-backend-files/controllers/smtpController.ts" src/controllers/smtpController.ts
echo "  -> src/controllers/smtpController.ts"

cp "$SCRIPT_DIR/new-backend-files/services/emailService.ts" src/services/emailService.ts
echo "  -> src/services/emailService.ts (version DB-aware)"

if [ -n "$FRONTEND_DIR" ]; then
  cp "$SCRIPT_DIR/new-frontend-files/pages/doctor/SmtpSettings.tsx" "$FRONTEND_DIR/src/pages/doctor/SmtpSettings.tsx"
  echo "  -> frontend/.../SmtpSettings.tsx"
else
  echo "  -> AVERTISSEMENT: frontend/ non trouve"
  echo "     Copiez manuellement SmtpSettings.tsx dans frontend/src/pages/doctor/"
fi

# ── Step 2: Patch existing files ──
echo ""
echo "[2/4] Patch des fichiers existants..."
python3 "$SCRIPT_DIR/patch_settings.py"

# ── Step 3: Prisma generate ──
echo ""
echo "[3/4] Generation Prisma..."
npx prisma generate 2>&1 | tail -3

# ── Step 4: Database migration ──
echo ""
echo "[4/4] Migration de la base de donnees..."
if command -v psql &>/dev/null; then
  # Try to apply SQL directly
  if [ -n "$DATABASE_URL" ]; then
    echo "  => Tentative d'application SQL automatique..."
    psql "$DATABASE_URL" -f "$SCRIPT_DIR/add_smtp_config_table.sql" 2>&1 && \
      echo "  -> Table smtp_configs creee avec succes" || \
      echo "  -> Echec SQL automatique. Executez manuellement :"
  else
    echo "  => DATABASE_URL non defini. Utilisez Prisma :"
  fi
fi
echo ""
echo "  Commandes de migration alternatives :"
echo "    npx prisma db push            (recommande)"
echo "    psql -d gynecare -f add_smtp_config_table.sql"

echo ""
echo "============================================"
echo "  Installation terminee"
echo "============================================"
echo ""
echo "PROCHAINES ETAPES :"
echo ""
echo "  1. Migration DB :"
echo "     cd backend && npx prisma db push"
echo ""
echo "  2. Redemarrer le backend :"
echo "     npm run dev"
echo ""
echo "  3. Ouvrir l'app > Parametres > Configuration SMTP"
echo "  4. Configurer et tester"
