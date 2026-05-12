#!/bin/bash
WORKSPACE="$1"

lsof -t -i:4000 | xargs kill -9 2>/dev/null || true
lsof -t -i:3000 | xargs kill -9 2>/dev/null || true

DBURL=$(cat /tmp/gynecare-dburl)

cd "$WORKSPACE/backend"
cp -f .env .env.backup 2>/dev/null || true
echo "DATABASE_URL=$DBURL" > .env
echo "JWT_SECRET=jenkins-build-secret" >> .env
echo "JWT_EXPIRES_IN=24h" >> .env
echo "PORT=4000" >> .env
echo "NODE_ENV=production" >> .env
echo "CORS_ORIGIN=http://localhost:3000" >> .env
nohup npx ts-node-dev src/index.ts > /tmp/gynecare-backend.log 2>&1 &

cd "$WORKSPACE/frontend"
nohup npx serve -s build -l 3000 > /tmp/gynecare-frontend.log 2>&1 &

echo "Deploy done at $(date)"
