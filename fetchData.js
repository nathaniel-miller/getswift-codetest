require('isomorphic-fetch');

async function start() {
  const baseURL = 'https://codetest.kube.getswift.co';
  const droneData = await callAPI(baseURL, '/drones');
  const packageData = await callAPI(baseURL, '/packages');

  return {
    "droneData" : droneData, 
    "packageData" : packageData
  };
};

async function callAPI (base, path) {
  const response = await fetch(base + path);
  return await response.json();
}

module.exports.start = start;
module.exports.callAPI = callAPI;