# GyneCare - Application de Gestion Gynecologie-Obstetrique

## Fonctionnalites

### Portail Medecin / Assistante
- Tableau de bord - Statistiques cliniques
- Gestion des patientes - CRUD complet
- Consultations - Creation et suivi
- Prescriptions - Redaction et gestion
- Rendez-vous - Planification du calendrier
- Documents - Upload de documents medicaux
- Profil medecin - Configuration du cabinet

### Portail Patiente
- Dossier medical - Consultation de ses informations
- Historique des consultations
- Prescriptions actives
- Suivi des rendez-vous

## Stack Technique

| Composant | Technologie | Version |
|---|---|---|
| Frontend | React + TypeScript | 18.2 / 5.3 |
| Backend | Express.js + TypeScript | 4.18 / 5.3 |
| Base de donnees | PostgreSQL | - |
| ORM | Prisma | 5.10 |
| Authentification | JWT + bcryptjs | 9.0 / 2.4 |
| Validation | Zod | 3.22 |

## Installation

### Prerequis
- Node.js >= 18
- PostgreSQL >= 14
- npm >= 9

### 1. Cloner le depot
git clone https://github.com/boujelbanemohamed/gynecore-fixed.git
cd gynecore-fixed

### 2. Installer les dependances
cd frontend && npm install
cd ../backend && npm install

### 3. Configurer l environnement
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

### 4. Initialiser la base de donnees
cd backend
npx prisma migrate dev
npx prisma db seed

### 5. Lancer l application
cd backend && npm run dev    # Terminal 1 (port 4000)
cd frontend && npm start     # Terminal 2 (port 3000)

Acces : http://localhost:3000

## Docker
docker-compose up --build -d
Acces : http://localhost

## Comptes de Test

| Role | Email | Mot de passe |
|---|---|---|
| Medecin | dr.martin@gynecare.fr | Doctor123! |
| Assistante | assistante@gynecare.fr | Assistant123! |
| Patiente | marie.dupont@email.fr | Patient123! |

## Securite
JWT + bcrypt + Helmet + CORS + Rate Limiting + Isolation des donnees

## Licence
Projet prive - Usage professionnel medical uniquement
