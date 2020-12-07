const _ = require('lodash')

const helpers = {
  assert: function(assertion, message) {
    if (!assertion) {
      throw message
    }
  },

  expandWeightTable(table) {
    const expanded = []
    var runningTotal = -1
    _.forOwn(table, (v, k) => {
      const entry = {name: k, min: runningTotal + 1}
      runningTotal = runningTotal + v
      entry.max = runningTotal
      expanded.push(entry)
    })
    return expanded
  },

  weightedRoll() {
    const merged = this.mergeWeights(arguments)
    
    var total = 0
    _.forOwn(merged, v => {
      total += parseInt(v)
    })

    expanded = this.expandWeightTable(merged)
    const roll = _.random(0, total-1)
    const result = _.find(expanded, table => {
      return this.isInRange(roll, table.min, table.max)
    })
    return result.name
  },

  isInRange(n, min, max) {
    const result = n >= min && n <= max
    return result
  },

  mergeWeights(tables) {
    const merged = {}
    for (var i=0; i < tables.length; i++) {
      const table = tables[i]

      _.mergeWith(merged, table, (objectValue = 0, sourceValue) => {
        if (parseInt(objectValue >= 0)) {
          objectValue = parseInt(objectValue)
        }
        if (parseInt(sourceValue) >= 0) {
          sourceValue = parseInt(sourceValue)
        }
        return objectValue + sourceValue
      })
    }
    return merged
  },

  diceRoll: function(count, size) {
    let sum = 0
    for (var i=0; i<count; i++) {
      sum += _.random(1, size)
    }
    return sum
  },

  rollHealth(creature) {
    if (creature.id == 'player') {
      return ( creature.hitDie + creature.level * this.calculateAttributeMod(creature.con) )
    } else {
      var hp = this.diceRoll(creature.level, creature.hitDie)
      if (hp < creature.level * creature.hitDie / 2) {hp = creature.level * creature.hitDie / 2}
      hp +=  creature.level * this.calculateAttributeMod(creature.con)
      return hp
    }
  },

  calculateAttributeMod: function(n) {
    return Math.floor((n - 10))
  },

  deductAp: function(creature, amount) {
    creature.ap -= amount 
    if (creature.ap < 0) {
      creature.ap = 0
    }
  },

  regenAp: function(creature) {
    creature.ap += creature.apRegen
    if (creature.ap > creature.apMax) {
      creature.ap = creature.apMax
    }
  }
}

module.exports = helpers