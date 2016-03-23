import React from 'react';
import {render} from 'react-dom'

require('./sass/style.scss')

function createMap(length) {
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
function countHabitable(map) {
  let habitableTiles = map.reduce((accum, current) => {
    return accum.concat(current)
  }, []).filter(tile => tile)
  return habitableTiles.length
}

// given some coordinates and a map, returns an array of all the neighboring tiles
function getNeighbors(x, y, map) {
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
function cleanMap(map, num = 1) {
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

class Creature {
  constructor(position) {
    this.position = position
  }

  randomizeStartPosition(map){
    let mapLength = map[0].length
    let randomX = parseInt(Math.random() * mapLength)
    let randomY = parseInt(Math.random() * mapLength)

    if (map[randomX][randomY]) {
      this.position = [randomX, randomY]
    } else {
      return this.randomizeStartPosition(map)
    }
  }

  changePosition(newPosition) {
    console.log(newPosition)
    this.position = newPosition
  }
}

class Player extends Creature {
  constructor(position) {
    super(position)
  }
}

class Main extends React.Component {
  constructor() {
    super()
    this.state = {
      map: [],
      darkness: true
    }
  }

  componentWillMount() {
    let map = createMap(150)
    map = cleanMap(map, 3)
    this.setState({
      map: map
    })
  }

  toggleDarkness() {
    this.setState({
      darkness: !this.state.darkness
    })
  }

  render() {
    return (
      <div>
        <Map map={this.state.map}
          darkness={this.state.darkness}
          toggleDarkness={this.toggleDarkness.bind(this)} />
        <PlayerOverlay map={this.state.map}/>
      </div>
    )
  }
}

class PlayerOverlay extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      player: {}
    }
  }

  componentWillMount() {
    let player = new Player()
    player.randomizeStartPosition(this.props.map)
    this.setState({
      player: player
    })
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyPress.bind(this))
  }

  handleKeyPress(e) {
    e.preventDefault()

    let boundary = this.props.map[0].length - 1

    function calcSub(num) {
      return (num - 1 < 0) ? boundary : num - 1
    }

    function calcAdd(num) {
      return (num + 1 > boundary) ? 0 : num + 1
    }

    let x = this.state.player.position[0]
    let y = this.state.player.position[1]

    let neighbors = getNeighbors(x, y, this.props.map)
    let left = neighbors[3]
    let right = neighbors[4]
    let up = neighbors[1]
    let down = neighbors[6]

    let newPosition
    switch(e.keyCode) {
      case 37: //left:
        if (left) {
          newPosition = [calcSub(x), y]
        }
        break
      case 39: //right:
        if (right) {
          newPosition = [calcAdd(x), y]
        }
        break
      case 38: //up
        if (up) {
          newPosition = [x, calcSub(y)]
        }
        break
      case 40: //down:
        if (down) {
          newPosition = [x, calcAdd(y)]
        }
        break
      default: ''
        console.log('unrecognized key')
        break
    }
    if (newPosition) {
      this.setState({
        player: new Player(newPosition)
      })
    }
  }

  render() {
    let length = this.props.map[0].length
    return (
      <svg id="playerOverlay" width={length * 5} height={length * 5}>

        <defs>
          <clipPath id="playerClip">
              <circle cx={this.state.player.position[0] * 5 + 2.5}
                cy={this.state.player.position[1] * 5 + 2.5} r="40"
                fill="black"/>
            </clipPath>
        </defs>
        <rect
          x={this.state.player.position[0] * 5} y={this.state.player.position[1] * 5}
          height="5" width="5"
          fill="white"/>
      </svg>
    )
  }
}

function Map(props) {
  function handleDarknessToggle(e) {
    e.preventDefault()
    props.toggleDarkness()
  }

  let length = props.map[0].length
  let rows = props.map.map((tilesArray, index) => {
    return <Row tiles={tilesArray} y={index} key={index}/>
  })

  return (
    <div>
      <svg id="map" width={length * 5} height={length * 5}
        style={props.darkness ? {clipPath: 'url(#playerClip)'} : null}>
          {rows}
      </svg>
      <button style={{display:'block'}}
        onClick={handleDarknessToggle}>
          Toggle Darkness
      </button>
    </div>
  )
}

function Row(props) {
  let tiles = props.tiles.map((tile, index) => {
    return <Tile x={index} y={props.y} habitable={tile} key={index}/>
  })
  return (
    <g>
      {tiles}
    </g>
  )
}

function Tile(props) {
  function evaluateFill(habitable) {
    return habitable ? 'blue' : 'gray'
  }

  return (
    <rect
      x={props.x * 5} y={props.y * 5}
      height="5" width="5"
      fill={evaluateFill(props.habitable)}>
    </rect>
  )
}

render(
  <Main />,
  document.getElementById('app')
)
