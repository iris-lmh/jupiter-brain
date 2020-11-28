module.exports = function hydrate(loader, templateName) {
  const output = {}
  const template = loader.loadTemplate('weapon', templateName)

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

  return output
}