param location string = 'eastus'
param appName string = 'estatewise-backend'
param acrName string = 'estatewiseacr'

resource acr 'Microsoft.ContainerRegistry/registries@2022-02-01' = {
  name: acrName
  location: location
  sku: {
    name: 'Basic'
  }
  adminUserEnabled: true
}

resource plan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: '${appName}-plan'
  location: location
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

resource web 'Microsoft.Web/sites@2022-03-01' = {
  name: appName
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: plan.id
    siteConfig: {
      linuxFxVersion: 'DOCKER|${acr.properties.loginServer}/${appName}:latest'
    }
  }
}

output registryLoginServer string = acr.properties.loginServer
output webAppUrl string = web.properties.defaultHostName
