import React from 'react';

import * as mapUtils from '../utils/mapUtils'
import * as interactionUtils from '../utils/interactionUtils'

import PlayerSprite from './PlayerSprite'
import Sprite from './Sprite'
import StatusDisplay from './StatusDisplay'

export default class Overlay extends React.Component {
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
    let player = new interactionUtils.Player()
    player.randomizeStartPosition(this.props.map)
    takenPositions.push(player.position)

    let potionTotal = 20
    let count = 0

    let potions = []

    // generating potions
    var generatePotion = () => {
      let potion = new interactionUtils.Potion([0, 0], 'potion', 30)
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
      let weapon = new interactionUtils.Weapon([0, 0], 'weapon')
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
      let monster = new interactionUtils.Monster([0,0], 'monster', randomLevel)
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

    let boss = new interactionUtils.Monster([0,0], 'boss', 7)
    boss.randomizeStartPosition(this.props.map)
    while (!this.ensureValidPosition(boss.position, takenPositions)) {
      boss = new interactionUtils.Monster([0,0], 'boss', 7)
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

    let neighbors = mapUtils.getNeighbors(x, y, this.props.map)
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
    let newPlayer = new interactionUtils.Player(potionInteraction.position)

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
    let newPlayer = new interactionUtils.Player(weaponInteraction.position)

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
