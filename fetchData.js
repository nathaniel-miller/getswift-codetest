const fetch = require('node-fetch');

async function fetchData () {
  const baseUrl = 'https://codetest.kube.getswift.co';
  const droneResponse = await fetch(baseUrl + '/drones');
  const droneData = await droneResponse.json();

  const packageResponse = await fetch(baseUrl + '/packages');
  const packageData = await packageResponse.json();

  return {
    "droneData" : droneData, 
    "packageData" : packageData
  };
}

module.exports = fetchData;