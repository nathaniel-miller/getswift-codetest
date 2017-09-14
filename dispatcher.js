const data = require('./index.js');
const distance = require('./haversine.js');

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



console.log(drones);
console.log(packages);
console.log(distance(-37, 144, -38, 145));
console.log(depot);
console.log(currentTime);