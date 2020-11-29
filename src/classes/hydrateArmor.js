module.exports = function hydrate(loader, templateName) {
  const template = loader.loadTemplate(templateName)
  const output = {}

  output.name = template.name || 'Armor'
  output.acBonus = template.acBonus || 0
  output.maxDex = template.maxDex || null

  return output
}