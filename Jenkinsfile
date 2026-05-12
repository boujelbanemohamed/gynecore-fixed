pipeline {
    agent any
    environment {
        PATH = "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${env.PATH}"
        DATABASE_URL = credentials('DATABASE_URL')
    }
    stages {
        stage('Checkout') {
            steps { checkout scm }
        }
        stage('Install Backend') {
            steps {
                dir('backend') { sh 'npm install' }
            }
        }
        stage('Install Frontend') {
            steps {
                dir('frontend') { sh 'npm install --legacy-peer-deps' }
            }
        }
        stage('Build Frontend') {
            steps {
                dir('frontend') { sh 'npm run build' }
            }
        }
        stage('SonarQube Backend') {
            steps {
                dir('backend') {
                    withSonarQubeEnv('SonarQube') {
                        sh "npx sonar-scanner -Dsonar.login=${env.SONAR_TOKEN} -Dsonar.projectKey=gynecare-backend -Dsonar.sources=src -Dsonar.language=ts -Dsonar.typescript.lcov.reportPaths=coverage/lcov.info 2>/dev/null || true"
                    }
                }
            }
        }
        stage('SonarQube Frontend') {
            steps {
                dir('frontend') {
                    withSonarQubeEnv('SonarQube') {
                        sh "npx sonar-scanner -Dsonar.login=${env.SONAR_TOKEN} -Dsonar.projectKey=gynecare-frontend -Dsonar.sources=src -Dsonar.language=ts -Dsonar.exclusions=**/node_modules/** 2>/dev/null || true"
                    }
                }
            }
        }
        stage('Deploy') {
            steps {
                sh 'echo "/Users/mohamedboujelbane/Desktop/gynecare-fixed/restart-services.sh" | at now'
            }
        }
    }
}
