@description('Azure region to deploy EstateWise resources into.')
param location string = resourceGroup().location
@description('Short environment name used to prefix resources.')
param environmentName string = 'estatewise'
@description('Container image name stored in Azure Container Registry (without registry).')
param imageName string = 'estatewise-backend'
@description('Container image tag to deploy.')
param imageTag string = 'latest'
@description('Mongo/Cosmos database name to provision.')
param databaseName string = 'estatewisedb'
@description('Minimum container app replicas.')
param minReplicas int = 1
@description('Maximum container app replicas.')
param maxReplicas int = 4
@description('Optional administrators (object IDs) that should have Key Vault admin access.')
param administrators array = []
@secure()
@description('JWT secret used by the backend. Leave empty to manage manually later.')
param jwtSecret string = ''
@secure()
@description('Google Vertex/Gemini API key for LLM access. Optional.')
param googleAiApiKey string = ''
@secure()
@description('Pinecone API key for vector search. Optional.')
param pineconeApiKey string = ''
@description('Pinecone index name injected into the container app.')
param pineconeIndex string = 'estatewise-index'
@secure()
@description('Optional OpenAI API key (if using OpenAI models).')
param openAiApiKey string = ''

module network './modules/network.bicep' = {
  name: 'network'
  params: {
    location: location
    environmentName: environmentName
  }
}

module logging './modules/logAnalytics.bicep' = {
  name: 'observability'
  params: {
    location: location
    environmentName: environmentName
  }
}

module data './modules/data.bicep' = {
  name: 'data'
  params: {
    location: location
    environmentName: environmentName
    databaseName: databaseName
  }
}

var baseSecrets = {
  'cosmos-connection-string': data.outputs.cosmosConnectionString
  'storage-connection-string': data.outputs.storageConnectionString
  'pinecone-index': pineconeIndex
}

var optionalSecrets = union(
  length(jwtSecret) > 0 ? {
    'jwt-secret': jwtSecret
  } : {},
  length(googleAiApiKey) > 0 ? {
    'google-ai-api-key': googleAiApiKey
  } : {},
  length(pineconeApiKey) > 0 ? {
    'pinecone-api-key': pineconeApiKey
  } : {},
  length(openAiApiKey) > 0 ? {
    'openai-api-key': openAiApiKey
  } : {}
)

var compiledSecrets = union(baseSecrets, optionalSecrets)

module security './modules/security.bicep' = {
  name: 'security'
  params: {
    location: location
    environmentName: environmentName
    tenantId: subscription().tenantId
    secrets: compiledSecrets
    administrators: administrators
  }
}

var containerImage = '${data.outputs.acrLoginServer}/${imageName}:${imageTag}'

var secretMappingsBase = [
  {
    appSecretName: 'mongo-uri'
    keyVaultSecretName: 'cosmos-connection-string'
    environmentVariable: 'MONGO_URI'
  }
  {
    appSecretName: 'storage-connection'
    keyVaultSecretName: 'storage-connection-string'
    environmentVariable: 'AZURE_STORAGE_CONNECTION_STRING'
  }
  {
    appSecretName: 'pinecone-index'
    keyVaultSecretName: 'pinecone-index'
    environmentVariable: 'PINECONE_INDEX'
  }
]

var secretMappingsOptional = [
  if (length(jwtSecret) > 0) {
    appSecretName: 'jwt-secret'
    keyVaultSecretName: 'jwt-secret'
    environmentVariable: 'JWT_SECRET'
  }
  if (length(googleAiApiKey) > 0) {
    appSecretName: 'google-ai-api-key'
    keyVaultSecretName: 'google-ai-api-key'
    environmentVariable: 'GOOGLE_AI_API_KEY'
  }
  if (length(pineconeApiKey) > 0) {
    appSecretName: 'pinecone-api-key'
    keyVaultSecretName: 'pinecone-api-key'
    environmentVariable: 'PINECONE_API_KEY'
  }
  if (length(openAiApiKey) > 0) {
    appSecretName: 'openai-api-key'
    keyVaultSecretName: 'openai-api-key'
    environmentVariable: 'OPENAI_API_KEY'
  }
]

var secretMappings = concat(secretMappingsBase, secretMappingsOptional)

module containerApp './modules/container-app.bicep' = {
  name: 'containerApp'
  params: {
    location: location
    environmentName: environmentName
    appSubnetId: network.outputs.workloadSubnetId
    infrastructureSubnetId: network.outputs.infrastructureSubnetId
    logAnalyticsWorkspaceId: logging.outputs.workspaceId
    logAnalyticsCustomerId: logging.outputs.workspaceCustomerId
    logAnalyticsSharedKey: logging.outputs.workspaceSharedKey
    appInsightsConnectionString: logging.outputs.appInsightsConnectionString
    containerImage: containerImage
    targetPort: 3001
    minReplicas: minReplicas
    maxReplicas: maxReplicas
    acrResourceId: resourceId('Microsoft.ContainerRegistry/registries', data.outputs.acrName)
    containerRegistryServer: data.outputs.acrLoginServer
    keyVaultResourceId: security.outputs.vaultId
    keyVaultUri: security.outputs.vaultUri
    secretsMapping: secretMappings
  }
  dependsOn: [security]
}

output containerAppFqdn string = containerApp.outputs.fqdn
output containerAppName string = containerApp.outputs.containerAppName
output keyVaultUri string = security.outputs.vaultUri
output acrLoginServer string = data.outputs.acrLoginServer
output storageAccountConnection string = data.outputs.storageConnectionString
output cosmosConnectionString string = data.outputs.cosmosConnectionString
