function sortPackages(packages) {
  

  if(packages.length < 2) {
    return packages;
  }

  let pivot = packages[0];
  let earlier = [];
  let later = [];

  for(let i = 1; i < packages.length; i++) {
    if(packages[i].deadline < pivot.deadline) {
      earlier.push(packages[i]);
    } else {
      later.push(packages[i]);
    }
  }

  let sortedEarlier = sortPackages(earlier);
  let sortedLater = sortPackages(later);

  return sortedEarlier.concat(pivot, sortedLater);
}

module.exports.packages = sortPackages;