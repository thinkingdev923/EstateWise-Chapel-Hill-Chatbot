param location string
param environmentName string
param appSubnetId string
param infrastructureSubnetId string
param logAnalyticsWorkspaceId string
param logAnalyticsCustomerId string
param logAnalyticsSharedKey string
param appInsightsConnectionString string
param containerImage string
param targetPort int = 3001
param ingressHost string = ''
param minReplicas int = 1
param maxReplicas int = 5
param cpu float = 0.5
param memory string = '1Gi'
param acrResourceId string
param containerRegistryServer string
param keyVaultResourceId string
param keyVaultUri string
param secretsMapping array

var envName = '${environmentName}-aca-env'
var appName = '${environmentName}-backend-ca'

resource diagnostics 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: envName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsCustomerId
        sharedKey: logAnalyticsSharedKey
      }
    }
    vnetConfiguration: {
      internal: false
      infrastructureSubnetId: infrastructureSubnetId
      appSubnetId: appSubnetId
    }
  }
  tags: {
    Environment: environmentName
  }
}

resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: appName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    managedEnvironmentId: diagnostics.id
    configuration: {
      ingress: {
        external: true
        targetPort: targetPort
        transport: 'Auto'
        customDomains: []
      }
      secrets: [for item in secretsMapping: {
        name: item.appSecretName
        keyVaultUrl: '${keyVaultUri}secrets/${item.keyVaultSecretName}'
      }]
      registries: [
        {
          server: containerRegistryServer
          identity: 'system'
        }
      ]
      dapr: {
        enabled: false
      }
      activeRevisionsMode: 'Single'
    }
    template: {
      revisionSuffix: 'r1'
      containers: [
        {
          name: 'backend'
          image: containerImage
          env: concat(
            [
              {
                name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
                value: appInsightsConnectionString
              }
            ],
            [for item in secretsMapping: {
              name: item.environmentVariable
              secretRef: item.appSecretName
            }]
          )
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/health'
                port: targetPort
              }
              initialDelaySeconds: 10
              periodSeconds: 30
            }
          ]
          resources: {
            cpu: cpu
            memory: memory
          }
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
        rules: [
          {
            name: 'http-concurrency'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
  tags: {
    Environment: environmentName
  }
}

// Role assignment for registry pull
resource acrRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: acrResourceId
  name: guid(acrResourceId, containerApp.identity.principalId, 'acrpull')
  properties: {
    principalId: containerApp.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-91b9-d8d98b77b2d0') // AcrPull
  }
}

// Role assignment for Key Vault secret access
resource keyVaultRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: keyVaultResourceId
  name: guid(keyVaultResourceId, containerApp.identity.principalId, 'kv-secrets-user')
  properties: {
    principalId: containerApp.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6') // Key Vault Secrets User
  }
}

output containerAppName string = containerApp.name
output fqdn string = containerApp.properties.configuration.ingress.fqdn
