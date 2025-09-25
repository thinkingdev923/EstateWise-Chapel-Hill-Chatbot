param location string
param environmentName string
param tenantId string
param secrets object
param administrators array = []

var vaultName = toLower('${environmentName}-kv')

resource kv 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: vaultName
  location: location
  properties: {
    enableRbacAuthorization: true
    tenantId: tenantId
    sku: {
      name: 'standard'
      family: 'A'
    }
    accessPolicies: []
  }
  tags: {
    Environment: environmentName
  }
}

// Optional RBAC assignments for administrators provided via principal IDs
@batchSize(1)
resource adminAssignments 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for principalId in administrators: {
  name: guid(kv.id, principalId, 'admin')
  properties: {
    principalId: principalId
    principalType: 'User'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '21090545-7ca7-4776-b22c-e363652d74d2') // Key Vault Administrator
  }
  scope: kv
}]

// Persist provided secrets into Key Vault
@batchSize(1)
resource vaultSecrets 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = [for secretName in keys(secrets): {
  name: '${kv.name}/${secretName}'
  properties: {
    value: secrets[secretName]
  }
}]

output vaultId string = kv.id
output vaultUri string = kv.properties.vaultUri
