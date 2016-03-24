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
      this.health = 30 + (level * 15)
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
      playing: true,
      win: false
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

  loseGame() {
    this.setState({
      playing: false,
    })
  }

  winGame() {
    this.setState({
      playing: false,
      win: true
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
              playing={this.state.playing}
              lose={this.loseGame.bind(this)}
              win={this.winGame.bind(this)}/>
        </div>
      )
    } else if (!this.state.win){
      return <h1 style={{color: 'white'}}>Game Over!</h1>
    } else {
      return <h1 style={{color: 'white'}}>You won!</h1>
    }

  }
}

class Overlay extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      player: {},
      boss: {},
      playerHealth: 150,
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

    let boss = new Monster([0,0], 'boss', 7)
    boss.randomizeStartPosition(this.props.map)
    while (!this.ensureValidPosition(boss.position, takenPositions)) {
      boss = new Monster([0,0], 'boss', 7)
      boss.randomizeStartPosition(this.props.map)
    }

    takenPositions.push(boss.position)

    // remove the player position from the takenPositions; this will allow the player
    // to pass over its spawn potionInteraction
    takenPositions.shift()

    this.setState({
      player: player,
      boss: boss,
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

      if (interaction.type === 'potion') {
        this.handlePotion(interaction)
      }

      if (interaction.type === 'weapon') {
        this.updateWeapon(interaction)
      }

      if (interaction.type === 'monster') {
        this.handleMonsterInteraction(interaction)
      }

      if (interaction.type === 'boss') {
        this.handleBossInteraction(interaction)
      }
    }
  }

  determineInteraction(playerPosition) {
    //concat all interaction arrays and filter them to the item in question
    let interactions = this.state.weapons.concat(this.state.potions).concat(this.state.monsters)
    interactions = [...interactions, this.state.boss]
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
    let newBaseAttack = (newWeaponRank * 4) + this.state.playerBaseAttack

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

    let playerAttack = this.playerAttack()
    let monsterAttack = monster.attack()
    monster.receiveDamage(playerAttack)
    this.playerTakeDamage(monsterAttack)

    let newXP = this.state.playerXP
    let newMonsters = this.state.monsters.slice()
    let newTakenPositions = this.state.takenPositions.slice()

    // monster dies
    if (monster.health <= 0) {
      newMonsters = this.newInteractionsArray(newMonsters, monsterInteraction)
      newTakenPositions = this.newTakenPositions(newTakenPositions, monsterInteraction)
      this.playerIncreaseXP(monster.level)
    }

    this.setState({
      monsters: newMonsters,
      takenPositions: newTakenPositions,
    })
  }

  handleBossInteraction(bossInteraction) {
    let boss = bossInteraction
    let playerAttack = this.playerAttack()
    let bossAttack = boss.attack()
    boss.receiveDamage(playerAttack)
    this.playerTakeDamage(bossAttack)

    if (boss.health <= 0) {
      this.props.win()
    }
  }

  playerTakeDamage(damage) {
    let defenseBase = (this.state.playerLevel) * 3 + 5
    let defenseModifier = parseInt(Math.random() * defenseBase)
    let defendedDamage = (damage - defenseModifier >= 0) ? damage - defenseModifier : 0
    let newPlayerHealth = this.state.playerHealth - defendedDamage

    if (newPlayerHealth <= 0) {
      //window.removeEventListener('keydown', this.handleKeyPress.bind(this))
      this.props.lose()
    } else {
      this.setState({
        playerHealth: newPlayerHealth
      })
    }
  }

  playerIncreaseXP(monsterLevel) {
    let currentXP = this.state.playerXP
    let currentPlayerLevel = this.state.playerLevel
    let levelDifference = monsterLevel - currentPlayerLevel

    let newXP = currentXP + 10
    if (levelDifference >= 0) {
      let XPIncrease = (levelDifference * 10) + 20
      newXP += XPIncrease
    }

    if (currentPlayerLevel === 1 && newXP >= 40) {
      this.playerIncreaseLevel(2)
    }

    if (currentPlayerLevel === 2 && newXP >= 80) {
      this.playerIncreaseLevel(3)
    }

    if (currentPlayerLevel === 3 && newXP >= 130) {
      this.playerIncreaseLevel(4)
    }

    if (currentPlayerLevel === 4 && newXP >= 180) {
      this.playerIncreaseLevel(5)
    }

    this.setState({
      playerXP: newXP
    })
  }

  playerIncreaseLevel(newLevel) {
    newLevel = newLevel > 5 ?  5 : newLevel
    let healthIncrease = (60)
    let newHealth = this.state.playerHealth + healthIncrease
    this.setState({
      playerLevel: newLevel,
      playerHealth: newHealth
    })
  }

  playerAttack() {
    //base attack is modified when the player's weapon increases
    let modifier = parseInt(Math.random() * (this.state.playerLevel * 5))
    return modifier + this.state.playerBaseAttack
  }

  render() {
    let length = this.props.map.length

    let potionSprites = this.state.potions.map((potion, index) => {
      return <Sprite className="potion" position={potion.position} key={index} />
    })

    let weaponSprites = this.state.weapons.map((weapon, index) => {
      return <Sprite className="weapon" position={weapon.position} key={index} />
    })

    let monsterSprites = this.state.monsters.map((monster, index) => {
      return <Sprite className={"monster" + monster.level} position={monster.position} key={index} />
    })

    return (
      <div>
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

          <PlayerSprite position={this.state.player.position} handleKeyPress={this.handleKeyPress.bind(this)}/>
          <Sprite className="boss" position={this.state.boss.position} />

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
        <StatusDisplay
          health={this.state.playerHealth}
          weapon={this.state.playerWeapon}
          level={this.state.playerLevel}/>
      </div>
    )
  }
}

class PlayerSprite extends React.Component {
  componentDidMount() {
    window.addEventListener('keydown', this.props.handleKeyPress)
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.props.handleKeyPress)
  }

  render() {
    return <Sprite position={this.props.position} fill='blue' className='player'/>
  }

}

function Sprite(props) {
  return (
    <rect x={props.position[0] * 5} y={props.position[1] * 5}
      height="5" width="5"
      className={props.className || ''}/>
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
    return habitable ? 'gainsboro' : 'darkslategray'
  }

  return (
    <rect
      x={props.x * 5} y={props.y * 5}
      height="5" width="5"
      fill={evaluateFill(props.habitable)}>
    </rect>
  )
}

function StatusDisplay(props) {
  return (
    <div className="status-display">
      <p>Health: {props.health}</p>
      <p>Weapon: {props.weapon.name}</p>
      <p>Level: {props.level}</p>
    </div>
  )
}

ReactDOM.render(
  <Main />,
  document.getElementById('app')
)
