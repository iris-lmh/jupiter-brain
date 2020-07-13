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
    _.forOwn(weights, (v, k) => {
      for (var i=0; i<v; i++) {
        expanded.push(k)
      }
    })
    return expanded
  },

  expandWeights2(weights) {
    const expanded = []
    var runningTotal = -1
    _.forOwn(weights, (v, k) => {
      const weight = {name: k, min:runningTotal + 1}
      runningTotal = runningTotal + v
      weight.max = runningTotal
      expanded.push(weight)
    })
    console.log(expanded)
    return expanded
  },

  weightedRoll(weights) {
    // FIXME only works with kv pairs, not arrays :(
    var total = 0
    _.forOwn(weights, v=>total+=v)
    console.log(weights)
    expanded = this.expandWeights2(weights)
    const roll = _.random(0, total-1)
    const result = _.find(expanded, weight => {
      return this.isInRange(roll, weight.min, weight.max)
    }).name

    return result
  },

  isInRange(n, min, max) {
    return n >= min && n <= max
  },

  mergeWeights(w1, w2) {
    const merged = {}
    _.mergeWith(merged, w1, (objectValue = 0, sourceValue) => {
      return objectValue + sourceValue
    })
    _.mergeWith(merged, w2, (objectValue = 0, sourceValue) => {
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

// const weights1 = [200,100]
// const weights2 = [2,1]
// const weights = helpers.mergeWeights(weights1, weights2)
// // console.log(weights)

// console.log(helpers.weightedRoll(weights))


module.exports = helpers