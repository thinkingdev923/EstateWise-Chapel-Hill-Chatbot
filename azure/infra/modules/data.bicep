param location string
param environmentName string
param acrSku string = 'Standard'
param storageSku string = 'Standard_LRS'
param cosmosAccountName string = '${environmentName}cosmos'
param databaseName string = 'estatewisedb'

var acrName = replace('${environmentName}acr', '-', '')
var storageAccountName = toLower(replace('${environmentName}storage', '-', ''))

resource acr 'Microsoft.ContainerRegistry/registries@2023-01-01-preview' = {
  name: acrName
  location: location
  sku: {
    name: acrSku
  }
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    adminUserEnabled: false
    policies: {
      retentionPolicy: {
        days: 14
        status: 'enabled'
      }
    }
  }
  tags: {
    Environment: environmentName
  }
}

resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: storageSku
  }
  kind: 'StorageV2'
  properties: {
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
  tags: {
    Environment: environmentName
  }
}

resource cosmos 'Microsoft.DocumentDB/databaseAccounts@2023-04-15' = {
  name: cosmosAccountName
  location: location
  kind: 'MongoDB'
  tags: {
    Environment: environmentName
  }
  properties: {
    serverVersion: '4.2'
    databaseAccountOfferType: 'Standard'
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    capabilities: [
      {
        name: 'EnableMongo'
      }
    ]
  }
}

resource cosmosDb 'Microsoft.DocumentDB/databaseAccounts/apis/databases@2023-04-15' = {
  parent: cosmos
  name: 'mongo/${databaseName}'
  properties: {}
}

var storageKey = listKeys(storage.id, '2023-01-01').keys[0].value
var cosmosConnStrings = listConnectionStrings(cosmos.id, '2023-04-15').connectionStrings

output acrName string = acr.name
output acrLoginServer string = acr.properties.loginServer
output acrIdentityPrincipalId string = acr.identity.principalId
output storageConnectionString string = 'DefaultEndpointsProtocol=https;AccountName=${storage.name};AccountKey=${storageKey};EndpointSuffix=${environment().suffixes.storage}'
output cosmosConnectionString string = cosmosConnStrings[0].connectionString
