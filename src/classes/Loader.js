const _ = require('lodash')

module.exports = class Loader {
  constructor() {
    this.templatesPath = './templates/'
    this.scriptsPath = '../../scripts/'
    this.templates = require('../../templates.js')
    this.scripts = require('../../scripts.js')
  }

  loadTemplate(name) {
    if (!this.templates[name]) {
      throw `Template not found: ${name}`
    }
    return this.templates[name]
  }

  loadScript(name) {
    if (!this.scripts[name]) {
      throw `Script not found: ${name}`
    }
    return this.scripts[name]
  }
}
