const fetchData = require('./fetchData.js');
const distance = require('./haversine.js'); //meters

const depot = new Coords(-37.816664, 144.9638476 ); //https://www.maps.ie/coordinates.html
const currentTime = Math.round(new Date() / 1000);
const droneSpeed = mPerSecond(50); //enter km/hour


function dispatch(data) {
  const packages = sortPackages(data["packageData"]);
  const drones = sortDrones(data["droneData"]);

  let nextReturnTime = drones[0].returnTime;
  let assignments = [];
  let unassignedPackageIds = [];

  packages.forEach(package => {
    let requiredTime = deliveryTime(package) + nextReturnTime;

    if(isDeliverable(requiredTime, availableTime(package))) {
      assignments.push({
        "droneId" : drones.shift().droneId,
        "packageId" : package.packageId
      });

      nextReturnTime = drones[0].returnTime;
    } else {
      unassignedPackageIds.push(package.packageId);
    }
    
  });

  return {
    "assignments" : assignments,
    "unassignedPackageIds" : unassignedPackageIds
  };
}

function mPerSecond(kmPerHour) {
  return (kmPerHour / 3600) * 1000; 
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
    let seconds = returnTime(currentDrone);

    if(seconds < pivot) {
      noteReturnTime(currentDrone, seconds);
      earlier.push(currentDrone);
    } else {
      later.push(currentDrone);
    }
  }

  return sortDrones(earlier).concat(drones[0], sortDrones(later));
}

function noteReturnTime(drone, seconds) {
  drone["returnTime"] = seconds;
  return drone;
}

function Coords(lat, long) {
  this.latitude = lat;
  this.longitude = long;
}

fetchData()
.then(data => console.log(dispatch(data)))
.catch(reason => console.log(reason.message));