param location string = resourceGroup().location
param environmentName string
param containerAppName string
param containerImage string
param logLevel string = 'info'
param targetPort int = 50051

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${environmentName}-logs'
  location: location
  sku: {
    name: 'PerGB2018'
  }
  properties: {
    retentionInDays: 30
  }
}

resource containerEnv 'Microsoft.App/managedEnvironments@2022-10-01' = {
  name: environmentName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

resource containerApp 'Microsoft.App/containerApps@2022-10-01' = {
  name: containerAppName
  location: location
  properties: {
    managedEnvironmentId: containerEnv.id
    configuration: {
      ingress: {
        external: false
        targetPort: targetPort
        transport: 'auto'
      }
      registries: []
      secrets: []
    }
    template: {
      containers: [
        {
          name: containerAppName
          image: containerImage
          env: [
            {
              name: 'GRPC_HOST'
              value: '0.0.0.0'
            }
            {
              name: 'GRPC_PORT'
              value: string(targetPort)
            }
            {
              name: 'LOG_LEVEL'
              value: logLevel
            }
          ]
          probes: []
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 5
      }
    }
  }
}

output containerAppUrl string = containerApp.properties.configuration.ingress?.fqdn
