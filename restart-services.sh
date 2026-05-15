#!/bin/bash
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"
export HOME="/Users/mohamedboujelbane"
lsof -t -i:4000 | xargs kill -9 2>/dev/null
lsof -t -i:3000 | xargs kill -9 2>/dev/null
sleep 2
cd /Users/mohamedboujelbane/Desktop/gynecare-fixed/backend
# Source from .env file if it exists, otherwise use defaults
if [ -f .env ]; then
  source .env 2>/dev/null
fi
export DATABASE_URL="${DATABASE_URL:-postgresql://localhost:5432/gynecare_db}"
export JWT_SECRET="${JWT_SECRET:-}"
export JWT_EXPIRES_IN="24h"
export PORT=4000
export NODE_ENV=production
export CORS_ORIGIN="http://localhost:3000"
nohup npx ts-node-dev src/index.ts > /tmp/gynecare-backend.log 2>&1 &
sleep 3
cd /Users/mohamedboujelbane/Desktop/gynecare-fixed/frontend
nohup npx serve -s build --single -l 3000 > /tmp/gynecare-frontend.log 2>&1 &
echo "OK" > /tmp/gynecare-deploy-status.txt
