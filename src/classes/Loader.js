const fs = require('fs')
const _ = require('lodash')
const YAML = require('yaml')

module.exports = class Loader {
  constructor() {
    this.templatesPath = './templates/'
    this.scriptsPath = '../../scripts/'
    this.templates = {}
    this.scripts = {}
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

  loadScript(name) {
    const record = _.get(this, `scripts.${name}`)
    if (!record) {
      const path = `${this.scriptsPath}${name}.js`
      // const str = fs.readFileSync(path, 'utf8')
      // const template = YAML.parse(str)
      const script = require(path)
      this.scripts[name] = script
      return script
    } else {
      return record
    }
  }
}