const _ = require('lodash')

const helpers = require('../helpers')
const color = require('../color')
const commandList = require('../command-list.json')

const Loader = require('./Loader')
const hydrateItem = require('./hydrateItem')
const hydrateEntity = require('./hydrateEntity')
const hydrateRoom = require('./hydrateRoom')
const Map = require('./Map')

module.exports = class Game {
  constructor() {
    this.loader = new Loader()
    this.state = {
      uiContext: 'map',
      actions: [],
      messages: [],
      pass: false,
      map: new Map(this.loader, 'map'),
      rooms: [],
      creatures: [],
      items: [],
      currentRoomId: 'cellar',
      initiative: []
    }
    
    this.state.map.generateCells()
    this.addCreature('creature-player', this.state.map.startX, this.state.map.startY)
    const player = this.getPlayer()
    // const item = this.addWeapon('weapon-pistol', player.x, player.y)
    // this.handleGrabItem(0)
    // this.handleEquipItem(0)
    this.spawnCreatures()
    // this.state.creatures.forEach(creature => {
    //   const itemId = this.addItem('weapon-knife', creature.x, creature.y)
    //   this.creatureGrabItem(creature.id, itemId)
    // })
  }
  
  loop(input) {
    this.state.messages = []
    this.handleInput(input)
    
    while (this.state.pass && this.getPlayer().hp > 0) {
      this.tick()
    }
    
    this.processActions()

    if (this.getPlayer().hp <= 0) {
      this.addMessage(color.redBg(color.black(' You are dead. ')))
    }
  }
  
  tick() {
    const player = this.getPlayer()
    this.getNearbyCreaturesWithout('player').forEach(creature => {
      if (creature.hp > 0 && player.hp > 0) {
        const weapon = creature.wielding
        console.log(creature)
        while (creature.ap > 0 && creature.ap >= weapon.apCost) {
          creature.target = 'player'
          creature.ap -= this.getApCost(creature)
          this.addAction({type: 'attack', attackerId: creature.id, defenderId: creature.target})
        }
      }
      creature.ap += creature.apRegen
      helpers.regenAp(creature)
    })
  
    helpers.regenAp(player)
  
    if (player.ap >= 0) {
      this.state.pass = false
    }
  }
  
  processMoveCreature(id, dir) {
    const creature = this.getCreature(id)
    switch(dir) {
      case 'n':
        creature.y--
        break;
      case 's':
        creature.y++
        break;
      case 'e':
        creature.x++
        break;
      case 'w':
        creature.x--
        break;
    }
  }

  spawnCreatures() {
    const map = this.state.map

    const mapCountWeights = map.weights.creatureCount
    const mapTypeWeights = map.weights.creatureType
    
    _.forOwn(this.state.map.cells, cell => {
      if (cell.room) {
        const roomCountWeights = cell.room.weights.creatureCount
        const roomTypeWeights = cell.room.weights.creatureType

        const count = helpers.weightedRoll(roomCountWeights, mapCountWeights)
        for (var i=0; i<count; i++) {
          const type = helpers.weightedRoll(roomTypeWeights, mapTypeWeights)
          this.addCreature(type, cell.x, cell.y)
        }
      }
    })
  }


  // GETTERS

  getPlayer() {
    return this.getCreature('player')
  }

  getCreature(id) {
    return _.find(this.state.creatures, creature => creature.id == id)
  }

  getCreaturesWithout(excludeId) {
    return _.filter(this.state.creatures, creature => creature.id !== excludeId)
  }

  getCreatureAc(creature) {
    var armor = creature.wearing
    var dexMod = helpers.calculateAttributeMod(creature.attributes.dex)
    var total = 0
    total += creature.baseAc
    if (armor) {
      total += armor.acBonus
      if (armor.maxDex < dexMod) {
        dexMod = armor.maxDex
      }
    }
    total += dexMod
    return total
  }

  getItem(id) {
    return _.find(this.state.items, item => item.id == id)
  }

  getApCost(creature) {
    const weapon = creature.wielding
    var netCost = weapon.apCostBase
    var attributeTotal = 0
    weapon.apAttributes.forEach(attribute => {
      attributeTotal += this.getAttributeMod(creature, attribute)
    })
    attributeTotal = Math.floor(attributeTotal/weapon.apAttributes.length)
    
    netCost += weapon.apThreshold - attributeTotal
    if (netCost < weapon.apCostMin) {netCost = weapon.apCostMin}
    
    return netCost
  }

  getAttributeMod(creature, attributeStr) {
    const attribute = creature.attributes[attributeStr]
    return Math.floor((attribute - 10)/2)
  }

  getNearbyCreaturesWithout(excludeId) {
    const player = this.getPlayer()
    return _.filter(this.state.creatures, creature => creature.id !== excludeId && creature.x === player.x && creature.y === player.y)
  }

  getNearbyItems() {
    const player = this.getPlayer()
    return _.filter(this.state.items, item => item.x === player.x && item.y === player.y && !item.stored)
  }

  getTargetOf(targeterId) {
    const targeter = this.getCreature(targeterId)
    return this.getCreature(targeter.target)
  }

  getFirstValidTargetOf(targeterId) {
    return _.find(this.getNearbyCreaturesWithout(targeterId), creature => {
      return creature.hp > 0
    })
  }

  getRoom(id) {
    return _.find(this.state.rooms, room => room.id == id)
  }

  getCurrentRoom() {
    const player = this.getPlayer()
    return this.state.map.getCell(player.x, player.y).room
  }

  // TODO these need to be done with actions. these functions should basically be action processors... right?

  creatureGrabItem(creatureId, itemId) {
    const creature = this.getCreature(creatureId)
    const item = this.getItem(itemId)
    creature.inventory.push(item)
    item.stored = true
  }

  creatureDropItem(creatureId, itemId) {
    const creature = this.getCreature(creatureId)
    const item = this.getItem(itemId)
    creature.inventory = _.without(creature.inventory, item)
    item.stored = false
    item.x = creature.x
    item.y = creature.y
  }

  creatureDie(creatureId) {
    const creature = this.getCreature(creatureId)
    creature.dead = true
    creature.inventory.forEach(item => {
      // this.addMessage(this.getItem(itemId).name)
      this.creatureDropItem(creature.id, item.id)
    })
  }

  rollInitiative(creature) {
    return helpers.diceRoll(1, 20)
      + helpers.calculateAttributeMod(creature.attributes.dex)
      + helpers.calculateAttributeMod(creature.attributes.wis)
  }


  // CALCULATORS

  calculateHit(attacker) {
    const weapon = attacker.wielding
    // const weapon = this.getItem(attacker.wielding)
    
    const hitNatural = helpers.diceRoll(1, 20)
    const crit = hitNatural >= weapon.critRange
    
    const hitBonus = weapon.hitBonus + helpers.calculateAttributeMod(attacker.attributes[weapon.hitAttribute])
    const hit = hitNatural + hitBonus
  
    return {roll: hit, crit: crit}
  }
  
  calculateDamage(attacker, didCrit) {
    const weapon = attacker.wielding
    // const weapon = this.getItem(attacker.wielding)
    const critMultiplier = didCrit ? weapon.critMult : 1
    const damageBonus = weapon.damBonus + helpers.calculateAttributeMod(attacker.attributes[weapon.damAttribute])
    const dice = helpers.diceRoll(weapon.diceCount, weapon.diceSize)
    const damage = 
      (dice + damageBonus) 
      * critMultiplier
    return damage
  }


  // SETTERS

  setTargetOf(targeterId, targetId) {
    helpers.assert(typeof targeterId === 'string', `expected targeterId to be string, got ${targeterId}`)
    helpers.assert(typeof targetId === 'string' || targetId === null, `expected targetId to be string or null, got ${targetId}`)

    if (targetId === undefined) {
      this.getCreature(targeterId).target = null
    } else {
      this.getCreature(targeterId).target = targetId
    }
  }

  // HANDLERS

  handleGrabItem(commandSuffix) {
    const index = commandSuffix
    const player = this.getPlayer()
    const item = this.getNearbyItems()[index]
    if (!item.stored) {
      this.creatureGrabItem(player.id, item.id)
    }
    else {
      this.addMessage('No item found.')
    }
  }

  handleDropItem(commandSuffix) {
    const index = commandSuffix
    const player = this.getPlayer()
    // if (index < player.inventory.length - 1) {
      const itemId = player.inventory[index]
      const item = this.getItem(itemId)
  
      this.creatureDropItem(player.id, itemId)
    // }
  }

  handleEquipItem(commandSuffix) {
    const index = commandSuffix
    const player = this.getPlayer()
    const newItem = player.inventory[index]
    const oldItem = player.wielding
    if (oldItem) {
      player.inventory.push(oldItem)
    }
    player.wielding = newItem
    player.inventory = _.without(player.inventory, newItem)
  }

  handleMove(commandSuffix) {
    const room = this.getCurrentRoom()
    if (room.exits.includes(commandSuffix)) {
      this.addAction({type:'move', id: 'player', dir: commandSuffix})
      this.setTargetOf('player', null)
    } else {
      this.addMessage('You cannot go that way.')
    }
  }

  handleTarget(targeterId, index) {
    // FIXME Handlers are only for the player!
    var targetId
    const inValidIndex = !parseInt(index) >= 0
    if (inValidIndex) {
      const target = this.getFirstValidTargetOf(targeterId)
      targetId = this.getFirstValidTargetOf(targeterId) ? target.id : null
    } else {
      index = parseInt(index)
      if (index + 1 > this.getNearbyCreaturesWithout('player').length) {
        this.addMessage(`No such option: ${index}`)
        index = 0
      }
      targetId = this.getNearbyCreaturesWithout('player')[index].id
    }
    const newTarget = this.getCreature(targetId)
    if (newTarget) {
      this.addMessage(`You target the ${newTarget.name}.`)
    } else {
      this.addMessage('No valid targets.')
    }
    this.setTargetOf(targeterId, targetId)
  }

  handleAttack(attackerId, defenderId) {
    // FIXME Handlers are only for the player!
    helpers.assert(typeof attackerId === 'string', `expected attackerId to be string, got ${attackerId}`)
    helpers.assert(typeof defenderId === 'string' || defenderId === null, `expected defenderId to be string or null, got ${defenderId}`)

    if (!defenderId) {
      this.handleTarget(attackerId)
      if (this.getTargetOf(attackerId)) {
        defenderId = this.getTargetOf(attackerId).id
      } else {
        return
      }
    }
    const player = this.getCreature('player')
    player.ap -= this.getApCost(player)
    this.addAction({type: 'attack', attackerId: attackerId, defenderId: defenderId})
  }

  processAttack(attackerId, defenderId) {
    helpers.assert(typeof attackerId === 'string', `expected attackerId to be string, got ${attackerId}`)
    helpers.assert(typeof defenderId === 'string', `expected defenderId to be object, got ${defenderId}`)

    const attacker = this.getCreature(attackerId)
    const defender = this.getCreature(defenderId)

    helpers.assert(typeof attacker === 'object', `expected attacker to be string, got ${attacker}`)
    helpers.assert(typeof defender === 'object', `expected defender to be object, got ${defender}`)

    const weapon = attacker.wielding
    // const weapon = this.getItem(attacker.wielding)
    const hit = this.calculateHit(attacker, defender)
  
    const damage = this.calculateDamage(attacker, hit.crit)
  
    const killed = (damage >= defender.hp) && !defender.dead
    const enemyIsKilled = killed && attackerId == 'player' ? ', killing it' : ''
    const playerIsKilled = killed && attackerId != 'player' ? ', killing you' : ''
  
    const hitMsg = attackerId == 'player' 
      ? `You${hit.crit ? ' critically ' : ' '}${weapon.attackDesc} (${hit.roll}) the ${defender.name} with your ${weapon.name}, dealing ${damage} damage${enemyIsKilled}.`
      : `The ${attacker.name}${hit.crit ? ' critically ' : ' '}${weapon.attackDesc}s (${hit.roll}) you with its ${weapon.name}, dealing ${damage} damage${playerIsKilled}.`
  
    const missMsg = attackerId == 'player'
      ? `You miss (${hit.roll}) the ${defender.name}.`
      : `The ${attacker.name} misses (${hit.roll}) you.`
  
    if (hit.roll > this.getCreatureAc(defender)) {
      this.addMessage(hitMsg)
      if (defender.hp - damage > 0) {
        defender.hp -= damage
      } else {
        defender.hp = 0
        this.creatureDie(defenderId)
      }
    } else {
      this.addMessage(missMsg)
    }
  }

  handleLook() {
    this.addMessage('lookit that huh')
    helpers.deductAp(this.getPlayer(), 1)
  }

  handleInput(input) {
    input = input.replace(' ', '')
    const player = this.getPlayer()
    const prefix = input[0]
    const suffix = input.slice(1)
    if (suffix == '?') {
      const helpMsg = commandList[prefix].help
      this.addMessage(helpMsg)
    } else if (input && this.getPlayer().hp > 0) {
      switch(prefix) {
        case 'i':
          if (this.state.uiContext === 'inventory') {
            this.state.uiContext = 'map'
          } else {
            this.state.uiContext = 'inventory'
          }
          break;
        case 't':
          this.handleTarget('player', suffix)
          break;
        case 'a':
          this.handleAttack(player.id, player.target)
          break;
        case 'l':
          this.handleLook(suffix)
          break;
        case 'n': case 's': case 'e': case 'w':
          this.handleMove(prefix)
          break;
        case 'g':
          this.handleGrabItem(suffix)
          break;
        case 'd':
          this.handleDropItem(suffix)
          break;
        case 'q':
          this.handleEquipItem(suffix)
          break;
        default:
          this.addMessage('Unknown command: ' + input)
      }
    } else {
      this.state.pass = true
    }
    if (player.ap <= 0) {
      this.state.pass = true
    }
  }


  // ACTIONS

  processAction(action) {
    switch (action.type) {
      case 'move':
        this.processMoveCreature(action.id, action.dir)
        break;
      case 'attack':
        this.processAttack(action.attackerId, action.defenderId)
        break;
    }
  }

  processActions() {
    this.state.actions.forEach(action => {
      this.processAction(action)
    })
    this.state.actions = []
  }


  // ADDERS

  addAction(action) {
    this.state.actions.push(action)
  }

  addMessage(message) {
    this.state.messages.push(message)
  }

  addPlayer() {
    this.addCreature('creature-player')
  }

  addCreature(templateName, x, y) {
    const creature = hydrateEntity(this.loader, templateName, x, y)
    this.state.creatures.push(creature)
    return creature.id
  }

  // addItem(templateName, x, y) {
  //   const item = hydrateItem(this.loader, templateName, x, y)
  //   this.state.items.push(item)
  //   return item.id
  // }

  addWeapon(templateName, x, y) {
    const item = hydrateEntity(this.loader, templateName, x, y)
    this.state.items.push(item)
    return item.id
  }

  addRoom(templateName) {
    const room = hydrateRoom(templateName)
    if (this.state.rooms.length <= 0) {
      this.state.currentRoomId = room.id
    }
    this.state.rooms.push(room)
    return room
  }
}
