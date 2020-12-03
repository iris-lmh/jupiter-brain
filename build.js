const Bundler = require('parcel-bundler')
const Path = require('path')

const entryFiles = Path.join(__dirname, './index.html')
const options = {
  cacheDir: '.parcel-cache',
}

function convertYamlsToJSON () {
  const fs = require('fs')
  const templatePath = './templates/'
}

const go = async () => {
  // Initializes a bundler using the entrypoint location and options provided
  const bundler = new Bundler(entryFiles, options)

  bundler.on('buildStart', entryPoints => {
    console.log("ITS BUILDING SOMETHING")
  });
  const bundle = await bundler.bundle()
}

go()
