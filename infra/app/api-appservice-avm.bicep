param name string
param location string = resourceGroup().location
param tags object = {}

param allowedOrigins array = []
param appCommandLine string?
param appInsightResourceId string
param appServicePlanId string
@secure()
param appSettings object = {}
param siteConfig object = {}
param functionAppConfig object = {}
param serviceName string = 'api'

@description('Required. Type of site to deploy.')
param kind string

@description('Optional. If client affinity is enabled.')
param clientAffinityEnabled bool = true

@description('Optional. Required if app of kind functionapp. Resource ID of the storage account to manage triggers and logging function executions.')
param storageAccountResourceId string?

var storageAccountName = empty(storageAccountResourceId ?? '') ? '' : last(split(storageAccountResourceId!, '/'))
var functionDeploymentStorage = empty(storageAccountName) ? {} : {
  deployment: {
    storage: {
      type: 'blobContainer'
      value: 'https://${storageAccountName}.blob.${environment().suffixes.storage}/function-releases'
      authentication: {
        type: 'StorageAccountConnectionString'
        storageAccountConnectionStringName: 'AzureWebJobsStorage'
      }
    }
  }
}

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' existing = if (!empty(storageAccountName)) {
  name: storageAccountName
}

resource functionDeploymentContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = if (!empty(storageAccountName)) {
  name: '${storageAccount.name}/default/function-releases'
  properties: {
    publicAccess: 'None'
  }
}

resource api 'Microsoft.Web/sites@2023-12-01' = {
  name: name
  location: location
  kind: kind
  tags: union(tags, { 'azd-service-name': serviceName })
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlanId
    clientAffinityEnabled: clientAffinityEnabled
    keyVaultReferenceIdentity: 'SystemAssigned'
    functionAppConfig: union(functionDeploymentStorage, functionAppConfig)
    siteConfig: union(siteConfig, {
      cors: {
        allowedOrigins: union(['https://portal.azure.com', 'https://ms.portal.azure.com'], allowedOrigins)
      }
      appCommandLine: appCommandLine
    })
  }
  dependsOn: [
    functionDeploymentContainer
  ]
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' existing = {
  scope: resourceGroup(split(appInsightResourceId, '/')[4])
  name: split(appInsightResourceId, '/')[8]
}

resource apiAppSettings 'Microsoft.Web/sites/config@2023-12-01' = {
  name: '${api.name}/appsettings'
  properties: union(
    appSettings,
    {
      ApplicationInsightsAgent_EXTENSION_VERSION: contains(kind, 'linux') ? '~3' : '~2'
      APPLICATIONINSIGHTS_CONNECTION_STRING: appInsights.properties.ConnectionString
      AzureWebJobsStorage: empty(storageAccountName)
        ? ''
        : 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
    }
  )
}

output SERVICE_API_IDENTITY_PRINCIPAL_ID string = api.identity.principalId!
output SERVICE_API_NAME string = api.name
output SERVICE_API_URI string = 'https://${api.properties.defaultHostName}'
