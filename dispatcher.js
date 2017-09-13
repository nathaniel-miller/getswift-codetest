const data = require('./index.js');
const drones = data.drones;
const packages = data.packages;
const base = { latitude: -37.816664, longitude: 144.9638476 }; //https://www.maps.ie/coordinates.html
const currentTime = Math.round(new Date() / 1000);

console.log(drones);
console.log(packages);
console.log(base);
console.log(currentTime);