const _ = require('lodash')

const Entity = require('./Entity')

class Room extends Entity {
  constructor(loader, templateName) {
    super()
    this.loader = loader
    const template = this.loader.loadTemplate('room', templateName)
    this.name = template.name || 'Room'
    this.icon = template.icon || 'x'
    this.creatures = template.creatures || []
    this.desc = template.desc || 'No room description.'
    this.weights = template.weights || {
      "creatureCount":[],
      "creatureType": {},
      "neighborType": {}
    }

    this.exits = []
  }

  getCreaturesWithout(excludeId) {
    return _.without(this.creatures, excludeId)
  }
}

module.exports = Room