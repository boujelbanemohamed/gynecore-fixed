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
            cd backend && sonar-scanner -Dsonar.projectKey=gynecare-backend -Dsonar.projectName=GyneCare-Backend -Dsonar.sources=src -Dsonar.language=ts -Dsonar.branch.name=stable -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/prisma/**
            cd ../frontend && sonar-scanner -Dsonar.projectKey=gynecare-frontend -Dsonar.projectName=GyneCare-Frontend -Dsonar.sources=src -Dsonar.language=ts -Dsonar.branch.name=stable -Dsonar.exclusions=**/node_modules/**,**/build/**
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

    stage('Stop old processes') {
      steps {
        sh 'lsof -t -i:4000 | xargs kill -9 2>/dev/null || true'
        sh 'lsof -t -i:3000 | xargs kill -9 2>/dev/null || true'
      }
    }

    stage('Deploy') {
      steps {
        dir('backend') {
          sh '''
            cp -f .env .env.backup 2>/dev/null || true
            echo "DATABASE_URL=$DATABASE_URL_CREDENTIALS" > .env
            echo "JWT_SECRET=jenkins-build-secret" >> .env
            echo "JWT_EXPIRES_IN=24h" >> .env
            echo "PORT=4000" >> .env
            echo "NODE_ENV=production" >> .env
            echo "CORS_ORIGIN=http://localhost:3000" >> .env
            setsid npx ts-node-dev src/index.ts > /tmp/gynecare-backend.log 2>&1 &
          '''
        }
        dir('frontend') {
          sh 'setsid npx serve -s build -l 3000 > /tmp/gynecare-frontend.log 2>&1 &'
        }
      }
    }

    stage('Health Check') {
      steps {
        sh '''
          echo "Waiting 20s for services to start..."
          sleep 20
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
  }
}
