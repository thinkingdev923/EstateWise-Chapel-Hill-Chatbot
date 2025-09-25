param location string
param environmentName string
param vnetAddressPrefix string = '10.20.0.0/16'
param workloadSubnetPrefix string = '10.20.1.0/24'
param infrastructureSubnetPrefix string = '10.20.10.0/24'

var vnetName = '${environmentName}-vnet'
var workloadSubnetName = '${environmentName}-workload-snet'
var infraSubnetName = '${environmentName}-infra-snet'

resource vnet 'Microsoft.Network/virtualNetworks@2023-04-01' = {
  name: vnetName
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [vnetAddressPrefix]
    }
    subnets: [
      {
        name: workloadSubnetName
        properties: {
          addressPrefix: workloadSubnetPrefix
          delegations: [
            {
              name: 'Microsoft.App/environments'
              properties: {
                serviceName: 'Microsoft.App/environments'
              }
            }
          ]
        }
      }
      {
        name: infraSubnetName
        properties: {
          addressPrefix: infrastructureSubnetPrefix
        }
      }
    ]
  }
  tags: {
    Environment: environmentName
  }
}

output vnetId string = vnet.id
output workloadSubnetId string = resourceId('Microsoft.Network/virtualNetworks/subnets', vnet.name, workloadSubnetName)
output infrastructureSubnetId string = resourceId('Microsoft.Network/virtualNetworks/subnets', vnet.name, infraSubnetName)
