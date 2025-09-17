param location string = 'eastus'
param appName string = 'estatewise-backend'
param acrName string = 'estatewiseacr'
param storageAccountName string = 'estatewisestorage'
param cosmosAccountName string = 'estatewisecosmos'
param vaultName string = 'estatewisekv'
param appInsightsName string = 'estatewise-ai'
param databaseName string = 'estatewisedb'

resource acr 'Microsoft.ContainerRegistry/registries@2022-02-01' = {
  name: acrName
  location: location
  sku: {
    name: 'Basic'
  }
  adminUserEnabled: true
}

resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
}

resource cosmos 'Microsoft.DocumentDB/databaseAccounts@2023-04-15' = {
  name: cosmosAccountName
  location: location
  kind: 'MongoDB'
  properties: {
    apiProperties: {
      serverVersion: '4.2'
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
      }
    ]
    databaseAccountOfferType: 'Standard'
  }
}

resource cosmosDb 'Microsoft.DocumentDB/databaseAccounts/apis/databases@2023-04-15' = {
  parent: cosmos
  name: 'mongo/${databaseName}'
  properties: {}
}

resource kv 'Microsoft.KeyVault/vaults@2022-07-01' = {
  name: vaultName
  location: location
  properties: {
    sku: {
      name: 'standard'
      family: 'A'
    }
    tenantId: subscription().tenantId
    accessPolicies: []
    enableRbacAuthorization: true
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
  }
}

var storageKey = listKeys(storage.id, '2023-01-01').keys[0].value
var storageConnectionString = 'DefaultEndpointsProtocol=https;AccountName=${storage.name};AccountKey=${storageKey};EndpointSuffix=${environment().suffixes.storage}'

var cosmosConnectionString = listConnectionStrings(cosmos.id, '2023-04-15').connectionStrings[0].connectionString

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
      appSettings: [
        {
          name: 'MONGO_URI'
          value: cosmosConnectionString
        }
        {
          name: 'AZURE_STORAGE_CONNECTION_STRING'
          value: storageConnectionString
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: appInsights.properties.InstrumentationKey
        }
      ]
    }
  }
}

output registryLoginServer string = acr.properties.loginServer
output webAppUrl string = web.properties.defaultHostName
output storageAccount string = storage.name
output cosmosDbConnection string = cosmosConnectionString
output keyVaultName string = kv.name
output appInsightsInstrumentationKey string = appInsights.properties.InstrumentationKey
