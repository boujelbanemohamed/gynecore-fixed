#!/bin/bash
set -e

echo "============================================"
echo "  GYNECARE - Pages supplementaires"
echo "  Mot de passe perdu + Journal d'audit"
echo "============================================"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT=""

for candidate in "$SCRIPT_DIR/.." "$SCRIPT_DIR"; do
  if [ -d "$candidate/backend/src/controllers" ] && [ -d "$candidate/frontend/src/pages" ]; then
    PROJECT_ROOT="$candidate"
    break
  fi
done

if [ -z "$PROJECT_ROOT" ]; then
  echo "ERREUR: Projet non trouve."
  echo "Placez le dossier a la racine de Gynecare."
  exit 1
fi

cd "$PROJECT_ROOT"

# 1. Copy new page files
echo ""
echo "[1/3] Copie des nouvelles pages..."

mkdir -p frontend/src/pages/shared 2>/dev/null || true

SCRIPT="$SCRIPT_DIR"
CP_SHARED="$SCRIPT/pages-shared"
CP_DOCTOR="$SCRIPT/pages-doctor"

if [ ! -d "$CP_SHARED" ]; then
  for candidate in "$SCRIPT/../pages-shared" "$SCRIPT_DIR/pages-shared"; do
    [ -d "$candidate" ] && CP_SHARED="$candidate" && break
  done
fi
if [ ! -d "$CP_DOCTOR" ]; then
  for candidate in "$SCRIPT/../pages-doctor" "$SCRIPT_DIR/pages-doctor"; do
    [ -d "$candidate" ] && CP_DOCTOR="$candidate" && break
  done
fi

if [ ! -d "$CP_SHARED" ] || [ ! -d "$CP_DOCTOR" ]; then
  echo "ERREUR: Dossiers pages-shared/ et pages-doctor/ non trouves a cote du script."
  exit 1
fi

cp "$CP_SHARED/ForgotPassword.tsx" frontend/src/pages/shared/ForgotPassword.tsx
echo "  -> ForgotPassword.tsx"

cp "$CP_SHARED/ResetPassword.tsx" frontend/src/pages/shared/ResetPassword.tsx
echo "  -> ResetPassword.tsx"

cp "$CP_DOCTOR/AuditLogs.tsx" frontend/src/pages/doctor/AuditLogs.tsx
echo "  -> AuditLogs.tsx"

# 2. Patch existing files
echo ""
echo "[2/3] Patch des fichiers existants..."
python3 "$SCRIPT_DIR/patch_pages.py"

# 3. Done
echo ""
echo "============================================"
echo "  Installation terminee"
echo "============================================"
echo ""
echo "PROCHAINES ETAPES :"
echo ""
echo "  1. Redemarrez le frontend :"
echo "     cd frontend && npm start"
echo ""
echo "  2. Nouvelles pages disponibles :"
echo "     - /forgot-password       (lien mot de passe oublie)"
echo "     - /reset-password?token=X (page nouveau mot de passe)"
echo "     - /audit-logs             (journal d'audit dans le menu)"
echo ""
echo "  3. Les 3 pages de login ont maintenant un lien"
echo '     "Mot de passe oublie ?"'
