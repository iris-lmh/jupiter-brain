const Item = require('./Item')

class Weapon extends Item {
  constructor(loader, templateName) {
    super()
    this.loader = loader
    const template = this.loader.loadTemplate('weapon', templateName)

    this.name = template.name || 'Weapon'
    this.attackDesc = template.attackDesc || 'hit'
    this.diceCount = template.diceCount || 1
    this.diceSize = template.diceSize || 4
    this.hitBonus = template.hitBonus || 0
    this.damBonus = template.damBonus || 0
    this.hitAttribute = template.hitAttribute || 'str'
    this.damAttribute = template.damAttribute || 'str'
    this.critRange = template.critRange || 20
    this.critMult = template.critMult || 2
    this.apCost = template.apCost || 3
    this.apCostBase = template.apCostBase || 6
    this.apCostMin = template.apCostMin || 3
    this.apThreshold = template.apThreshold || 0
    this.apAttributes = template.apAttributes || ['str']
    this.qualities = template.qualities || []
  }
}

module.exports = Weapon