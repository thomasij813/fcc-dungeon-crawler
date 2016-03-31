export class Creature {
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

export class Player extends Creature {
  constructor(position) {
    super(position)
  }
}

export class Monster extends Creature{
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

export class Item extends Creature {
  constructor(position, type) {
    super(position)
    this.type = type
  }
}

export class Weapon extends Item {
  constructor(position, type) {
    super(position, type)
  }
}

export class Potion extends Item {
  constructor(position, type, hp) {
    super(position, type)
    this.hp = hp
  }
}
