# GyneCare - Suivi du Projet
> Derniere mise a jour : 14 mai 2026

## Infos
- Repo : https://github.com/boujelbanemohamed/gynecore-fixed
- Branche : main
- Local : ~/Desktop/gynecare-fixed/
- Stack : React 18 + TypeScript (frontend) | Express + TypeScript + Prisma + PostgreSQL (backend)

## Commits Recents
- 625d607 : feat: dynamic maternity leave fields + auto-calc duration by type
- b16bc3a : fix: remove browser headers/footers from print and prevent blank 2nd page
- 68e7895 : fix: update pregnancy cert print labels - full names for terme and DPA
- 1344a23 : feat: display time alongside date in certificates/consultations/prescriptions lists
- b7cbe0b : feat: pregnancy work cert - duration with text or date option
- 0517768 : fix: pregnancy cert print both duration text and date
- 5a86370 : fix: pregnancy work cert - better labels + date picker for duration
- bde5817 : feat: auto-calculate medical rest duration from start/end dates
- 7aa8cd9 : fix: certificate print layout truncated - CSS + field mapping

## Fichiers Cles
- frontend/src/pages/doctor/PatientDetail.tsx : page principale patient
- backend/src/controllers/certificateController.ts : CRUD certificats
- backend/src/controllers/passwordResetController.ts : reset mot de passe
- backend/src/controllers/auditController.ts : logs d audit
- backend/src/services/auditService.ts : service log audit
- backend/prisma/schema.prisma : models DB

## Fonctions Importantes dans PatientDetail.tsx
- updCert() : mise a jour formulaire certificat + auto-calcul duree
- getCertFields() : champs dynamiques MATERNITY_LEAVE selon leaveType
- PRINT_CSS : CSS impression A4 (margin:0, height:auto, overflow:hidden)

## Modifications Effectuees
1. MEDICAL_REST : auto-calc duree (endDate - startDate en jours)
2. PREGNANCY_WORK : labels completes + duree texte libre OU date
3. MATERNITY_LEAVE : champs dynamiques par type + auto-calc duree
4. Impression : CSS reecrit, supprime en-tetes navigateur + page blanche
5. Listes : heure affichee a cote de la date

## Etapes Restantes
1. CI/CD GitHub Actions (bloque - facturation)
2. Pages frontend reset password et audit logs
3. Configuration email reset password
4. Deploiement en production
