const _ = require('lodash')

module.exports = {
  lootRoll(table) {
    const valueMap = _.reduce(table.items, (memo, item) => {
      memo.currentTotal += item[0]
      memo.mapped.push([
        memo.currentTotal,
        item[1]
      ])
      return memo
    }, {mapped: [], currentTotal: 0})
  
    const total = _.reduce(table.items, (sum, item) => {
      return sum += item[0]
    }, 0)
  
    const itemRoll = _.random(1, total)
  
    const result = _.find(valueMap.mapped, item => {
      return itemRoll <= item[0]
    })
  
    return result
  },
  
  dropLoot(loader, creature) {
    const results = []
    creature.loot.forEach(entry => {
      const minTries = entry[0]
      const maxTries = entry[1]
      const tableName = entry[2]
      const table = loader.loadTemplate(tableName)
      const dropChance = entry[3] || table.chance
      const tries = _.random(minTries, maxTries)
      for (var i=0; i<tries; i++) {
        const dropRoll = Math.random()
        if (dropRoll <= dropChance) {
          const result = this.lootRoll(table)
          results.push(result[1])
        }
      }
    })
    return results
  }
}