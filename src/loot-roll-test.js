const fs = require('fs')
const _ = require('lodash')
const YAML = require('yaml')

const loot = require('./loot')

const creatureTemplates = []
const lootTables = {}

const paths = fs.readdirSync('./templates')

paths.forEach(path => {
  const fileName = path.split('.')[0]
  const words = fileName.split('-')
  const prefix = words[0]
  const isCreature = fileName.includes('creature-')
  const isLootTable = fileName.includes('table-loot-')
  if (isCreature || isLootTable) {
    const template = YAML.parse(fs.readFileSync('./templates/' + path, 'utf8'))
    if (isCreature && template.name !== 'Player' && template.name !== 'Creature') {
      creatureTemplates.push(template)
    }
    else if (isLootTable) {
      lootTables[fileName] = template
    } 
  }
})

const loader = {
  lootTables: lootTables,
  loadTemplate(templateName) {
    return this.lootTables[templateName]
  }
}

function testLoot(creature, count) {
  console.log('killing', count, creature.name)
  const totals = {}
  for (var i=0; i<count; i++) {
    const results = loot.dropLoot(loader, creature)

    results.forEach(result => {
      if (!totals[result]) {
          totals[result] = 0
        }
        totals[result] += 1
    })
  }
  return totals
}

creatureTemplates.forEach(creatureTemplate => {
  console.log(testLoot(creatureTemplate, 100))
  console.log()
})
