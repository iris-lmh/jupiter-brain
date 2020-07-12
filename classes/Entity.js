const _ = require('lodash')

class Entity {
  constructor(x, y) {
    this.id = _.uniqueId()
    this.name = 'Entity'

    // FIXME this stuff can get weird cuz zero is falsy
    this.x = x
    this.y = y
  }
}

module.exports = Entity