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
        sh 'chmod +x deploy.sh && echo "bash $PWD/deploy.sh $PWD $DATABASE_URL_CREDENTIALS" | at now'
      }
    }
  }

  post {
    success {
      echo 'GyneCare pipeline complete!'
    }
  }
}
