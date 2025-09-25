param location string = resourceGroup().location
param environmentName string = 'estatewise'
param containerImage string
param registryServer string
param registryIdentity string = 'system'
param apiBaseUrl string = 'https://estatewise-backend.vercel.app'
param frontendBaseUrl string = 'https://estatewise.vercel.app'
param cacheTtlMs int = 30000
param cacheMax int = 200
param logAnalyticsWorkspaceId string
param logAnalyticsCustomerId string
param logAnalyticsSharedKey string
param minReplicas int = 1
param maxReplicas int = 1

resource env 'Microsoft.App/managedEnvironments@2023-05-01' existing = {
  name: '${environmentName}-aca-env'
}

resource app 'Microsoft.App/containerApps@2023-05-01' = {
  name: '${environmentName}-mcp'
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    managedEnvironmentId: env.id
    configuration: {
      ingress: {
        external: false
        targetPort: 3001
      }
      registries: [
        {
          server: registryServer
          identity: registryIdentity
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'mcp'
          image: containerImage
          env: [
            {
              name: 'API_BASE_URL'
              value: apiBaseUrl
            }
            {
              name: 'FRONTEND_BASE_URL'
              value: frontendBaseUrl
            }
            {
              name: 'MCP_CACHE_TTL_MS'
              value: string(cacheTtlMs)
            }
            {
              name: 'MCP_CACHE_MAX'
              value: string(cacheMax)
            }
          ]
          resources: {
            cpu: 0.5
            memory: '1Gi'
          }
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
      }
    }
  }
}

resource diagnostics 'Microsoft.App/managedEnvironments/diagnostics@2023-05-01' = {
  name: '${env.name}/default'
  properties: {
    logAnalyticsConfiguration: {
      customerId: logAnalyticsCustomerId
      sharedKey: logAnalyticsSharedKey
    }
  }
}

output containerAppName string = app.name
output principalId string = app.identity.principalId
