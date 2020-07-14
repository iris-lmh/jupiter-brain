const Item = require('./Item')

class Armor extends Item {
  constructor(loader, templateName) {
    super()
    this.loader = loader
    const template = this.loader.loadTemplate('armor', templateName)

    this.name = template.name || 'Armor'
    this.acBonus = template.acBonus || 0
    this.maxDex = template.maxDex || null
  }
}

module.exports = Armor