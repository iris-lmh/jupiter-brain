const helpers = require('../helpers')

const Entity = require('./Entity')
const Weapon = require('./Weapon')
const Armor = require('./Armor')

class Creature extends Entity {
  constructor(loader, templateName = 'default', x, y) {
    super(x, y)
    this.loader = loader
    const template = this.loader.loadTemplate('creature', templateName)

    this.id = template.id || this.id
    this.name = template.name || 'Creature'
    this.remainsName = template.remainsName || 'corpse'
    this.target = null
    this.attributes = template.attributes || {
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10
    }
    this.level = template.level || 1
    this.hitDie = template.hitDie || 8
    this.hpMax = this.rollHealth()
    this.hp = this.hpMax
    this.baseAc = template.baseAc || 10
    this.ap = template.ap || 5
    this.apMax = template.apMax || 6
    this.apRegen = template.apRegen || 5

    if (template.wielding) {
      this.wielding = new Weapon(this.loader, template.wielding)
    } else {
      this.wielding = null
    }
    if (template.wearing) {
      this.wearing = new Armor(this.loader, template.wearing)
    } else {
      this.wearing = null
    }

    this.inventory = template.inventory || []
  }

  getAc() {
    var armor = this.wearing
    var dexMod = this.getAttributeMod('dex')
    var total = 0
    total += this.baseAc
    if (armor) {
      total += armor.acBonus
      if (armor.maxDex < dexMod) {
        dexMod = armor.maxDex
      }
    }
    total += dexMod
    return total
  }

  getAttributeMod(attributeStr) {
    const attribute = this.attributes[attributeStr]
    return Math.floor((attribute - 10)/2)
  }

  rollHealth(levels = this.level) {
    if (this.id == 'player') {
      return this.hitDie + this.level * this.getAttributeMod('con')
    } else {
      var hp = helpers.diceRoll(levels, this.hitDie)
      if (hp < this.hitDie/2) {hp = this.hitDie/2}
      hp +=  this.level * this.getAttributeMod('con')
      return hp
    }
  }

  rollInitiative() {
    return helpers.diceRoll(1, 20)
      + this.getAttributeMod('dex')
      + this.getAttributeMod('wis')
  }

  getApCost() {
    const weapon = this.wielding
    var netCost = weapon.apCostBase
    var attributeTotal = 0
    weapon.apAttributes.forEach(attribute => {
      attributeTotal += this.getAttributeMod(attribute)
    })
    attributeTotal = Math.floor(attributeTotal/weapon.apAttributes.length)
    
    netCost += weapon.apThreshold - attributeTotal
    if (netCost < weapon.apCostMin) {netCost = weapon.apCostMin}
    
    return netCost
  }
}

module.exports = Creature