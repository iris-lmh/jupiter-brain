module.exports = function hydrate(loader, templateName) {
  const room = {}
  room.loader = loader
  const template = room.loader.loadTemplate('room', templateName)
  room.name = template.name || 'Room'
  room.icon = template.icon || 'x'
  room.creatures = template.creatures || []
  room.desc = template.desc || 'No room description.'
  room.weights = template.weights || {
    "creatureCount":[],
    "creatureType": {},
    "neighborType": {}
  }

  room.exits = []

  return room
}
