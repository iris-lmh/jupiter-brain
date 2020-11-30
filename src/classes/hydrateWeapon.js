const hydrateItem = require('./hydrateItem')

module.exports = function hydrate(loader, templateName, x, y) {
  const template = loader.loadTemplate(templateName)
  const output = hydrateItem(loader, 'item', x, y)

  // FIXME inheritance please
  // output.id = _.uniqueId()
  // output.x = x
  // output.y = y
  // stored = false

  output.name = template.name || 'Weapon'
  output.attackDesc = template.attackDesc || 'hit'
  output.diceCount = template.diceCount || 1
  output.diceSize = template.diceSize || 4
  output.hitBonus = template.hitBonus || 0
  output.damBonus = template.damBonus || 0
  output.hitAttribute = template.hitAttribute || 'str'
  output.damAttribute = template.damAttribute || 'str'
  output.critRange = template.critRange || 20
  output.critMult = template.critMult || 2
  output.apCost = template.apCost || 3
  output.apCostBase = template.apCostBase || 6
  output.apCostMin = template.apCostMin || 3
  output.apThreshold = template.apThreshold || 0
  output.apAttributes = template.apAttributes || ['str']
  output.qualities = template.qualities || []
  output.equipable = template.equipable || true
  output.slot = template.slot || 'wielding'

  return output
}