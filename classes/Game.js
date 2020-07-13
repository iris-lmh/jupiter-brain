const _ = require('lodash')

const helpers = require('../helpers')
const commandList = require('../command-list.json')

const Loader = require('./Loader')
const Creature = require('./Creature')
const Room = require('./Room')
const Map = require('./Map')

module.exports = class Game {
  constructor() {
    this.loader = new Loader()
    this.state = {
      actions: [],
      messages: [],
      pass: false,
      map: new Map(this.loader, 'map'),
      rooms: [],
      creatures: [],
      currentRoomId: 'cellar',
      initiative: []
    }
    
    this.state.map.generateCells()
    this.addCreature('player', this.state.map.startX, this.state.map.startY)
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
      this.addMessage('You are dead.')
    }
  }
  
  tick() {
    const player = this.getPlayer()
    this.getNearbyCreaturesWithout('player').forEach(creature => {
      if (creature.hp > 0 && player.hp > 0) {
        while (creature.ap > 0 && creature.ap >= creature.wielding.apCost) {
          creature.target = 'player'
          creature.ap -= creature.getApCost()
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

  expandWeights(weights) {
    const expanded = []
    _.forOwn(weights, (v, k) => {
      for (var i=0; i<v; i++) {
        expanded.push(k)
      }
    })
    return expanded
  }

  spawnCreatures() {
    const map = this.state.map

    // const mapCountWeights = helpers.expandWeights(map.weights.creatureCount)
    // const mapTypeWeights = helpers.expandWeights(map.weights.creatureType)

    const mapCountWeights = map.weights.creatureCount
    const mapTypeWeights = map.weights.creatureType
    
    
    _.forOwn(this.state.map.cells, cell => {
      if (cell.room) {
        const roomCountWeights = helpers.expandWeights([32,16,4,1])
        const roomTypeWeights = helpers.expandWeights({android:3, drone:1})
        // const countWeights = mapCountWeights.concat(roomCountWeights)
        // const typeWeights = mapTypeWeights.concat(roomTypeWeights)

        const countWeights = helpers.mergeWeights(roomCountWeights, mapCountWeights)
        const typeWeights = helpers.mergeWeights(roomTypeWeights, mapTypeWeights)

        const count = helpers.weightedRoll(countWeights)
        for (var i=0; i<count; i++) {
          const type = helpers.weightedRoll(typeWeights)
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

  getNearbyCreaturesWithout(excludeId) {
    const player = this.getPlayer()
    return _.filter(this.state.creatures, creature => creature.id !== excludeId && creature.x === player.x && creature.y === player.y)
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


  // CALCULATORS

  calculateHit(attacker) {
    const weapon = attacker.wielding
    
    const hitNatural = helpers.diceRoll(1, 20)
    const crit = hitNatural >= weapon.critRange
    
    const hitBonus = weapon.hitBonus + helpers.getAttributeMod(attacker.attributes[weapon.hitAttribute])
    const hit = hitNatural + hitBonus
  
    return {roll: hit, crit: crit}
  }
  
  calculateDamage(attacker, didCrit) {
    const weapon = attacker.wielding
    const critMultiplier = didCrit ? weapon.critMult : 1
    const damageBonus = weapon.damBonus + helpers.getAttributeMod(attacker.attributes[weapon.damAttribute])
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
    player.ap -= player.getApCost()
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
    const hit = this.calculateHit(attacker, defender)
  
    const damage = this.calculateDamage(attacker, hit.crit)
  
    const killed = (damage >= defender.hp) && defender.hp > 0
    const enemyIsKilled = killed && attackerId == 'player' ? ', killing it' : ''
    const playerIsKilled = killed && attackerId != 'player' ? ', killing you' : ''
  
    const hitMsg = attackerId == 'player' 
      ? `You${hit.crit ? ' critically ' : ' '}hit (${hit.roll}) the ${defender.name} with your ${weapon.name}, dealing ${damage} damage${enemyIsKilled}.`
      : `The ${attacker.name}${hit.crit ? ' critically ' : ' '}hits (${hit.roll}) you with its ${weapon.name}, dealing ${damage} damage${playerIsKilled}.`
  
    const missMsg = attackerId == 'player'
      ? `You miss (${hit.roll}) the ${defender.name}.`
      : `The ${attacker.name} misses (${hit.roll}) you.`
  
      if (hit.roll > defender.getAc()) {
        this.addMessage(hitMsg)
        if (defender.hp - damage > 0) {
          defender.hp -= damage
        } else {
          defender.hp = 0
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
    const suffix = input[1]
    if (suffix == '?') {
      const helpMsg = commandList[prefix].help
      this.addMessage(helpMsg)
    } else if (input && this.getPlayer().hp > 0) {
      switch(prefix) {
        case 'i':
          // TODO this would eventually be a context change
          this.addMessage(`Your weapon: ${player.wielding.name}`, )
          this.addMessage(`Your armor: ${player.wearing.name}`)
          this.addMessage(`Your inventory:\n ${player.inventory.join('\n')}`)
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
    this.addCreature('player')
  }

  addCreature(templateName, x, y) {
    const creature = new Creature(this.loader, templateName, x, y)
    this.state.creatures.push(creature)
  }

  addRoom(templateName) {
    const room = new Room(templateName)
    if (this.state.rooms.length <= 0) {
      this.state.currentRoomId = room.id
    }
    this.state.rooms.push(room)
    return room
  }
}
