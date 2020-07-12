const _ = require('lodash')

module.exports = {
  assert: function(assertion, message) {
    if (!assertion) {
      console.trace()
      throw message
    }
  },

  expandWeights(weights) {
    const expanded = []
    _.forOwn(weights, (v, k) => {
      for (var i=0; i<v; i++) {
        expanded.push(k)
      }
    })
    return expanded
  },

  diceRoll: function(count, size) {
    let sum = 0
    for (var i=0; i<count; i++) {
      sum += _.random(1, size)
    }
    return sum
  },

  getAttributeMod: function(n) {
    return Math.floor((n - 10)/2)
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