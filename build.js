const Bundler = require('parcel-bundler')
const Path = require('path')
const fs = require('fs')

const entryFiles = Path.join(__dirname, './index.html')
const options = {
  cacheDir: '.parcel-cache',
}

function buildTemplates () {
  console.log("Building templates...")
  const paths = fs.readdirSync('./templates')
  const lines = []
  lines.push('module.exports = {')
  paths.forEach(path => {
    const name = path.split('.')[0]
    lines.push(`  '${name}': require('./templates/${path}'),`)
  })
  lines.push('}')
  fs.writeFileSync('./templates.js', lines.join('\n'))
}

function buildScripts () {
  console.log("Building scripts...")
  const paths = fs.readdirSync('./scripts')
  const lines = []
  lines.push('module.exports = {')
  paths.forEach(path => {
    const name = path.split('.')[0]
    lines.push(`  '${name}': require('./scripts/${path}'),`)
  })
  lines.push('}')
  fs.writeFileSync('./scripts.js', lines.join('\n'))
}

const go = async () => {
  const bundler = new Bundler(entryFiles, options)
  buildTemplates()
  buildScripts()

  bundler.on('buildStart', entryPoints => {
  });

  const bundle = await bundler.serve()
}

go()
