param location string
param environmentName string

var workspaceName = '${environmentName}-law'
var appInsightsName = '${environmentName}-appi'

resource workspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: workspaceName
  location: location
  properties: {
    retentionInDays: 30
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
  sku: {
    name: 'PerGB2018'
  }
  tags: {
    Environment: environmentName
  }
}

resource insights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    Flow_Type: 'Bluefield'
    WorkspaceResourceId: workspace.id
  }
  tags: {
    Environment: environmentName
  }
}

output workspaceId string = workspace.id
output workspaceCustomerId string = workspace.properties.customerId
output workspaceSharedKey string = listKeys(workspace.id, '2022-10-01').primarySharedKey
output appInsightsConnectionString string = insights.properties.ConnectionString
output appInsightsInstrumentationKey string = insights.properties.InstrumentationKey
