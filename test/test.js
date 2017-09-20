const chai = require('chai');
const fetchData = require('../fetchData.js');
const fetch = require('node-fetch');
const fetchMock = require('fetch-mock');
const testData = require('./testData.js');
const dispatcher = require('../dispatcher.js');
const haversine = require('../haversine.js');

const currentTime = 1505585146;
const depot = dispatcher.depot;
const droneSpeed = 50/3.6;

chai.should();


describe('callAPI', () => {
  it('should collect drone data when a call to the drone API is made', async () => {
    fetchMock.mock('https://codetest.kube.getswift.co/drones', {hello: 'drones'});
    let data = await fetchData.callAPI('https://codetest.kube.getswift.co', '/drones');

    data.hello.should.equal('drones');
    fetchMock.restore();
  });

  it('should collect package data when a call to the drone API is made', async () => {
    fetchMock.mock('https://codetest.kube.getswift.co/packages', {hello: 'packages'});
    let data = await fetchData.callAPI('https://codetest.kube.getswift.co', '/packages');

    data.hello.should.equal('packages');
    fetchMock.restore();
  });
});

describe('start', () => {
  it('should return bundled drone and package data from the two APIs', async () => {
    fetchMock.mock('https://codetest.kube.getswift.co/drones', {hello: 'drones'});
    fetchMock.mock('https://codetest.kube.getswift.co/packages', {hello: 'packages'});

    let data = await fetchData.start();
    data.droneData.should.own.include({hello: 'drones'});
    data.packageData.should.own.include({hello: 'packages'});
    fetchMock.restore();
  })
});

describe('haversine', () => {
  it('should return the number of meters between two sets of latitude and longitude', () => {
    haversine(42.990967, -71.463767, 43.990967, -72.463767).should.equal(137366);
    haversine(42.990967, -71.463767, 142.990967, -171.463767).should.equal(6583620);
    haversine(0, 0, 0, -0).should.equal(0);
  });
});

describe('Coords', () => {
  it('should return an Object with latitude and longitude properties', () => {
    new dispatcher.Coords(-37, 144).should.own.include({latitude : -37});
    new dispatcher.Coords(-37, 144).should.own.include({longitude : 144});
    new dispatcher.Coords(-37, 144).should.not.own.include({latitude : 144});
    new dispatcher.Coords(-37, 144).should.not.own.include({longitude : -37});
  });
});


describe('mPerSecond', () => {
  it('should convert kilometers/hour into meters/second', () => {
    dispatcher.mPerSecond(3596.4).should.equal(999);
    dispatcher.mPerSecond(0).should.equal(0);
    dispatcher.mPerSecond(3.6).should.equal(1);
  });
});

describe('timeInSeconds', () => {
  it('should return the number of seconds required to travel x meters at y meters per second', () => {
    dispatcher.timeInSeconds(1, 1).should.equal(1);
    dispatcher.timeInSeconds(1000, 4).should.equal(250);
  });

  it('should return 0 if there is no distance to travel', () => {
    dispatcher.timeInSeconds(0, 1).should.equal(0);
  });

  it('should return Infinity if movement has stopped', () => {
    dispatcher.timeInSeconds(1, 0).should.equal(Infinity);
  });
});

describe('availableTime', () => {
  const package = testData.packageData;

  it('should return the number of seconds between the current time and the package deadline', () => {
   dispatcher.availableTime(package[0], currentTime).should.equal(1000);
  });

  it('should return 0 if deadline has arrived or is already passed', () => {
    dispatcher.availableTime(package[1], currentTime).should.equal(0);
    dispatcher.availableTime(package[2], currentTime).should.equal(0);
  });
});

describe('requiredTime', () => {
  it('should return the package delivery time (in seconds) added to the return time of the drone', () => {
    dispatcher.requiredTime(1000, 2000).should.equal(3000);
    dispatcher.requiredTime(100, 250).should.equal(350);
  });
});

describe('deliveryTime', () => {
  it('should not take any time (return 0) to delivery a package to the depot', () => {
    dispatcher.deliveryTime(testData.packageData[0], droneSpeed).should.equal(0);
  });

  it('should return 3600 to deliver a package 50 km, moving 50 km/h', () => {
    dispatcher.deliveryTime(testData.packageData[1], droneSpeed).should.equal(3600);
  });
});

describe('returnTime', () => {
  const drone = testData.droneData;

  it('should not take any time (return 0) if a drone is already at the depot', () => {
    dispatcher.returnTime(drone[0], depot, droneSpeed).should.equal(0);
  });

  it('should return 3600 if drone is 50km from depot, moving 50km/h and has no package', () => {
    dispatcher.returnTime(drone[2], depot, droneSpeed).should.equal(3600);
  });

  it('should return 3600 if drone is 50km, moving 50km/h and has a package but is delivering to the depot', () => {
    dispatcher.returnTime(drone[1], depot, droneSpeed).should.equal(3600);
  })

  it('should return 7200 if drone is 50km, moving 50km/h and has a package an additinal 25km away from the depot', () => {
    dispatcher.returnTime(drone[3], depot, droneSpeed).should.equal(7200);
  })
});

