pipeline {
  agent any

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Build Frontend Docker image') {
      steps {
        sh 'docker build -f frontend/Dockerfile -t frontend:latest frontend'
      }
    }

    stage('Build Backend Docker image') {
      steps {
        sh 'docker build -f backend/Dockerfile -t backend:latest backend'
      }
    }
  }
}
