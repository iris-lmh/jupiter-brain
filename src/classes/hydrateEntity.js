const { template } = require('lodash')
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
  // const output = _.merge({}, ...hierarchy)
  const output = _.mergeWith({}, ...hierarchy, (objValue, srcValue)=>{
    if (_.isArray(objValue)) {
      return objValue.concat(srcValue);
      // return srcValue
    }
    else {
      return srcValue
    }
  })
  
  output.id = output.id || _.uniqueId()
  output.x = x
  output.y = y

  return output
}

