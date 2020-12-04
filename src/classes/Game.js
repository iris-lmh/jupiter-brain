const _ = require('lodash')

const helpers = require('../helpers')
const color = require('../color')
const commands = require('../commands.js')

const Loader = require('./Loader')
const storage = require('../storage')
const hydrateEntity = require('./hydrateEntity')
const Map = require('./Map')

module.exports = class Game {
  constructor() {
    this.loader = new Loader()
    const save = storage.load(0)
    this.state = {
      uiContext: 'map',
      actions: [],
      messages: [],
      messageHistory: [],
      pass: false,
      map: null,
      rooms: [],
      entities: [],
      currentRoomId: null,
      initiative: [],
      depth: 0,
      creatureCount: 0,
      itemCount: 0,
      saveIndex: 0
    }
    
    
    this.state.uiContext = 'map'
    
    this.commands = new commands(this)
    
    // if (!save) {
      const player = this.addEntity('creature-player')
      this.handleNewMap()
    // }
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
    this.autoSave()
  }
  
  tick() {
    const player = this.getPlayer()
    this.getNearbyEntitiesWithout('player').forEach(creature => {
      if (creature.hp > 0 && player.hp > 0) {
        const weapon = creature.wielding
        while (creature.ap > 0 && creature.ap >= weapon.apCost) {
          creature.target = 'player'
          creature.ap -= this.getApCost(creature)
          this.addAction({type: 'attack', entityId: creature.id, defenderId: creature.target})
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

  debugSpawnEntity(commandSuffix) {
    const player = this.getPlayer()
    this.addEntity(commandSuffix, player.x, player.y)
  }

  debugAddNanites(commandSuffix) {
    const player = this.getPlayer()
    player.nanites += parseInt(commandSuffix)
  }
  
  processMoveCreature(id, dir) {
    const creature = this.getEntity(id)
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
          const templateName = helpers.weightedRoll(roomTypeWeights, mapTypeWeights)
          this.addEntity(templateName, cell.x, cell.y)
        }
      }
    })
  }

  spawnLoot() {
    const cellsWithRooms = _.filter(this.state.map.cells, cell => cell.room !== null)
    const randomCell = _.sample(cellsWithRooms)
    const exit = this.addEntity('structure-exit', randomCell.x, randomCell.y)
    randomCell.structures.push('exit')
  }

  // GETTERS

  getCell(x, y) {
    return this.state.map.cells[`${x},${y}`]
  }

  getPlayer() {
    return this.getEntity('player')
  }

  getEntity(id) {
    return _.find(this.state.entities, entity => entity.id == id)
  }

  getEntitiesWithout(excludeId) {
    return _.filter(this.state.entities, entity => entity.id !== excludeId)
  }

  getAc(creature) {
    var armor = creature.wearing
    var dexMod = helpers.calculateAttributeMod(creature.dex)
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

  getApCost(creature) {
    const weapon = creature.wielding
    var netCost = weapon.apCostBase
    var attributeTotal = 0
    weapon.apAttributes.forEach(attribute => {
      attributeTotal += this.getAttributeMod(creature, attribute)
    })
    attributeTotal = Math.floor(attributeTotal/weapon.apAttributes.length)
    
    netCost -= attributeTotal
    if (netCost < weapon.apCostMin) {netCost = weapon.apCostMin}
    if (netCost > weapon.apCostMax) {netCost = weapon.apCostMax}
    
    return netCost
  }

  getAttributeMod(creature, attributeStr) {
    const attribute = creature[attributeStr]
    return Math.floor((attribute - 10)/2)
  }

  getNearbyEntitiesWithout(excludeId) {
    const player = this.getPlayer()
    return _.filter(this.state.entities, entity => entity.id !== excludeId && entity.x === player.x && entity.y === player.y)
  }

  getTargetOf(targeterId) {
    const targeter = this.getEntity(targeterId)
    return this.getEntity(targeter.target)
  }

  getFirstValidTargetOf(targeterId) {
    return _.find(this.getNearbyEntitiesWithout(targeterId), creature => {
      return creature.hp > 0
    })
  }

  getCurrentRoom() {
    const player = this.getPlayer()
    return this.getCell(player.x, player.y).room
  }

  // TODO these need to be done with actions. these functions should basically be action processors... right?

  creatureGrabItem(creatureId, itemId) {
    const creature = this.getEntity(creatureId)
    const item = this.getEntity(itemId)
    creature.inventory.push(item)
    // item.stored = true
    this.deleteEntity(item.id)
  }

  creatureDropItem(creatureId, index) {
    const creature = this.getEntity(creatureId)
    const item = creature.inventory[index]
    item.x = creature.x
    item.y = creature.y
    this.state.entities.push(item)
    creature.inventory = _.without(creature.inventory, item)
  }

  creatureDie(creatureId) {
    const creature = this.getEntity(creatureId)
    const player = this.getPlayer()
    creature.hp = 0
    creature.dead = true
    if (creatureId !== player.id) {
      creature.inventory.forEach((item, i) => {
        this.creatureDropItem(creature.id, 0)
      })
      if (creatureId === player.target) {
        player.target = null
      }
      this.deleteEntity(creatureId)
    }
  }

  rollInitiative(creature) {
    return helpers.diceRoll(1, 20)
      + helpers.calculateAttributeMod(creature.dex)
      + helpers.calculateAttributeMod(creature.wis)
  }


  // CALCULATORS

  calculateHit(attacker) {
    const weapon = attacker.wielding
    
    const hitNatural = helpers.diceRoll(1, 20)
    const crit = hitNatural >= weapon.critRange
    
    const hitBonus = weapon.hitBonus + helpers.calculateAttributeMod(attacker[weapon.hitAttribute])
    const playerBonus = attacker.id === 'player' ? 2 : 0
    const hit = hitNatural + hitBonus + playerBonus
  
    return {roll: hit, crit: crit}
  }
  
  calculateDamage(attacker, didCrit) {
    const weapon = attacker.wielding
    // const weapon = this.getEntity(attacker.wielding)
    const critMultiplier = didCrit ? weapon.critMult : 1
    const damageBonus = weapon.damBonus + helpers.calculateAttributeMod(attacker[weapon.damAttribute])
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
      this.getEntity(targeterId).target = null
    } else {
      this.getEntity(targeterId).target = targetId
    }
  }

  // HANDLERS

  handleSave(commandSuffix) {
    const index = parseInt(commandSuffix)
    this.state.saveIndex = index

    storage.save(this, index)
  }

  autoSave() {
    storage.save(this, this.state.saveIndex)
  }

  handleLoad(commandSuffix) {
    const index = parseInt(commandSuffix)
    const save = storage.load(this.state.saveIndex)
    console.log(save)
    if (save) {
      this.state = save
    }
  }

  handleNewMap() {
    this.state.map = new Map(this.loader, 'map', this.state.depth)
    this.getEntitiesWithout('player').forEach(entity => {
      this.deleteEntity(entity.id)
    })
    this.spawnCreatures()
    this.spawnLoot()
    const player = this.getPlayer()
    player.x = this.state.map.startX
    player.y = this.state.map.startY
    this.state.depth += 1
  }

  handleIncreaseAttribute(commandSuffix) {
    const index = parseInt(commandSuffix)
    const player = this.getPlayer()
    const attributes = [
      'int',
      'wis',
      'cha',
      'str',
      'dex',
      'con'
    ]
    const attributeName = attributes[index]
    if (player.nanites >= player.naniteCost) {
      const hpPercentage = player.hp / player.hpMax
      player.nanites -= player.naniteCost
      player.level += 1
      player[attributeName] += 1
      player.naniteCost = Math.floor(player.naniteCost * 1.618)
      
      player.hpMax = Math.floor(player.hpMax * 1.618) + player.level * helpers.calculateAttributeMod(player.con)
      player.hp = Math.floor(player.hpMax * hpPercentage)
      this.addMessage(`${attributeName.toUpperCase()} increased.`)

    }
    else {
      this.addMessage('Not enough EXP.')
    }
  }

  handleGrabItem(commandSuffix) {
    const index = parseInt(commandSuffix)
    const player = this.getPlayer()
    const entity = this.getNearbyEntitiesWithout('player')[index]

    if (!entity) {
      this.addMessage('No item found.')
    }
    else if (entity.tags.includes('item') && entity.grabable) {
      this.creatureGrabItem(player.id, entity.id)
    }
    else if (entity.tags.includes('item') || !entity.grabable) {
      this.addMessage(`You cannot grab the ${entity.name}.`)
    }
    else {
      this.addMessage('No item found.')
    }
  }

  handleDropItem(commandSuffix) {
    const index = parseInt(commandSuffix)
    const player = this.getPlayer()
    // if (index < player.inventory.length - 1) {
      // const itemId = player.inventory[index]
      // const item = this.getEntity(itemId)
  
      this.creatureDropItem(player.id, index)
    // }
  }

  handleEquipItem(commandSuffix) {
    const index = parseInt(commandSuffix)
    const player = this.getPlayer()
    const newItem = player.inventory[index]
    const oldItem = player.wielding
    if (oldItem) {
      player.inventory.push(oldItem)
    }
    player.wielding = newItem
    player.inventory = _.without(player.inventory, newItem)
  }

  handleMove(dir) {
    const room = this.getCurrentRoom()
    if (room.exits.includes(dir)) {
      this.addAction({type:'move', entityId: 'player', dir: dir})
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
      if (index + 1 > this.getNearbyEntitiesWithout('player').length) {
        this.addMessage(`No such option: ${index}`)
        index = 0
      }
      targetId = this.getNearbyEntitiesWithout('player')[index].id
    }
    const newTarget = this.getEntity(targetId)
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
    this.addAction({type: 'attack', entityId: player.id, defenderId: target.id})
  }

  processAttack(attackerId, defenderId) {
    helpers.assert(typeof attackerId === 'string', `expected attackerId to be string, got ${attackerId}`)
    helpers.assert(typeof defenderId === 'string', `expected defenderId to be object, got ${defenderId}`)

    const attacker = this.getEntity(attackerId)
    const defender = this.getEntity(defenderId)

    if (attacker && !attacker.dead) {
      helpers.assert(typeof attacker === 'object', `expected attacker to be string, got ${attacker}`)
      helpers.assert(typeof defender === 'object', `expected defender to be object, got ${defender}`)
  
      const weapon = attacker.wielding
      // const weapon = this.getEntity(attacker.wielding)
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
      
      if (hit.roll > this.getAc(defender)) {
        this.addMessage(hitMsg + ` ${this.getApCost(attacker)} ap`)
        if (defender.hp - damage > 0) {
          defender.hp -= damage
        } else {
          defender.hp = 0
          this.creatureDie(defenderId)
          if (attackerId == 'player') {
            attacker.nanites += defender.naniteValue
          }
        }
      } else {
        this.addMessage(missMsg + ` ${this.getApCost(attacker)} ap`)
      }
    }
  }

  handleUse(commandSuffix){
    const index = parseInt(commandSuffix)
    const player = this.getPlayer()
    const context = this.state.uiContext
    let item
    if (context === 'inventory') {
      item = player.inventory[index]
    } else if (context === 'map') {
      item = this.getNearbyEntitiesWithout('player')[index]
    }
    if (item && item.onUse) {
      const script = this.loader.loadScript(item.onUse)
      this.addMessage(`You use the ${item.name}.`)
      script(this, helpers, item)
    }
    else {
      this.addMessage(`You cannot use that.`)
    }
    // }
  }
  handleLook() {
    const room = this.getCurrentRoom()
    this.addMessage(room.desc)
  }

  switchUiContext(context) {
    this.state.uiContext = context
  }

  handleInput(input) {
    input = input.replace(' ', '')
    const player = this.getPlayer()
    const prefix = input[0]
    const suffix = input.slice(1)

    if (input && this.getPlayer().hp > 0) {
      if (this.commands[this.state.uiContext][prefix] && suffix == '?') {
        const helpMsg = this.commands[this.state.uiContext][prefix].help
        this.addMessage(helpMsg)
      } 
      else if (this.state.uiContext === 'map' && 'nsew'.includes(prefix)) {
        this.handleMove(prefix)
      }
      else if (this.commands[this.state.uiContext][prefix]) {
        this.commands[this.state.uiContext][prefix].handler.bind(this)(suffix)
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
    const entity = this.getEntity(action.entityId)
    if (entity) {
      switch (action.type) {
        case 'move':
          this.processMoveCreature(action.entityId, action.dir)
          break;
        case 'attack':
          this.processAttack(action.entityId, action.defenderId)
          break;
      }
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
    if (this.state.messageHistory.length > 25) {
      this.state.messageHistory.shift()
    }
  }

  addEntity(templateName, x, y) {
    const entity = hydrateEntity(this.loader, templateName, x, y)
    this.state.entities.push(entity)
    
    if (entity.tags.includes('creature')) {
      this.state.creatureCount += 1
      entity.hpMax = helpers.rollHealth(entity)
      entity.hp = entity.hpMax
      if (entity.wielding) {
        const hydrated = hydrateEntity(this.loader, entity.wielding)
        entity.wielding = hydrated
      }
      if (entity.wearing) {
        const hydrated = hydrateEntity(this.loader, entity.wearing)
        entity.wearing = hydrated
      }
      entity.inventory.forEach((templateName, i)=> {
        const hydrated = hydrateEntity(this.loader, templateName)
        entity.inventory[i] = hydrated
        this.state.itemCount += 1
      })
      if (entity.loot && entity.loot.length) {
        const lootTables = entity.loot.map(tableName => {
          return this.loader.loadTemplate(tableName)
        })
        const counts = lootTables.map(table => {
          return table.weights.itemCount
        })
        const templateNames = lootTables.map(table => {
          return table.weights.itemType
        })
        const count = helpers.weightedRoll(...counts)
        for (var i=0; i<count; i++) {
          const templateName = helpers.weightedRoll(...templateNames)
          const hydrated = hydrateEntity(this.loader, templateName)
          entity.inventory.push = hydrated
          this.state.itemCount += 1
        }
  
      }
    } 
    return entity
  }

  deleteEntity (id) {
    const entity = this.getEntity(id)
    this.state.entities = _.without(this.state.entities, entity)
  }

}
