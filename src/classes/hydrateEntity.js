const _ = require('lodash')

module.exports = function hydrate() {
  const output = {}

  output.id = _.uniqueId()
  output.name = 'Entity'
  output.x = x
  output.y = y

  return output
}

