const Entity = require('./Entity')

class Item extends Entity {
  constructor(loader, templateName) {
    super()
    // this.loader = loader
    // const template = this.loader.loadTemplate('item', templateName)
    this.name = 'Item'
  }
}

module.exports = Item