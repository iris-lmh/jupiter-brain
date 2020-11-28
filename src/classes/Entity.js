const _ = require('lodash')

class Entity {
  constructor(x, y) {
    this.id = _.uniqueId()
    this.name = 'Entity'
    this.x = x
    this.y = y
  }
}

module.exports = Entity