describe('noteReturnTime', () => {
  const drones = testData.droneData;

  it('should add a returnTime property with a value of n seconds to the given drone object', () => {
    dispatcher.noteReturnTime(drones[0], 100).should.own.include({returnTime: 100});
    dispatcher.noteReturnTime(drones[0], 1000).should.own.include({returnTime: 1000});
  });
});

describe('sortPackages', () => {
  const packages = testData.packageData;
  let sorted = dispatcher.sortPackages(packages);

  it('should sortPackages according to earliest deadline', () => {
    sorted[0].packageId.should.equal(0004);
    sorted[1].packageId.should.equal(0003);
    sorted[2].packageId.should.equal(0002);
    sorted[3].packageId.should.equal(0001);
    sorted[4].packageId.should.equal(0000);
  });

  it('should return an empty array if there are no packages', () => {
    dispatcher.sortPackages([]).should.be.empty;
  });
});

describe('sortDrones', () => {
  let drones = testData.droneLocations;
  let sorted = dispatcher.sortDrones(drones, depot, droneSpeed);

  it('should return an empty array if an empty array is passed in', ()=> {
    dispatcher.sortDrones([], depot, droneSpeed).should.be.empty;
  });

  it('should return a single drone if an array of only one drone is passed in', ()=> {
    dispatcher.sortDrones([drones[0]], depot, droneSpeed)[0].droneId.should.equal(0);
  });

  it('should sort the drones based on the shortest return distance', () => {
    sorted[0].droneId.should.equal(0004);
    sorted[1].droneId.should.equal(0003);
    sorted[2].droneId.should.equal(0002);
    sorted[3].droneId.should.equal(0001);
    sorted[4].droneId.should.equal(0000);
  });

  let dronesWithPackage = testData.droneLocationsPackages;
  let sortedWithPackage = dispatcher.sortDrones(dronesWithPackage, depot, droneSpeed);

  it('should take into account whether or not they still need to deliver a package', () => {
    sortedWithPackage[0].droneId.should.equal(0003);
    sortedWithPackage[1].droneId.should.equal(0002);
    sortedWithPackage[2].droneId.should.equal(0001);
    sortedWithPackage[3].droneId.should.equal(0000);
    sortedWithPackage[4].droneId.should.equal(0004);
  });

});

describe('tripDistance', () => {
  const drones = testData.droneData;
  
  it('should return the total length of the trip (in meters) from the drone to its destination and back to the depot', () => {
    dispatcher.tripDistance(drones[4], depot).should.equal(400000);
  });  

  it('return 0 for a drone that is already at the depot and does not have a package', () => {
    dispatcher.tripDistance(drones[0], depot).should.equal(0);
  }); 
});

describe('isDeliverable', () => {
  it('should return true if required time in seconds is less than the available time in seconds', () => {
    dispatcher.isDeliverable(60, 100).should.be.true;
    dispatcher.isDeliverable(60, 60).should.be.true;
  });

  it('should return false if required time in seconds is more than the available time in seconds', () => {
    dispatcher.isDeliverable(100, 60).should.be.false;
  });
});

describe('holdAtLocation', () => {
  const package1 = testData.dispatchData[2].packageData[0];
  const package2 = testData.dispatchData[0].packageData[0];

  it('should return true if a package has a destination that is the same as a depots location', () => {
    dispatcher.holdAtLocation(package1, depot).should.be.true;
  });

  it('should return false if a package has a destination that is different than the depots location', () => {
    dispatcher.holdAtLocation(package2, depot).should.be.false;
  });
});

describe('dispatch', () => {
  const data = testData.dispatchData;
  const argBundle = { 
    droneSpeed: droneSpeed, 
    depot: depot, 
    currentTime: currentTime
  } 

  it('should return an empty assignments array if there are no drones at all', () => {
    let result = dispatcher.dispatch(data[5], argBundle);
    result.assignments.should.be.empty;
    result.unassignedPackageIds.should.include(5);
  });

  it('should return empty assignments/unassignedPackageId arrays if there are no packages at all', () => {
    let result = dispatcher.dispatch(data[6], argBundle);
    result.assignments.should.be.empty;
    result.unassignedPackageIds.should.be.empty;
  });

  it('should not assign a package if there are no drones that can meet the deadline', () => {
    let result = dispatcher.dispatch(data[0], argBundle).unassignedPackageIds;
    result.should.include(0);
  });

  it('should not assign the package to a drone if the package is going to the depot', () => {
    let result = dispatcher.dispatch(data[2], argBundle).assignments;
    result.should.be.empty;
  });

  it('should assign a package to a drone that can meet the deadline', () => {
    let result = dispatcher.dispatch(data[1], argBundle).assignments[0];
    result.should.include({droneId: 1});
    result.should.include({packageId: 1});
  });

  it('should assign a package to the drone that can depart the earliest', () => {
    let result = dispatcher.dispatch(data[3], argBundle).assignments[0];
    result.should.include({droneId: '3B'});
    result.should.include({packageId: 3});
  });

  it('should not assign two packages to the same drone', () => {
    let result = dispatcher.dispatch(data[4], argBundle);
    result.assignments[0].should.include({droneId: 4});
    result.assignments[0].should.include({packageId: '4A'});
    result.unassignedPackageIds.should.include('4B');
  });
});