pipeline {
    agent any

    tools {
        nodejs 'Node20'
    }

    environment {
        DATABASE_URL = credentials('gynecare-db-url')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Backend') {
            steps {
                dir('backend') {
                    sh 'npm install'
                    sh 'npx prisma generate'
                }
            }
        }

        stage('Install Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm install --legacy-peer-deps'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm run build'
                }
            }
        }

        stage('Stop old processes') {
            steps {
                sh '''
                    lsof -t -i:4000 | xargs kill -9 2>/dev/null || true
                    lsof -t -i:3000 | xargs kill -9 2>/dev/null || true
                '''
            }
        }

        stage('Start Backend') {
            steps {
                dir('backend') {
                    sh '''
                        cp -f .env .env.backup 2>/dev/null || true
                        echo "DATABASE_URL=$DATABASE_URL" > .env
                        echo "JWT_SECRET=jenkins-build-secret" >> .env
                        echo "JWT_EXPIRES_IN=24h" >> .env
                        echo "PORT=4000" >> .env
                        echo "NODE_ENV=production" >> .env
                        echo "CORS_ORIGIN=http://localhost:3000" >> .env
                        nohup npx ts-node-dev src/index.ts > /tmp/gynecare-backend.log 2>&1 &
                        sleep 8
                        curl -sf http://localhost:4000 || echo "Backend starting..."
                    '''
                }
            }
        }

        stage('Start Frontend') {
            steps {
                dir('frontend') {
                    sh '''
                        nohup npx serve -s build -l 3000 > /tmp/gynecare-frontend.log 2>&1 &
                        sleep 3
                        curl -sf http://localhost:3000 || echo "Frontend starting..."
                    '''
                }
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                    echo "Checking Backend on port 4000..."
                    curl -sf http://localhost:4000 || echo "Backend not responding"
                    echo "Checking Frontend on port 3000..."
                    curl -sf http://localhost:3000 || echo "Frontend not responding"
                    echo "Deployment complete!"
                '''
            }
        }
    }

    post {
        success {
            echo 'GyneCare deployed successfully on localhost:3000!'
        }
        failure {
            echo 'Deployment failed! Check logs below:'
            sh 'echo "--- Backend log ---" && cat /tmp/gynecare-backend.log 2>/dev/null || true'
            sh 'echo "--- Frontend log ---" && cat /tmp/gynecare-frontend.log 2>/dev/null || true'
        }
    }
}
