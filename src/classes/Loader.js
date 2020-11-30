const fs = require('fs')
const _ = require('lodash')
const YAML = require('yaml')

module.exports = class Loader {
  constructor() {
    this.templatesPath = './templates/'
    this.templates = {
    }
  }

  // FIXME something about the caching is causing an infinite loop HELP
  loadTemplate(name) {
    const record = _.get(this, `templates.${name}`)
    if (!record) {
      const path = `${this.templatesPath}${name}.yaml`
      const str = fs.readFileSync(path, 'utf8')
      const template = YAML.parse(str)
      this.templates[name] = template
      return template
    } else {
      return record
    }
  }
}