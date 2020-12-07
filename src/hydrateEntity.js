const _ = require('lodash')
const uuid = require('uuid')

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
  const output = _.mergeWith({}, ...hierarchy, (objValue, srcValue)=>{
    if (_.isArray(objValue)) {
      return objValue.concat(srcValue);
    }
    else {
      return srcValue
    }
  })
  
  // TODO use actual uuids to keep it random between sessions
  output.id = output.id || uuid.v4()
  output.x = x
  output.y = y

  return output
}

