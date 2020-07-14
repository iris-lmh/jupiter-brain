const _ = require('lodash')

const helpers = {
  assert: function(assertion, message) {
    if (!assertion) {
      console.trace()
      throw message
    }
  },

  expandWeights(weights) {
    const expanded = []
    var runningTotal = -1
    _.forOwn(weights, (v, k) => {
      const weight = {name: k, min:runningTotal + 1}
      runningTotal = runningTotal + v
      weight.max = runningTotal
      expanded.push(weight)
    })
    return expanded
  },

  weightedRoll(weights) {
    var total = 0
    _.forOwn(weights, v => {
      total += parseInt(v)
    })

    expanded = this.expandWeights(weights)
    const roll = _.random(0, total-1)
    const result = _.find(expanded, weight => {
      return this.isInRange(roll, weight.min, weight.max)
    })
    return result.name
  },

  isInRange(n, min, max) {
    const result = n >= min && n <= max
    return result
  },

  mergeWeights(w1, w2) {
    const merged = {}
    _.mergeWith(merged, w1, (objectValue = 0, sourceValue) => {
      if (parseInt(objectValue >= 0)) {
        objectValue = parseInt(objectValue)
      }
      if (parseInt(sourceValue) >= 0) {
        sourceValue = parseInt(sourceValue)
      }
      return objectValue + sourceValue
    })
    _.mergeWith(merged, w2, (objectValue = 0, sourceValue) => {
      if (parseInt(sourceValue) >= 0) {
        sourceValue = parseInt(sourceValue)
      }
      return objectValue + sourceValue
    })
    return merged
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

module.exports = helpers