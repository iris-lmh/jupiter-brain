const _ = require('lodash')
const Loader = require('./classes/Loader')
const hydrateEntity = require('./classes/hydrateEntity')

const loader = new Loader()

const newItem = hydrateEntity(loader, 'item', 10, 11)

console.log(newItem)