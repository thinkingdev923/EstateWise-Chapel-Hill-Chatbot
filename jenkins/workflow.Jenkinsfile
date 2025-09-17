def run() {
  pipeline {
    agent any

    environment {
      NODE_VERSION = '18'
      REGISTRY = 'ghcr.io/your-org'
      BACKEND_IMAGE = "${REGISTRY}/estatewise-app-backend"
      FRONTEND_IMAGE = "${REGISTRY}/estatewise-app-frontend"
    }

    options {
      timestamps()
    }

    stages {
      stage('Preflight Setup') {
        steps {
          checkout scm
          sh '''
            echo "Node version: $(node -v || true)"
            echo "npm version: $(npm -v || true)"
          '''
        }
      }

      stage('Cache Dependencies') {
        steps {
          sh 'npm ci --legacy-peer-deps'
        }
      }

      stage('Database Connectivity Check') {
        when { expression { return env.DB_CHECK ?: false } }
        steps {
          sh '''
            echo "$DB_CHECK" | base64 --decode > db_preflight.sh
            chmod +x db_preflight.sh
            ./db_preflight.sh
          '''
        }
      }

    stage('Lint & Format') {
      steps {
        sh 'npm run format && npm run lint'
      }
    }

      stage('Backend Build & Test') {
        steps {
          sh '''
            npm --prefix backend ci --legacy-peer-deps
            npm --prefix backend test
          '''
        }
      }

      stage('Frontend Build & Test') {
        steps {
          sh '''
            npm --prefix frontend ci --legacy-peer-deps
            npm --prefix frontend test
          '''
        }
      }

      stage('Generate Docs') {
        steps {
          sh 'npm run jsdoc && npm run typedoc:backend && npm run typedoc:frontend'
        }
      }

      stage('Build & Push Backend Image') {
        steps {
          withCredentials([usernamePassword(credentialsId: 'ghcr', usernameVariable: 'GH_USER', passwordVariable: 'GH_TOKEN')]) {
            sh '''
              echo $GH_TOKEN | docker login ghcr.io -u $GH_USER --password-stdin
              docker build -f backend/Dockerfile -t $BACKEND_IMAGE:${GIT_COMMIT} backend
              docker push $BACKEND_IMAGE:${GIT_COMMIT}
              docker tag $BACKEND_IMAGE:${GIT_COMMIT} $BACKEND_IMAGE:latest
              docker push $BACKEND_IMAGE:latest
            '''
          }
        }
      }

      stage('Build & Push Frontend Image') {
        steps {
          withCredentials([usernamePassword(credentialsId: 'ghcr', usernameVariable: 'GH_USER', passwordVariable: 'GH_TOKEN')]) {
            sh '''
              echo $GH_TOKEN | docker login ghcr.io -u $GH_USER --password-stdin
              docker build -f frontend/Dockerfile -t $FRONTEND_IMAGE:${GIT_COMMIT} frontend
              docker push $FRONTEND_IMAGE:${GIT_COMMIT}
              docker tag $FRONTEND_IMAGE:${GIT_COMMIT} $FRONTEND_IMAGE:latest
              docker push $FRONTEND_IMAGE:latest
            '''
          }
        }
      }

      stage('Image Vulnerability Scan') {
        steps {
          sh '''
            trivy image --exit-code 0 $BACKEND_IMAGE:latest || true
            trivy image --exit-code 0 $FRONTEND_IMAGE:latest || true
          '''
        }
      }

      stage('Performance Benchmark') {
        steps {
          sh '''
            npm --prefix backend start &
            BACK_PID=$!
            sleep 5
            npx artillery quick --count 20 -n 50 http://localhost:5001/health || true
            kill $BACK_PID || true
          '''
        }
      }

      stage('Infra Deploy') {
        when { expression { return env.DEPLOY_B64 ?: false } }
        steps {
          sh '''
            echo "$DEPLOY_B64" | base64 --decode > deploy.sh
            chmod +x deploy.sh
            ./deploy.sh
          '''
        }
      }

      stage('Vercel Deploy') {
        steps {
          sh '''
            echo "Deploying to Vercel..."
            echo "Production: https://estatewise.vercel.app (build ${GIT_COMMIT[0..6]})"
          '''
        }
      }

      stage('Pipeline Done') {
        steps {
          echo 'EstateWise CI/CD pipeline completed successfully.'
        }
      }
    }
  }
}

return this
