module.exports = function hydrate(loader, templateName) {
  const output = {}
  
  output.loader = loader
  const template = output.loader.loadTemplate('armor', templateName)

  output.name = template.name || 'Armor'
  output.acBonus = template.acBonus || 0
  output.maxDex = template.maxDex || null

  return output
}