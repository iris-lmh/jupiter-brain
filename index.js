const _ = require('lodash')
const readline = require('readline')

const color = require('./color')
const render = require('./render')
const creature = require('./creature')
const helpers = require('./helpers')

const commandList = require('./command-list.json')


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function setTarget(id) {
  state.player.target = id
}

function calculateHit(attacker, defender) {
  const weapon = attacker.equipped.wielding
  
  const hitNatural = helpers.diceRoll(1, 20)
  const crit = hitNatural >= weapon.critRange
  
  const hitBonus = weapon.hitBonus + helpers.getAttributeMod(attacker.attributes[weapon.hitAttribute])
  const hit = hitNatural + hitBonus

  return {roll: hit, crit: crit}
}

function calculateDamage(attacker, defender, didCrit) {
  const critMultiplier = didCrit ? weapon.critMult : 1
  const weapon = attacker.equipped.wielding
  const damageBonus = weapon.damBonus + helpers.getAttributeMod(attacker.attributes[weapon.damAttribute])
  const damage = 
    (helpers.diceRoll(weapon.diceCount, weapon.diceSize) + damageBonus) 
    * critMultiplier

  return damage
}

function handleAttack(attacker, defender) {
  const weapon = attacker.equipped.wielding
  const hit = calculateHit(attacker, defender)

  const damage = calculateDamage(attacker, defender, hit.crit)

  const killed = (damage >= defender.hp) && defender.hp > 0
  const enemyIsKilled = killed && attacker.id == 'player' ? ', killing it' : ''
  const playerIsKilled = killed && attacker.id != 'player' ? ', killing you' : ''

  const hitMsg = attacker.id == 'player' 
    ? `You${hit.crit ? ' critically ' : ' '}hit (${hit.roll}) the ${defender.name} with your ${weapon.name}, dealing ${damage} damage${enemyIsKilled}.`
    : `The ${attacker.name}${hit.crit ? ' critically ' : ' '}hits (${hit.roll}) you with its ${weapon.name}, dealing ${damage} damage${playerIsKilled}.`

  const missMsg = attacker.id == 'player'
    ? `You miss (${hit.roll}) the ${defender.name}.`
    : `The ${attacker.name} misses (${hit.roll}) you.`

  if (attacker.ap >= weapon.apCost) {
    if (hit.roll > defender.ac) {
      state.messages.push(hitMsg)
      if (defender.hp - damage > 0) {
        defender.hp -= damage
      } else {
        defender.hp = 0
      }
    } else {
      state.messages.push(missMsg)
    }
    attacker.ap -= weapon.apCost
  } else {
    if (attacker.id == 'player') {
      state.messages.push('Not enough action points.')
    }
  }
}

function handleLook() {
  state.messages.push('lookit that huh')
  helpers.deductAp(state.player, 1)
}

function handleTarget() {
  const newTarget = state.room.creatures[0]
  state.messages.push(`You target the ${newTarget.name}.`)
  setTarget(newTarget.id)
}

function handleCommand(input) {
  const prefix = input[0]
  const suffix = input[1]
  if (suffix == '?') {
    const helpMsg = commandList[prefix].help
    state.messages.push(helpMsg)
  } else if (input) {
    switch(input) {
      case 'i':
        console.log('Your equipped items:\n', state.player.equipped)
        console.log('Your inventory:\n', state.player.inventory)
        break;
      case 't':
        handleTarget()
        break;
      case 'a':
        handleAttack(state.player, helpers.getTarget(state))
        break;
      case 'l':
        handleLook()
        break;
      default:
        state.messages.push('Unknown command: ' + input)
    }
  } else {
    state.pass = true
  }
  if (state.player.ap <= 0) {
    state.pass = true
  }
}


function tick() {
  let didStuff = false
  state.room.creatures.forEach(creature => {
    if (creature.hp > 0) {
      while (creature.ap > 0 && creature.ap >= creature.equipped.wielding.apCost) {
        didStuff = true
        handleAttack(creature, state.player)
      }
    }
    creature.ap += creature.apRegen
    helpers.regenAp(creature)
  })

  helpers.regenAp(state.player)

  state.pass = false
}

function getInput() {
  rl.question(render(state), (input) => {
    state.messages = []
    console.clear()
    handleCommand(input)

    if (state.pass) {
      tick()
    }
    getInput()
  })
}

const state = {
  messages: [],
  pass: false,
  player: creature.player(),
  room: {
    desc: 'You are in a dank cellar.',
    creatures: [
      creature.goblin(),
      creature.goblin()
    ],
  }
}

console.clear()
getInput()