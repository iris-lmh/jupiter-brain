const _ = require('lodash')
const helpers = require('../helpers')

// const Entity = require('./Entity')
const hydrateWeapon = require('./hydrateWeapon')
const hydrateArmor = require('./hydrateArmor')

module.exports = function hydrate(loader, templateName = 'default', x = 0 , y = 0) {
  const output = {}

  // TODO move back to entity once its ECS-ified
  output.x = x
  output.y = y
  output.id = _.uniqueId()

  output.loader = loader
  const template = output.loader.loadTemplate('creature', templateName)
  output.id = template.id || output.id
  output.name = template.name || 'Creature'
  output.remainsName = template.remainsName || 'corpse'
  output.target = null
  output.attributes = template.attributes || {
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10
  }
  output.level = template.level || 1
  output.hitDie = template.hitDie || 8
  output.hpMax = helpers.rollHealth(output)
  output.hp = output.hpMax
  output.baseAc = template.baseAc || 10
  output.ap = template.ap || 5
  output.apMax = template.apMax || 6
  output.apRegen = template.apRegen || 5

  if (template.wielding) {
    output.wielding = hydrateWeapon(output.loader, template.wielding)
  } else {
    output.wielding = null
  }
  if (template.wearing) {
    output.wearing = new hydrateArmor(output.loader, template.wearing)
  } else {
    output.wearing = null
  }

  output.inventory = template.inventory || []
  return output
}