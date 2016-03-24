import React from 'react';
import ReactDOM from 'react-dom'

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
    this.position = newPosition
  }
}

class Player extends Creature {
  constructor(position) {
    super(position)
  }
}

class Monster extends Creature{
  constructor(position, type, level) {
    super(position, type)
      this.type = type
      this.level = level
      this.health = 30 + (level * 10)
  }

  attack() {
    let modifier = parseInt(Math.random() * (this.level * 10))
    let baseAttack = 20 + (this.level * 5)
    return baseAttack + modifier
  }

  receiveDamage(damage) {
    this.health = this.health - damage
  }
}

class Item extends Creature {
  constructor(position, type) {
    super(position)
    this.type = type
  }
}

class Weapon extends Item {
  constructor(position, type) {
    super(position, type)
  }
}

class Potion extends Item {
  constructor(position, type, hp) {
    super(position, type)
    this.hp = hp
  }
}

class Main extends React.Component {
  constructor() {
    super()
    this.state = {
      map: [],
      darkness: true,
      playing: true
    }
  }

  componentWillMount() {
    let map = createMap(100)
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

  endGame() {
    this.setState({
      playing: false
    })
  }

  render() {
    if (this.state.playing) {
      return (
        <div>
          <Map map={this.state.map}
            darkness={this.state.darkness}
            toggleDarkness={this.toggleDarkness.bind(this)} />
            <Overlay map={this.state.map} darkness={this.state.darkness}
              endGame={this.endGame.bind(this)}/>
        </div>
      )
    } else {
      return <h1 style={{color: 'white'}}>Game Over!</h1>
    }

  }
}

class Overlay extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      player: {},
      playerHealth: 100,
      playerWeapon: {name: 'Bare Fists', rank: 0},
      playerBaseAttack: 15,
      playerLevel: 1,
      playerXP: 0,
      takenPositions: [],
      potions: [],
      weapons: [],
      monsters: []
    }
  }

  componentWillMount() {
    //create new Player
    let takenPositions = []
    let player = new Player()
    player.randomizeStartPosition(this.props.map)
    takenPositions.push(player.position)

    let potionTotal = 20
    let count = 0

    let potions = []

    // generating potions
    var generatePotion = () => {
      let potion = new Potion([0, 0], 'potion', 30)
      potion.randomizeStartPosition(this.props.map)
      if (this.ensureValidPosition(potion.position, takenPositions)) {
        potions.push(potion)
        takenPositions.push(potion.position)
      } else {
        generatePotion()
      }
    }

    while (count < potionTotal) {
      generatePotion()
      count++
    }

    // generating weapons; each weapon just needs a position and a type
    count = 0
    let weaponTotal = 4

    let weapons = []

    var generateWeapon = () => {
      let weapon = new Weapon([0, 0], 'weapon')
      weapon.randomizeStartPosition(this.props.map)
      if (this.ensureValidPosition(weapon.position, takenPositions)) {
        weapons.push(weapon)
        takenPositions.push(weapon.position)
      } else {
        generateWeapon()
      }
    }

    while (count < weaponTotal) {
      generateWeapon()
      count++
    }

    //genearating monsters; each monster needs a position, type, and level

    count = 0
    let monsterTotal = 20

    let monsters = []

    var generateMonster = () => {
      var randomLevel = parseInt(Math.random() * 5)
      let monster = new Monster([0,0], 'monster', randomLevel)
      monster.randomizeStartPosition(this.props.map)
      if (this.ensureValidPosition(monster.position, takenPositions)) {
        monsters.push(monster)
        takenPositions.push(monster.position)
      } else {
        generateMonster()
      }
    }

    while (count < monsterTotal) {
      generateMonster()
      count++
    }

    this.setState({
      player: player,
      potions: potions,
      weapons: weapons,
      monsters: monsters,
      takenPositions: takenPositions
    })
  }

  ensureValidPosition(position, takenPositions) {
    let takenPositionCount = takenPositions.filter(takenPosition => {
      return position[0] === takenPosition[0] && position[1] === takenPosition[1]
    }).length
    return takenPositionCount === 0
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyPress.bind(this))
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyPress.bind(this))
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

    // no interaction
    if (newPosition && this.ensureValidPosition(newPosition, this.state.takenPositions)) {
      this.state.player.changePosition(newPosition)
      this.setState({
        player: this.state.player
      })
    }

    // interaction
    if (newPosition && !this.ensureValidPosition(newPosition, this.state.takenPositions)) {
      let interaction = this.determineInteraction(newPosition)
      console.log(interaction)

      if (interaction.type === 'potion') {
        this.handlePotion(interaction)
      }

      if (interaction.type === 'weapon') {
        this.updateWeapon(interaction)
      }

      if (interaction.type === 'monster') {
        this.handleMonsterInteraction(interaction)
      }
    }
  }

  determineInteraction(playerPosition) {
    //concat all interaction arrays and filter them to the item in question
    let interactions = this.state.weapons.concat(this.state.potions).concat(this.state.monsters)
    let interactionFilter = interactions.filter(interaction => {
      return playerPosition[0] === interaction.position[0] &&
      playerPosition[1] === interaction.position[1]
    })
    return interactionFilter.length === 1 ? interactionFilter[0] : null
  }

  newInteractionsArray(interactionArray, playerInteraction) {
    let interactionFilter = interactionArray.reduce((accum, interaction, index) => {
      if (interaction.position[0] === playerInteraction.position[0] &&
          interaction.position[1] === playerInteraction.position[1]) {
            accum.push(index)
          }
      return accum
    }, [])
    let interactionIndex = interactionFilter[0]
    let newInteractionsArray = interactionArray.slice(0, interactionIndex)
      .concat(interactionArray.slice(interactionIndex + 1))
    return newInteractionsArray
  }

  newTakenPositions(takenPositions, playerInteraction) {
    let takenPositionsFilter = takenPositions.reduce((accum, takenPosition, index) => {
      if (playerInteraction.position[0] === takenPosition[0] && playerInteraction.position[1] === takenPosition[1]) {
        accum.push(index)
      }
      return accum
    }, [])
    let newTakenPositions = takenPositions.slice(0, takenPositionsFilter[0])
      .concat(takenPositions.slice(takenPositionsFilter[0] + 1))
    return newTakenPositions
  }

  handlePotion(potionInteraction) {
    //add HP
    let newPlayerHealth = this.state.playerHealth + potionInteraction.hp

    // update potions
    let newPotions = this.newInteractionsArray(this.state.potions, potionInteraction)

    //update takenPositions
    let newTakenPositions = this.newTakenPositions(this.state.takenPositions, potionInteraction)

    //update position of playerPosition
    let newPlayer = new Player(potionInteraction.position)

    //updateState
    this.setState({
      playerHealth: newPlayerHealth,
      potions: newPotions,
      takenPositions: newTakenPositions,
      player: newPlayer
    })
  }

  updateWeapon(weaponInteraction) {
    let newWeaponRank = this.state.playerWeapon.rank + 1

    let weapons = [
      'Bare Fists',
      'Yo-Yo',
      'Slingshot',
      'Cast Iron Skillet',
      'Chainsaw'
    ]

    // create new weapon
    let newWeapon = {name: weapons[newWeaponRank], rank: newWeaponRank}

    // calculate new attack
    let newBaseAttack = (newWeaponRank * newWeaponRank) + 20 + this.state.playerBaseAttack

    // update weapons
    let newWeapons = this.newInteractionsArray(this.state.weapons, weaponInteraction)

    //update takenPositions
    let newTakenPositions = this.newTakenPositions(this.state.takenPositions, weaponInteraction)

    // move the player into the new position
    let newPlayer = new Player(weaponInteraction.position)

    this.setState({
      playerWeapon: newWeapon,
      playerBaseAttack: newBaseAttack,
      player: newPlayer,
      takenPositions: newTakenPositions,
      weapons: newWeapons
    })
  }

  handleMonsterInteraction(monsterInteraction) {
    let monster = monsterInteraction
    console.log(monster)

    let playerAttack = this.playerAttack()
    let monsterAttack = monster.attack()
    monster.receiveDamage(playerAttack)
    //let newPlayerHealth = this.state.playerHealth - monsterAttack

    let newXP = this.state.playerXP
    let newMonsters = this.state.monsters.slice()
    let newTakenPositions = this.state.takenPositions.slice()

    // monster dies
    if (monster.health <= 0) {
      newMonsters = this.newInteractionsArray(newMonsters, monsterInteraction)
      newTakenPositions = this.newTakenPositions(newTakenPositions, monsterInteraction)
      newXP = this.state.playerXP + 10
    }

    this.setState({
      monsters: newMonsters,
      takenPositions: newTakenPositions,
      playerXP: newXP
    })

    this.playerTakeDamage(monsterAttack)
  }

  playerTakeDamage(damage) {
    let newPlayerHealth = this.state.playerHealth - damage
    console.log("You're taking damage: " + damage)
    console.log("You're current health is now " + newPlayerHealth)
    if (newPlayerHealth <= 0) {
      //window.removeEventListener('keydown', this.handleKeyPress.bind(this))
      this.props.endGame()
    } else {
      this.setState({
        playerHealth: newPlayerHealth
      })
    }
  }

  playerAttack() {
    //base attack is modified when the player's weapon increases
    let modifier = parseInt(Math.random() * (this.state.playerLevel * 12))
    return modifier + this.state.playerBaseAttack
  }

  render() {
    let length = this.props.map.length

    let potionSprites = this.state.potions.map((potion, index) => {
      return <Sprite className="potion" position={potion.position} fill='green' key={index} />
    })

    let weaponSprites = this.state.weapons.map((weapon, index) => {
      return <Sprite className="weapon" position={weapon.position} fill='goldenrod' key={index} />
    })

    let monsterSprites = this.state.monsters.map((monster, index) => {
      return <Sprite className="monster" position={monster.position} fill='red' key={index} />
    })

    console.log('x: ' + this.state.player.position[0] + ', y: ' + this.state.player.position[1])
    return (
      <svg id="Overlay" className="svgOverlay"
        width={length * 5} height={length * 5}
        style={this.props.darkness ? {clipPath: 'url(#playerClip)'} : null}>

        <defs>
          <clipPath id="playerClip">
              <circle cx={this.state.player.position[0] * 5 + 2.5}
                cy={this.state.player.position[1] * 5 + 2.5} r="40"
                fill="black"/>
            </clipPath>
        </defs>

        <Sprite position={this.state.player.position} fill='blue'/>

        <g className="potionsGroup">
          {potionSprites}
        </g>
        <g className="weaponsGroup">
          {weaponSprites}
        </g>
        <g className="monstersGroup">
          {monsterSprites}
        </g>
      </svg>
    )
  }
}

function Sprite(props) {
  return (
    <rect x={props.position[0] * 5} y={props.position[1] * 5}
      height="5" width="5" fill={props.fill}/>
  )
}

function Map(props) {
  function handleDarknessToggle(e) {
    e.preventDefault()
    props.toggleDarkness()
  }

  let length = props.map[0].length
  let rows = props.map.map((tilesArray, index) => {
    return <Row tiles={tilesArray} x={index} key={index}/>
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
    return <Tile y={index} x={props.x} habitable={tile} key={index}/>
  })
  return (
    <g>
      {tiles}
    </g>
  )
}

function Tile(props) {
  function evaluateFill(habitable) {
    return habitable ? 'white' : 'black'
  }

  return (
    <rect
      x={props.x * 5} y={props.y * 5}
      height="5" width="5"
      fill={evaluateFill(props.habitable)}>
    </rect>
  )
}

ReactDOM.render(
  <Main />,
  document.getElementById('app')
)
