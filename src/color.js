module.exports = {
  // foreground
  black: function(str) {
    return `\u001b[30m${str}\u001b[0m`
  },
  red: function(str) {
    return `\u001b[31m${str}\u001b[0m`
  },
  green: function(str) {
    return `\u001b[32m${str}\u001b[0m`
  },
  yellow: function(str) {
    return `\u001b[33m${str}\u001b[0m`
  },
  blue: function(str) {
    return `\u001b[34m${str}\u001b[0m`
  },
  magenta: function(str) {
    return `\u001b[35m${str}\u001b[0m`
  },
  cyan: function(str) {
    return `\u001b[36m${str}\u001b[0m`
  },
  white: function(str) {
    return `\u001b[37m${str}\u001b[0m`
  },
  gray: function(str) {
    return `\u001b[30m${str}\u001b[0m`
  },

  // background
  blackBg: function(str) {
    return `\u001b[40m${str}\u001b[0m`
  },
  redBg: function(str) {
    return `\u001b[41m${str}\u001b[0m`
  },
  greenBg: function(str) {
    return `\u001b[42m${str}\u001b[0m`
  },
  yellowBg: function(str) {
    return `\u001b[43m${str}\u001b[0m`
  },
  blueBg: function(str) {
    return `\u001b[44m${str}\u001b[0m`
  },
  magentaBg: function(str) {
    return `\u001b[45m${str}\u001b[0m`
  },
  cyanBg: function(str) {
    return `\u001b[46m${str}\u001b[0m`
  },
  whiteBg: function(str) {
    return `\u001b[47m${str}\u001b[0m`
  },
  grayBg: function(str) {
    return `\u001b[40m${str}\u001b[0m`
  },
  grayBrightBg: function(str) {
    return `\u001b[40;2m${str}\u001b[0m`
  },
  reversed: function (str) {
    return `\u001b[7m${str}\u001b[0m`
  }
}