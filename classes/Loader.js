const fs = require('fs')
const _ = require('lodash')
const YAML = require('yaml')

module.exports = class Loader {
  constructor() {
    this.templatesPath = './templates/'
    this.templates = {
      weapon: {},
      armor: {},
      creature: {},
      map: {},
      room: {}
    }
  }

  loadTemplate(category, name) {
    const record = _.get(this, `templates.${category}.${name}`)
    if (!record) {
      const path = `${this.templatesPath}${category}/${name}.yaml`
      const str = fs.readFileSync(path, 'utf8')
      const template = YAML.parse(str)
      this.templates[category][name] = template
      return template
    } else {
      return record
    }
  }
}