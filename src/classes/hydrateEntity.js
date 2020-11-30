const _ = require('lodash')
const helpers = require('../helpers')

function inherit(loader, templateName, hierarchy = []) {
  const template = loader.loadTemplate(templateName)

  hierarchy.push(template)
  
  if (template.inherits) {
    return inherit(loader, template.inherits, hierarchy)
  } else {
    return hierarchy.reverse()
  }
}

module.exports = function hydrate(loader, templateName, x, y) {
  const hierarchy = inherit(loader, templateName)
  const output = _.merge({}, ...hierarchy)
  
  output.id = output.id || _.uniqueId()
  output.x = x
  output.y = y

  if (output.type === 'creature') {
    output.hpMax = helpers.rollHealth(output)
    output.hp = output.hpMax
    if (output.wielding) {
      output.wielding = hydrate(loader, output.wielding)
    }
  }

  return output
}

