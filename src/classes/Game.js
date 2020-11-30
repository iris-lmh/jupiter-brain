const _ = require('lodash')

const helpers = require('../helpers')
const color = require('../color')
const commandList = require('../command-list.json')

const Loader = require('./Loader')
const hydrateEntity = require('./hydrateEntity')
const Map = require('./Map')

module.exports = class Game {
  constructor() {
    this.loader = new Loader()
    this.state = {
      uiContext: 'map',
      actions: [],
      messages: [],
      messageHistory: [],
      pass: false,
      map: new Map(this.loader, 'map'),
      rooms: [],
      creatures: [],
      items: [],
      entities: [],
      currentRoomId: null,
      initiative: [],
    }
    
    this.state.map.generateCells()
    this.addCreature('creature-player', this.state.map.startX, this.state.map.startY)
    this.addCreature('creature-android', this.state.map.startX, this.state.map.startY)
    this.spawnCreatures()
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
    creature.hp = 0
    creature.dead = true
    creature.inventory.forEach(item => {
      // this.addMessage(this.getItem(itemId).name)
      this.creatureDropItem(creature.id, item.id)
    })
    const player = this.getPlayer()
    if (creatureId === player.target) {
      player.target = null
    }
  }

  rollInitiative(creature) {
    return helpers.diceRoll(1, 20)
      + helpers.calculateAttributeMod(creature.attributes.dex)
      + helpers.calculateAttributeMod(creature.attributes.wis)
  }


  // CALCULATORS

  calculateHit(attacker) {
    const weapon = attacker.wielding
    
    const hitNatural = helpers.diceRoll(1, 20)
    const crit = hitNatural >= weapon.critRange
    
    const hitBonus = weapon.hitBonus + helpers.calculateAttributeMod(attacker.attributes[weapon.hitAttribute])
    const playerBonus = attacker.id === 'player' ? 2 : 0
    const hit = hitNatural + hitBonus + playerBonus
  
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

  handleTarget(commandSuffix) {
    // FIXME Maybe do targeting with actions.
    const index = parseInt(commandSuffix)
    var targetId
    const player = this.getPlayer()
    const invalidIndex = !(index >= 0)
    if (invalidIndex) {
      const target = this.getFirstValidTargetOf(player.id)
      targetId = this.getFirstValidTargetOf(player.id) ? target.id : null
    } else {
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
    this.setTargetOf(player.id, targetId)
  }

  handleAttack() {
    const player = this.getPlayer()
    const target = this.getTargetOf(player.id) || this.getFirstValidTargetOf(player.id)
    if (!target) {
      this.addMessage('No valid targets.')
      return
    }

    player.ap -= this.getApCost(player)
    this.addAction({type: 'attack', attackerId: player.id, defenderId: target.id})
  }

  processAttack(attackerId, defenderId) {
    helpers.assert(typeof attackerId === 'string', `expected attackerId to be string, got ${attackerId}`)
    helpers.assert(typeof defenderId === 'string', `expected defenderId to be object, got ${defenderId}`)

    const attacker = this.getCreature(attackerId)
    const defender = this.getCreature(defenderId)

    if (!attacker.dead) {
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
  }

  handleLook() {
    const room = this.getCurrentRoom()
    this.addMessage(room.desc)
  }

  handleContextInventory() {
    console.log(this)
    if (this.state.uiContext !== 'inventory') {
      this.state.uiContext = 'inventory'
    } else {
      this.state.uiContext = 'map'
    }
  }

  handleContextCharacterSheet() {
    if (this.state.uiContext !== 'characterSheet') {
      this.state.uiContext = 'characterSheet'
    } else {
      this.state.uiContext = 'map'
    }
  }

  handleContextMessageHistory() {
    if (this.state.uiContext !== 'messageHistory') {
      this.state.uiContext = 'messageHistory'
    } else {
      this.state.uiContext = 'map'
    }
  }

  handleContextMap() {
    this.state.uiContext = 'map'
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
      const commands = {
        map: {
          // context switchers
          c: {
            longForm: '(c)haracter sheet',
            help: '',
            handler: this.handleContextCharacterSheet.bind(this)
          },
          i: {
            longForm: '(i)nventory',
            help: '',
            handler: this.handleContextInventory.bind(this)
          },
          M: {
            longForm: '(M)essage history',
            help: '',
            handler: this.handleContextMessageHistory.bind(this)
          },

          // other commands
          t: {
            longForm: '(t)arget',
            help: '',
            handler: this.handleTarget.bind(this)
          },
          a: {
            longForm: '(a)ttack',
            help: '',
            handler: this.handleAttack.bind(this)
          },
          l: {
            longForm: '(l)ook',
            help: '',
            handler: this.handleLook.bind(this)
          },
          g: {
            longForm: '(g)rab item',
            help: '',
            handler: this.handleGrabItem.bind(this)
          },
        },
        inventory: {
          // context switchers
          c: {handler: this.handleContextCharacterSheet.bind(this)},
          i: {handler: this.handleContextInventory.bind(this)},
          m: {handler: this.handleContextMap.bind(this)},
          M: {handler: this.handleContextMessageHistory.bind(this)},

          // other commands
          d: {
            longForm: '(d)rop',
            help: '',
            handler: this.handleDropItem.bind(this)
          },
          q: {
            longForm: 'e(q)uip',
            help: '',
            handler: this.handleEquipItem.bind(this)
          }
        },
        characterSheet: {
          // context switchers
          c: {handler: this.handleContextCharacterSheet.bind(this)},
          i: {handler: this.handleContextInventory.bind(this)},
          m: {handler: this.handleContextMap.bind(this)},
          M: {handler: this.handleContextMessageHistory.bind(this)},
        },
        messageHistory: {
          // context switchers
          c: {handler: this.handleContextCharacterSheet.bind(this)},
          i: {handler: this.handleContextInventory.bind(this)},
          m: {handler: this.handleContextMap.bind(this)},
          M: {handler: this.handleContextMessageHistory.bind(this)},
        },
      }

      if (this.state.uiContext === 'map' && 'nsew'.includes(prefix)) {
        this.handleMove(prefix)
      }
      else if (commands[this.state.uiContext][prefix]) {
        commands[this.state.uiContext][prefix].handler(suffix)
      } 
      else {
        this.addMessage('Invalid command: ' + input)
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
    this.state.messageHistory.push(message)
    if (this.state.messageHistory.length > 100) {
      this.state.messageHistory.shift()
    }
  }

  addCreature(templateName, x, y) {
    const creature = hydrateEntity(this.loader, templateName, x, y)
    this.state.creatures.push(creature)

    if (creature.type === 'creature') {
      creature.hpMax = helpers.rollHealth(creature)
      creature.hp = creature.hpMax
      if (creature.wielding) {
        const hydrated = hydrateEntity(this.loader, creature.wielding)
        creature.wielding = hydrated
        creature.wielding.stored = true
        this.state.items.push(creature.wielding)
      }
      creature.inventory.forEach((item, i)=> {
        const hydrated = hydrateEntity(this.loader, item)
        hydrated.stored = true
        creature.inventory[i] = hydrated
        this.state.items.push(hydrated)
      })
      if (creature.loot && creature.loot.length) {
        const lootTables = creature.loot.map(tableName => {
          return this.loader.loadTemplate(tableName)
        })
        const counts = lootTables.map(table => {
          return table.weights.itemCount
        })
        const types = lootTables.map(table => {
          return table.weights.itemType
        })
        const count = helpers.weightedRoll(...counts)
        for (var i=0; i<count; i++) {
          const type = helpers.weightedRoll(...types)
          const item = this.addItem(type)
          this.creatureGrabItem(creature.id, item.id)
        }
  
      }
    }
    return creature
  }

  addItem(templateName, x, y) {
    const item = hydrateEntity(this.loader, templateName, x, y)
    this.state.items.push(item)
    return item
  }

  addEntity(templateName, x, y) {
    const entity = hydrateEntity(this.loader, templateName, x, y)
    this.state.entities.push(entity)
    return entity
  }
}
