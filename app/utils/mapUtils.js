export function createMap(length) {
  let map = [];
  let area = length * length;
  let x = 0;
  let y = 0;

  //add x arrays equal in number to length
  while (x < length) {
    map.push([]);
    x++;
  }

  //for each x array in map, add y arrays equal in number to length
  map.forEach( xArray => {
    while (y < length) {
      let habitable = Math.random() > 0.39
      xArray.push(habitable);
      y++;
    }
    y = 0;
  });

  return map;
}

// returns the total number of tiles that are habitable
export function countHabitable(map) {
  let habitableTiles = map.reduce((accum, current) => {
    return accum.concat(current)
  }, []).filter(tile => tile)
  return habitableTiles.length
}

// given some coordinates and a map, returns an array of all the neighboring tiles
export function getNeighbors(x, y, map) {
  let boundary = map[0].length - 1

  function calcSub(num) {
    return (num - 1 < 0) ? boundary : num - 1
  }

  function calcAdd(num) {
    return (num + 1 > boundary) ? 0 : num + 1
  }

  return [
    map[calcSub(x)][calcSub(y)], map[x][calcSub(y)], map[calcAdd(x)][calcSub(y)],
    map[calcSub(x)][y],                              map[calcAdd(x)][y],
    map[calcSub(x)][calcAdd(y)], map[x][calcAdd(y)], map[calcAdd(x)][calcAdd(y)]
  ]
}

// given some coordinates and a map, returns an array of all the neighboring tiles
// that are habitable
function countHabitableNeighbors(x, y, map) {
  let neighbors = getNeighbors(x, y, map)
  return neighbors.filter(neighbor => neighbor).length
}

// given a map, uses cell automation to consolidate tiles into neighboring groups
// ensuring that, when rendered, the map will resemble a cave
export function cleanMap(map, num = 1) {
  if (num > 0) {
    let newMap = []
    map.forEach((xArray, xIndex) => {
      let newXArray = []
      xArray.forEach((tile, yIndex) => {
        let habitableNeighborsCount = countHabitableNeighbors(xIndex, yIndex, map)
        if (tile) {
          habitableNeighborsCount < 4 ? newXArray.push(false) : newXArray.push(true)
        } else {
          habitableNeighborsCount > 5 ? newXArray.push(true) : newXArray.push(false)
        }
      })
      newMap.push(newXArray)
    })
    return cleanMap(newMap, num - 1)
  }
  return map
}
