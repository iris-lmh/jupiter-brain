module.exports = function hydrate(loader, templateName) {
  const template = loader.loadTemplate('room', templateName)
  const output = {}
  
  output.name = template.name || 'Room'
  output.icon = template.icon || 'x'
  output.creatures = template.creatures || []
  output.desc = template.desc || 'No output description.'
  output.weights = template.weights || {
    "creatureCount":[],
    "creatureType": {},
    "neighborType": {}
  }

  output.exits = []

  return output
}
