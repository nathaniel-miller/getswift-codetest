const fetchData = require('./fetchData.js');
// const sort = require('./sorting.js');
const distance = require('./haversine.js'); //meters

const depot = new Coords(-37.816664, 144.9638476 ); //https://www.maps.ie/coordinates.html
const currentTime = Math.round(new Date() / 1000);
const droneSpeed = mPerSecond(50); //enter km/hour

function mPerSecond(kmPerHour) {
  return (kmPerHour / 3600) * 1000; 
}

function dispatch(data) {
  const drones = data["droneData"];
  const packages = data["packageData"];

  processPackages(packages);
  processDrones(drones);
}

function processPackages(packages) {
  packages = sortPackages(packages);


  packages = packages.forEach(package => {

    let delTime = deliveryTime(package);
    let availTime = availableTime(package);

  });
}

function processDrones(drones) {
  drones = sortDrones(drones);

}


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


function timeInSeconds(distance, speed) {
  return Math.round(distance / speed);
}

function deliveryTime(package) {
  let dist = distance(
    depot.latitude, 
    depot.longitude, 
    package.destination.latitude,
    package.destination.longitude
  );
  
  return timeInSeconds(dist, droneSpeed); //km, km/hour
}

function availableTime(package) {
  return package.deadline - currentTime;
}

function requiredTime(deliveryTime, returnTime) {
  return deliveryTime + returnTime;
}

function returnTime(drone) {
  let locLat = drone.location.latitude;
  let locLong = drone.location.longitude;
  let toDestination = 0;
  let toDepot;

  if(drone.packages.length) {
    let destLat;
    let destLong;
    //can handle multiple packages provided destinations have already been optimally routed.
    drone.packages.forEach(package => {
      destLat = package.destination.latitude;
      destLong = package.destination.longitude;
  
      toDestination += distance(
        locLat,
        locLong,
        destLat,
        destLong
      );
    });
  
    toDepot = distance(
      destLat,
      destLong,
      depot.latitude,
      depot.longitude
    );
  } else {
    toDepot = distance(
      locLat,
      locLong,
      depot.latitude,
      depot.longitude
    );
  }

  return timeInSeconds((toDestination + toDepot), droneSpeed);
}

function isDeliverable(requiredTime, availableTime) {
  return availableTime - requiredTime >= 0 ? true : false;
}


function Coords(lat, long) {
  this.latitude = lat;
  this.longitude = long;
}

fetchData()
.then(data => dispatch(data))
.catch(reason => console.log(reason.message));



function sortPackages(packages) {
  
  if(packages.length < 2) {
    return packages;
  }

  let pivot = packages[0];
  let earlier = [];
  let later = [];

  for(let i = 1; i < packages.length; i++) {
    let currentPackage = packages[i];

    if(currentPackage.deadline < pivot.deadline) {
      earlier.push(currentPackage);
    } else {
      later.push(currentPackage);
    }
  }
  return sortPackages(earlier).concat(pivot, sortPackages(later));
}


function sortDrones(drones) {
  if(drones.length < 2) {
    return drones;
  }

  let pivot = returnTime(drones[0]);
  let earlier = [];
  let later = [];

  for(let i = 1; i < drones.length; i++) {
    let currentDrone = drones[i];

    if(returnTime(currentDrone) < pivot) {
      earlier.push(currentDrone);
    } else {
      later.push(currentDrone);
    }
  }

  return sortDrones(earlier).concat(drones[0], sortDrones(later));
}