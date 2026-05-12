pipeline {
    agent any

    tools {
        nodejs 'node20'
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
                    sh 'npm install'
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
                        nohup npx ts-node-dev src/index.ts > /tmp/gynecare-backend.log 2>&1 &
                        sleep 5
                        echo "Backend started"
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
                        echo "Frontend started"
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'GyneCare deployed successfully!'
        }
        failure {
            echo 'Deployment failed!'
            sh 'cat /tmp/gynecare-backend.log 2>/dev/null || true'
            sh 'cat /tmp/gynecare-frontend.log 2>/dev/null || true'
        }
    }
}
