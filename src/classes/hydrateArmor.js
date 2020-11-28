module.exports = function hydrate(loader, templateName) {
  const template = loader.loadTemplate('armor', templateName)
  const output = {}

  output.name = template.name || 'Armor'
  output.acBonus = template.acBonus || 0
  output.maxDex = template.maxDex || null

  return output
}