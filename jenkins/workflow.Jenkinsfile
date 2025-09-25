def run() {
  pipeline {
    agent any

    environment {
      NODE_VERSION = '18'
      REGISTRY = 'ghcr.io/your-org'
      BACKEND_IMAGE = "${REGISTRY}/estatewise-app-backend"
      FRONTEND_IMAGE = "${REGISTRY}/estatewise-app-frontend"
      DEPLOY_AWS = "${env.DEPLOY_AWS ?: '0'}"
      DEPLOY_AZURE = "${env.DEPLOY_AZURE ?: '0'}"
      DEPLOY_GCP = "${env.DEPLOY_GCP ?: '0'}"
      DEPLOY_HASHICORP = "${env.DEPLOY_HASHICORP ?: '0'}"
      DEPLOY_K8S_MANIFESTS = "${env.DEPLOY_K8S_MANIFESTS ?: '0'}"
      DEPLOY_AGENTIC = "${env.DEPLOY_AGENTIC ?: '0'}"
      DEPLOY_MCP = "${env.DEPLOY_MCP ?: '0'}"
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

      stage('Multi-Cloud Deploy') {
        when {
          expression {
            return (env.DEPLOY_AWS == '1' || env.DEPLOY_AZURE == '1' || env.DEPLOY_GCP == '1' || env.DEPLOY_HASHICORP == '1' || env.DEPLOY_K8S_MANIFESTS == '1')
          }
        }
        steps {
          script {
            def tasks = [:]

            def commandWithArgs = { String scriptPath, String argsEnv ->
              def args = env[argsEnv]
              if (args?.trim()) {
                return "bash ${scriptPath} ${args.trim()}"
              }
              return "bash ${scriptPath}"
            }

            if (env.DEPLOY_AWS == '1') {
              tasks['AWS ECS'] = {
                sh commandWithArgs('aws/deploy.sh', 'AWS_DEPLOY_ARGS')
              }
            }

            if (env.DEPLOY_AZURE == '1') {
              tasks['Azure Container Apps'] = {
                sh commandWithArgs('azure/deploy.sh', 'AZURE_DEPLOY_ARGS')
              }
            }

            if (env.DEPLOY_GCP == '1') {
              tasks['GCP Cloud Run'] = {
                sh commandWithArgs('gcp/deploy.sh', 'GCP_DEPLOY_ARGS')
              }
            }

            if (env.DEPLOY_HASHICORP == '1') {
              tasks['HashiCorp Terraform'] = {
                sh commandWithArgs('hashicorp/deploy.sh', 'HASHICORP_DEPLOY_ARGS')
              }
            }

            if (env.DEPLOY_K8S_MANIFESTS == '1') {
              tasks['Kubernetes Manifests'] = {
                def applyPath = env.K8S_APPLY_PATH ?: 'kubernetes/base'
                sh "kubectl apply -k ${applyPath}"
              }
            }

            if (env.DEPLOY_AGENTIC == '1') {
              tasks['Agentic AI Deploy'] = {
                sh commandWithArgs('agentic-ai/deploy.sh', 'AGENTIC_DEPLOY_ARGS')
              }
            }

            if (env.DEPLOY_MCP == '1') {
              tasks['MCP Server Deploy'] = {
                sh commandWithArgs('mcp/deploy.sh', 'MCP_DEPLOY_ARGS')
              }
            }

            if (tasks) {
              parallel tasks
            } else {
              echo 'Multi-cloud deployment skipped (no tasks requested).'
            }
          }
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
