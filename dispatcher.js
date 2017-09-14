const data = require('./index.js');
const distance = require('./haversine.js');

const drones = data.drones;
const packages = data.packages;

const depot = new Coords(-37.816664, 144.9638476 ); //https://www.maps.ie/coordinates.html
const currentTime = Math.round(new Date() / 1000);
const droneSpeed = 50;


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

function time(distance, speed) {
  return distance / speed;
}

function deliveryTime(package) {
  let dist = distance(lat1, long1, lat2, long2);//revist input;
  
  return time(dist, droneSpeed);
}

function availableTime(package) {
  return currentTime - package["deadline"];
}

function requiredTime(deliveryTime, returnTime) {
  return deliveryTime + returnTime;
}

function isDeliverable(requiredTime, availableTime) {
  return availableTime - requiredTime >= 0 ? true : false;
}







console.log(drones);
console.log(packages);
console.log(distance(-37, 144, -38, 145));
console.log(depot);
console.log(currentTime);