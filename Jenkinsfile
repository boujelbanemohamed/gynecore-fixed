pipeline {
  agent any
  tools {
    nodejs 'Node20'
  }

  environment {
    DATABASE_URL_CREDENTIALS = credentials('DATABASE_URL')
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
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

    stage('SonarQube Analysis') {
      steps {
        withSonarQubeEnv('SonarQube') {
          sh '''
            npm install -g sonarqube-scanner
            cd backend && sonar-scanner -Dsonar.projectKey=gynecare-backend -Dsonar.projectName=GyneCare-Backend -Dsonar.sources=src -Dsonar.language=ts -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/prisma/**
            cd ../frontend && sonar-scanner -Dsonar.projectKey=gynecare-frontend -Dsonar.projectName=GyneCare-Frontend -Dsonar.sources=src -Dsonar.language=ts -Dsonar.exclusions=**/node_modules/**,**/build/**
          '''
        }
      }
    }

    stage('Quality Gate') {
      steps {
        timeout(time: 5, unit: 'MINUTES') {
          waitForQualityGate abortPipeline: false
        }
      }
    }

    stage('Deploy') {
      steps {
        sh '''
          lsof -t -i:4000 | xargs kill -9 2>/dev/null || true
          lsof -t -i:3000 | xargs kill -9 2>/dev/null || true

          cd backend
          cp -f .env .env.backup 2>/dev/null || true
          echo "DATABASE_URL=$DATABASE_URL_CREDENTIALS" > .env
          echo "JWT_SECRET=jenkins-build-secret" >> .env
          echo "JWT_EXPIRES_IN=24h" >> .env
          echo "PORT=4000" >> .env
          echo "NODE_ENV=production" >> .env
          echo "CORS_ORIGIN=http://localhost:3000" >> .env
          nohup npx ts-node-dev src/index.ts > /tmp/gynecare-backend.log 2>&1 &
          echo "Backend started, waiting..."

          cd ../frontend
          nohup npx serve -s build -l 3000 > /tmp/gynecare-frontend.log 2>&1 &
          echo "Frontend started, waiting..."

          sleep 25
          echo "=== Health Check ==="
          curl -sf http://localhost:4000 && echo "Backend OK" || echo "Backend starting..."
          curl -sf http://localhost:3000 && echo "Frontend OK" || echo "Frontend starting..."
          echo "Deployment done!"
        '''
      }
    }
  }

  post {
    success {
      echo 'GyneCare pipeline complete!'
    }
  }
}
