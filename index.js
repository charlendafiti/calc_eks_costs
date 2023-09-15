const yaml = require('js-yaml');
const fs = require('fs');

const yamlText = fs.readFileSync('./data/kubernetes.yaml')

var globalClusterCostPerYear = 0;

let finalObject = {
    summary: {
        totalCpuUsageFromCluster: 0,
        totalPercentUsageFromApplications: "0%",
        totalAppCost: 0
    },
    applications: []
}

function appFactory(appName, appPercentFromCluster){
    return {
        appName,
        appPercentFromCluster,
        totalAppCost: globalClusterCostPerYear * (appPercentFromCluster / 100)
    }
}

function usageFromApplication(app, appName, totalCpuUsageFromCluster, json = false){
    let appPercentFromCluster = (parseFloat(app['current-cpu-requests'])/totalCpuUsageFromCluster*100).toFixed(2);
    if(!json){

        let currentApp = appFactory(appName, appPercentFromCluster)
        console.log(`Application: ${currentApp.appName}`);
        console.log(`Usage percent from Application on cluster: ${currentApp.appPercentFromCluster}%`);
        console.log(`Cost of Application on cluster: USD ${(currentApp.totalAppCost).toFixed(2)}/y`);        
        console.log('-'.repeat('50'))
    } else {
        return appFactory(appName, appPercentFromCluster)
    }
}

function processData(data, totalCpuUsageFromCluster, json = false){
    let totalCpuRequests = 0;
    let applications = [];
    globalClusterCostPerYear = data['dafiti-live']['cluster']['total-value-per-year']
    // Iterate through the applications
    for (const appName in data['dafiti-live']['applications']) {
      const app = data['dafiti-live']['applications'][appName];

      if (app['current-cpu-requests']) {
        totalCpuRequests += parseFloat(app['current-cpu-requests']);
        let appSummary = usageFromApplication(app, appName, totalCpuUsageFromCluster, json)
        if(json){
            applications.push(appSummary)
        }
      }
    }

    finalObject.applications = applications;
    usagePercent = `${((totalCpuRequests / totalCpuUsageFromCluster * 100)).toFixed(2)}`;
    if(!json){
        console.log('='.repeat(50))
        console.log(`Total Current CPU Requests: ${totalCpuRequests.toFixed(2)} vCPUs`);
        console.log(`Total CPU Requests from cluster: ${totalCpuUsageFromCluster.toFixed(2)} vCPUs`);
        console.log(`Usage percent from Payment applications: ${usagePercent}%`);
        console.log(`Total Cost from Payment applications per year: USD ${(usagePercent * globalClusterCostPerYear / 100).toFixed(2)} / y`);
        console.log(`Total Cost from Payment applications per month: USD ${(usagePercent * globalClusterCostPerYear / 100 / 12).toFixed(2)} / m`);
        console.log('='.repeat(50))
    } else {
        // TODO: return an object
        finalObject.summary.totalCpuUsageFromCluster = totalCpuUsageFromCluster;
        finalObject.summary.totalPercentUsageFromApplications = usagePercent

        console.log(JSON.stringify(finalObject));
    }
}

try {
  // Parse the YAML text into a JavaScript object
  const data = yaml.load(yamlText);
  
  const totalCpuUsageFromCluster = data['dafiti-live']['cluster']['total-cpu']
  // Initialize summary variables

  processData(data, totalCpuUsageFromCluster, false);

} catch (error) {
  console.error('Error parsing YAML:', error);
}