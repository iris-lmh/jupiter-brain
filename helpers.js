const _ = require('lodash')

module.exports = {
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

  getTarget: function(state) {
    const target = _.find(state.room.creatures, o => o.id == state.player.target) || {name: 'nothing'}
    return target
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