const _ = require('lodash')

function inherit(loader, templateName, hierarchy = []) {
  const template = loader.loadTemplate(templateName)
  hierarchy.push(template)
  if (template.inherits) {
    return inherit(loader, template.inherits, hierarchy)
  } else {
    return hierarchy.reverse()
  }
}

module.exports = function hydrateEntity(loader, templateName, x, y) {
  const hierarchy = inherit(loader, templateName)
  const output = _.merge({}, ...hierarchy)
  
  output.id = output.id || _.uniqueId()
  output.x = x
  output.y = y

  return output
}

