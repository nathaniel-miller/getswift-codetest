const data = require('./index.js');

const drones = data.drones;
const packages = data.packages;

const depot = new Coords(-37.816664, 144.9638476 ); //https://www.maps.ie/coordinates.html
const currentTime = Math.round(new Date() / 1000);


function packageDestination(package) {
  let lat = package["destination"]["latitude"];
  let long = package["destination"]["longitude"];

  return new Coords(lat, long);
}

function droneDestination(drone) {
  let lat = drone["destination"]["latitude"];
  let long = drone["destination"]["longitude"];

  return new Coords(lat, long);
}

function droneLocation(drone) {
  let lat = drone["location"]["latitude"];
  let long = drone["location"]["longitude"];

  return new Coords(lat, long);
}

function Coords(lat, long) {
  this.latitude = lat;
  this.longitude = long;
}

function calcDistance(lat1, lon1, lat2, lon2) {
  let radlat1 = Math.PI * lat1/180
  let radlat2 = Math.PI * lat2/180
  let radlon1 = Math.PI * lon1/180
  let radlon2 = Math.PI * lon2/180
  let theta = lon1-lon2
  let radtheta = Math.PI * theta/180
  let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);

  dist = Math.acos(dist);
  dist = dist * 180/Math.PI;
  dist = dist * 60 * 1.1515;
  dist = dist * 1.609344;

  return dist;
}

console.log(drones);
console.log(packages);
console.log(base);
console.log(currentTime);