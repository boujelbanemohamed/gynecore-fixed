#!/bin/bash
# GyneCare — Installation automatique (macOS)
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}   GyneCare — Installation automatique${NC}"
echo -e "${GREEN}=============================================${NC}"

# 1. Vérifications
echo -e "${YELLOW}[1/7] Vérifications...${NC}"

if [[ "$OSTYPE" != "darwin"* ]]; then
  echo -e "${RED}Ce script est pour macOS.${NC}"
  exit 1
fi

if ! command -v brew &> /dev/null; then
  echo -e "${YELLOW}Installation de Homebrew...${NC}"
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

if ! command -v node &> /dev/null; then
  brew install node@20
else
  echo -e "${GREEN}  Node.js $(node -v) OK${NC}"
fi

# 2. PostgreSQL
echo -e "${YELLOW}[2/7] PostgreSQL...${NC}"
if command -v psql &> /dev/null; then
  echo -e "${GREEN}  PostgreSQL déjà installé${NC}"
else
  brew install postgresql@16
  brew link postgresql@16 --force
  brew services start postgresql@16
  sleep 5
  createuser -s "$(whoami)" 2>/dev/null || true
fi

brew services start postgresql@16
sleep 2

if ! pg_isready -q; then
  echo -e "${RED}PostgreSQL ne répond pas. Relancez : brew services restart postgresql@16${NC}"
  exit 1
fi
echo -e "${GREEN}  PostgreSQL OK${NC}"

# 3. Base de données
echo -e "${YELLOW}[3/7] Création base de données...${NC}"
if psql -lqt 2>/dev/null | cut -d\| -f1 | grep -qw gynecare_db; then
  echo -e "${GREEN}  gynecare_db existe déjà${NC}"
else
  createdb gynecare_db
  echo -e "${GREEN}  gynecare_db créée${NC}"
fi

# 4. Dépendances
echo -e "${YELLOW}[4/7] npm install...${NC}"
cd ~/Desktop/gynecare-fixed
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
echo -e "${GREEN}  Dépendances OK${NC}"

# 5. Config .env
echo -e "${YELLOW}[5/7] Configuration .env...${NC}"
cat > backend/.env << EOF
DATABASE_URL="postgresql://$(whoami)@localhost:5432/gynecare_db"
JWT_SECRET="gynecare-super-secret-jwt-key-2024-production-ok"
JWT_EXPIRES_IN="24h"
JWT_PATIENT_EXPIRES_IN="12h"
PORT=4000
NODE_ENV=development
CORS_ORIGIN="http://localhost:3000"
EOF
echo -e "${GREEN}  .env configuré${NC}"

# 6. Migration + Seed
echo -e "${YELLOW}[6/7] Migration Prisma...${NC}"
cd ~/gynecare-fixed/backend
npx prisma migrate deploy

echo -e "${YELLOW}  Données de test...${NC}"
npx ts-node src/prisma/seed.ts
echo -e "${GREEN}  Base de données prête${NC}"

# 7. Terminé
echo ""
echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}   Installation terminée !${NC}"
echo -e "${GREEN}=============================================${NC}"
echo ""
echo "Ouvrez 2 terminaux :"
echo ""
echo "  Terminal 1 : cd ~/gynecare-fixed/backend && npm run dev"
echo "  Terminal 2 : cd ~/gynecare-fixed/frontend && npm start"
echo ""
echo "Puis ouvrez http://localhost:3000"
echo ""
echo "Comptes :"
echo "  Medecin   : dr.martin@gynecare.fr / Doctor123!"
echo "  Assistante: assistante@gynecare.fr / Assistant123!"
echo "  Patient 1 : camille.bernard@email.fr / Patient123!"
echo "  Patient 2 : lea.moreau@email.fr / Patient123!"
