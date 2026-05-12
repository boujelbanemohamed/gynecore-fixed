#!/bin/bash
WORKSPACE="$1"

lsof -t -i:4000 | xargs kill -9 2>/dev/null || true
lsof -t -i:3000 | xargs kill -9 2>/dev/null || true

launchctl bootout gui/$(id -u)/com.gynecare.backend 2>/dev/null || true
launchctl bootout gui/$(id -u)/com.gynecare.frontend 2>/dev/null || true

DBURL=$(cat /tmp/gynecare-dburl)

cat > /tmp/gynecare-start-backend.sh << BEOF
#!/bin/bash
cd "$WORKSPACE/backend"
echo "DATABASE_URL=$DBURL" > .env
echo "JWT_SECRET=jenkins-build-secret" >> .env
echo "JWT_EXPIRES_IN=24h" >> .env
echo "PORT=4000" >> .env
echo "NODE_ENV=production" >> .env
echo "CORS_ORIGIN=http://localhost:3000" >> .env
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
exec npx ts-node-dev src/index.ts >> /tmp/gynecare-backend.log 2>&1
BEOF

cat > /tmp/gynecare-start-frontend.sh << FEOF
#!/bin/bash
cd "$WORKSPACE/frontend"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
exec npx serve -s build -l 3000 >> /tmp/gynecare-frontend.log 2>&1
FEOF

chmod +x /tmp/gynecare-start-backend.sh /tmp/gynecare-start-frontend.sh

launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.gynecare.backend.plist
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.gynecare.frontend.plist

echo "Deploy done via launchd at $(date)"
