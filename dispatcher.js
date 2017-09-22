const fetchData = require('./fetchData.js');
const distance = require('./haversine.js'); //meters

const depot = new Coords(-37.816664, 144.9638476); //https://www.maps.ie/coordinates.html
const parameters = {
  depot: depot,
  droneSpeed: mPerSecond(50), //enter km/hour
  currentTime: Math.round(new Date() / 1000)
}

fetchData.start()
.then(data => console.log(dispatch(data, parameters)))
.catch(reason => console.log(reason.message));


function dispatch(data, p) {
  const packages = sortPackages(data["packageData"], p.depot);
  const drones = sortDrones(data["droneData"], p.depot, p.droneSpeed);

  return processPackages(packages, drones, p);
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

function sortDrones(drones, depot, speed) {
  if(drones.length < 2) {
    if(drones.length) {
      noteReturnTime(drones[0], returnTime(drones[0], depot, speed));
    }

    return drones;
  }

  let m = drones.length / 2;
  let a = sortDrones(drones.slice(0, m), depot, speed);
  let b = sortDrones(drones.slice(m), depot, speed);

  return mergeDrones(a, b);
}

function mergeDrones(a, b) {
  let results = [];

  while(a.length && b.length) {
    results.push(a[0].returnTime < b[0].returnTime ? a.shift() : b.shift());
  }

  return results.concat(a.length ? a : b);
}

function processPackages(packages, drones, p) {
  let assignments = [];
  let unassignedPackageIds = [];

  let nextReturnTime = (drones.length ? drones[0].returnTime : -1);

  packages.forEach(package => {
    
    if(nextReturnTime >= 0){
      let dt = deliveryTime(package, p.droneSpeed);
      let rt = requiredTime(dt, nextReturnTime);
      let at = availableTime(package, p.currentTime)
  
      if(isDeliverable(rt, at) && !holdAtLocation(package, p.depot)) {
        assignments.push({
          "droneId" : drones.shift().droneId,
          "packageId" : package.packageId
        });
  
        if(drones.length){
          nextReturnTime = drones[0].returnTime
        } else {
          nextReturnTime = -1;
        }  
      } else {
        unassignedPackageIds.push(package.packageId);
      }
    } else {
      unassignedPackageIds.push(package.packageId);
    }
  });

  return {
    "assignments" : assignments,
    "unassignedPackageIds" : unassignedPackageIds
  };
}

function returnTime(drone, depot, speed) {
  const td = tripDistance(drone, depot);
  return timeInSeconds(td, speed);
}

function noteReturnTime(drone, seconds) {
  drone["returnTime"] = seconds;
  return drone;
}

function requiredTime(deliveryTime, returnTime) {
  return deliveryTime + returnTime;
}

function mPerSecond(kmPerHour) {
  return (kmPerHour / 3600) * 1000; 
}

function timeInSeconds(meters, mps) {
  return Math.round(meters / mps);
}

function deliveryTime(package, speed) {
  let dist = distance(
    depot.latitude, 
    depot.longitude, 
    package.destination.latitude,
    package.destination.longitude
  );
  
  return timeInSeconds(dist, speed); //meters, meters/second
}

function availableTime(package, currentTime) {
  const at = package.deadline - currentTime;
  return at > 0 ? at : 0;
}

function tripDistance(drone, depot) {
  const locLat = drone.location.latitude;
  const locLong = drone.location.longitude;
  let toDestination = 0;
  let toDepot;

  if(drone.packages.length) {
    let destLat;
    let destLong;

    //can handle multiple packages provided destinations 
    //have already been optimally routed.
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

  return toDestination + toDepot;
}

function isDeliverable(requiredTime, availableTime) {
  return availableTime - requiredTime >= 0 ? true : false;
}

function holdAtLocation(package, depot) {
  const dest = package.destination;

  if(dest.latitude == depot.latitude && dest.longitude == depot.longitude) {
    return true;
  } else {
    return false;
  }
}

function Coords(lat, long) {
  this.latitude = lat;
  this.longitude = long;
}

module.exports = {
  depot: parameters.depot,
  dispatch: dispatch, 
  holdAtLocation: holdAtLocation, 
  tripDistance: tripDistance, 
  requiredTime: requiredTime, 
  mPerSecond: mPerSecond, 
  timeInSeconds: timeInSeconds, 
  deliveryTime: deliveryTime, 
  availableTime: availableTime, 
  returnTime: returnTime, 
  isDeliverable: isDeliverable, 
  sortPackages: sortPackages, 
  sortDrones: sortDrones, 
  noteReturnTime: noteReturnTime, 
  Coords: Coords 
};