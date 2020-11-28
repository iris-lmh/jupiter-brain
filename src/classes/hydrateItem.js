module.exports = function hydrate(loader, templateName) {
  // const template = loader.loadTemplate('item', templateName)
  const output = {}
  output.name = 'Item'
  return output
}