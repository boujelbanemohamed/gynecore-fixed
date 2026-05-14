#!/bin/bash
set -e

echo "============================================"
echo "  GYNECARE - Installation SMTP"
echo "============================================"

# Find project root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR=""

# Check current dir, parent dirs, and backend/ subfolder
for candidate in "$SCRIPT_DIR" "$SCRIPT_DIR/.." "$SCRIPT_DIR/backend" "$(dirname "$SCRIPT_DIR")"; do
  if [ -d "$candidate/backend/src/controllers" ]; then
    BACKEND_DIR="$candidate/backend"
    break
  elif [ -d "$candidate/src/controllers" ]; then
    BACKEND_DIR="$candidate"
    break
  fi
done

if [ -z "$BACKEND_DIR" ]; then
  echo "ERREUR: Repertoire backend non trouve."
  echo "Placez ce script a la racine du projet et relancez-le."
  echo "  Repertoires verifis :"
  echo "    $SCRIPT_DIR"
  echo "    $SCRIPT_DIR/.."
  echo "    $SCRIPT_DIR/backend"
  exit 1
fi

echo "=> Backend detecte : $BACKEND_DIR"
cd "$BACKEND_DIR"

# Step 1: Install nodemailer
echo ""
echo "[1/3] Installation de nodemailer..."
npm install nodemailer @types/nodemailer

# Step 2: Copy email service
echo "[2/3] Creation du service email..."
mkdir -p src/services
SCRIPT_LOC="$(cd "$(dirname "$0")" && pwd)"

for search_path in \
  "$SCRIPT_LOC/src/services/emailService.ts" \
  "$SCRIPT_LOC/../src/services/emailService.ts" \
  "$(dirname "$SCRIPT_LOC")/src/services/emailService.ts"; do
  if [ -f "$search_path" ]; then
    cp "$search_path" src/services/emailService.ts
    echo "  -> src/services/emailService.ts copie depuis $search_path"
    break
  fi
done

if [ ! -f src/services/emailService.ts ]; then
  echo "  -> ERREUR: Fichier emailService.ts non trouve"
  echo "  -> Placez-le a cote de install_smtp.sh dans src/services/"
  exit 1
fi

# Step 3: Patch controllers using Python
echo "[3/3] Patch des controllers..."
PATCHER=""
for search_path in \
  "$SCRIPT_LOC/patch_controllers.py" \
  "$SCRIPT_LOC/../patch_controllers.py"; do
  if [ -f "$search_path" ]; then
    PATCHER="$search_path"
    break
  fi
done

if [ -n "$PATCHER" ]; then
  python3 "$PATCHER"
else
  echo "  -> ERREUR: patch_controllers.py non trouve a cote du script"
  exit 1
fi

echo ""
echo "============================================"
echo "  Installation SMTP terminee avec succes"
echo "============================================"
echo ""
echo "PROCHAINE ETAPE : Configurez votre fichier .env"
echo ""
echo "  Ajoutez ces lignes a backend/.env :"
echo ""
echo "  # === SMTP Configuration ==="
echo "  SMTP_HOST=smtp.gmail.com"
echo "  SMTP_PORT=587"
echo "  SMTP_SECURE=false"
echo "  SMTP_USER=votre-email@gmail.com"
echo "  SMTP_PASS=votre-mot-de-passe-app"
echo "  SMTP_FROM_NAME=GyneCare"
echo "  SMTP_FROM_EMAIL=votre-email@gmail.com"
echo "  FRONTEND_URL=http://localhost:3000"
echo ""
echo "  Pour Gmail :"
echo "  1. Activez la verification en 2 etapes"
echo "  2. Creez un Mot de passe d'application :"
echo "     https://myaccount.google.com/apppasswords"
echo ""
echo "  Pour Outlook/Office365 :"
echo "  SMTP_HOST=smtp.office365.com"
echo "  SMTP_PORT=587"
echo ""
echo "  Puis redemarrez le serveur : npm run dev"
