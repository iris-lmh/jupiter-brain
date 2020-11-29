const _ = require('lodash')

module.exports = function hydrate(loader, templateName, x, y) {
  // const template = loader.loadTemplate('item', templateName)
  const output = {}
  output.name = 'Item'
  output.id = _.uniqueId()
  output.x = x
  output.y = y
  stored = false
  return output
}