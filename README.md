# GetSwift Code Challenge

The original problem can be viewed [here](https://github.com/GetSwift/codetest).

## Instructions
#### Installing Node.js
My solution to the problem runs on node.js and assumes its installation.
Installation guides can be found [here](https://github.com/creationix/nvm/blob/master/README.md) and [here](https://nodejs.org/en/download/package-manager/#nvm).

#### Download and Install
Clone this repo using Git, or simply download it. 
From within the downloaded repository, run `npm install` to install the required depencies.

#### Running
To run the test suite use the `npm test` command. To run the application, use node to execute the `dispatcher.js` file like so: `node dispather.js`.

## Solution Implementation
The application initially makes two API calls: one for drone data and one for the package data. Those two pieces of data are bundled together and passed along to the `dispatch` function.

The `dispatch` function relies on this data as well as a set of parameters - `depot`, `droneSpeed`, and `currentTime` - to:
* sort the drones based on earliest departure times 
* add this info to the individual drone object's properties
* sort the packages based on earliest deadlines.

Delivery and departure times are calculated using the [haversine formula](http://www.movable-type.co.uk/scripts/latlong.html). Neither the script nor the formula are my own work. The only alteration I made to the formula was to output the calculated distance in meters rather than kilometers.


Each package is then assessed. The time taken for delivery is calculated and added to the waiting time for the next drone. As long as the package is not meant to be held at the depot and the drone can make the deadline, the package is assigned to that drone. The drone is then taken out of the option pool preventing further assignment.

If the drone can *not* make the delivery on time, the package goes into the unassigned pile.

This process is then repeated for each package.

Once each package has been processed, the drone assignments and unassigned packages are returned as arrays, bundled together as an object:

```javascript
{
  assignments: [{droneId: 1593, packageId: 1029438}, {droneId: 1251, packageId: 1029439}]
  unassignedPackageIds: [109533, 109350, 109353]
}
```

## Solution Reasoning
In terms of logic, my reasoning is fairly straight forward. Because of various assumptions and constraints (drones having a single package or packages having no prioritization), it becomes a matter of assigning the package with the earliest deadline to the drone that is capable of leaving the depot soonest.

If that drone can't make the deadline, no drone can.

The drone's time of departure is calcluated using its current location/distance from the depot and whether or not it needs to go elsewhere before returning to the depot.

Distance is calculated using the coordinates and the *haversine formula*. Although distance calculation could be simplified by ignoring the earth's curvature  (relative distance/sorting output would remain the same), the more accurate formula allows for a better assessment of whether or not the package's deadline can be made.

Sorting is done using Quicksort for the packages and Mergesort for the drones. The choice of Quicksort on the packages was made due to its efficient runtime when retrieving data from RAM. I used the first item as a pivot due to the random nature of the input. Being random, the worst case runtime of O(n^2) is unlikely. 

Mergesort was used for the drones because of the added task of assigning a new property (`returnTime`) to each drone. Rather than have an extra iteration through all the drones to assign this property, I did it during the sort. The code was simply cleaner and easier to read this way than it was with Quicksort.

Other than that, my choices mostly involved trying to keep my functions testable and potentially replaceable/extendable given future considerations.

## Future Considerations
With the various constraints and assumptions still in place, I would rely on the general logic of my solution. Having packages prioritized on something other than the deadline (premium vs economy pricing for example) would change the basis on which packages are sorted, but it would still come down to the question of *which package needs to be assigned first?*

Should drones, at some point, be able to carry multiple packages, a [shortest path](https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm) algorithm would need to be implemented prior to calculating the trip distance of the drone. The `tripDistance` function is already built to handle such an occasion.

As for the potential of multiple depots, this would take some reworking. The current application associates a single given depot with the entire data set. For multiple depots to be handled there would either have to be a preliminary assumption that all data from a specific API would be relevant to a single depot, providing multiple end points for various depots, or it would first have to be sorted based on location. Then it could be assigned to a specific depot before this application would be run.

## Scalability
The current application is essentially two sorting algorithms with an average runtime of O(n log n) for each. The rest of the application is a number of constant factors such as distance and time calculations.

This time complexity is acceptable but since we are currently sorting based on relatively small time differences we could potentially upgrade to a radix sort.

For example, if we sort 2000 packages based on a deadline - the number of seconds since epoch (something like this: `1506043200`), we'll use approximately 15202 "time units" to complete. The above time format is irrelevant to this result, however, if reduced to the last 5 digits - `43200` - any 12 hour time comparison can still be made and the faster radix sort introduced.

Using a radix sort, the number of "time units" would be reduced to approximately 10000: 33% faster.

Still, memory capacity, number of machines doing the calculations, and other factors would play a part in determining the choice of algorithm used.

Improvements could also potentially be made by precalculating some of those constants. Drones could calculate their own return time and packages could have a `holdAtLocation` property. Those considerations are small, however, in the larger scheme of things.

## Further Considerations
Should this scenario replace packages with people and drones with drivers, the idea of a depot becomes a bit strange. In this case the "depot location" would become the passenger's current location. The general logic should still work, however application and data structure would need to be altered a bit. People would need `location` and `destination` properties which time and distance calculations would then rely on.








 