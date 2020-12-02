module.exports = {
  // foreground
  black: function(str) {
    return `\x1b[30m${str}\x1b[0m`
  },
  red: function(str) {
    return `\x1b[31m${str}\x1b[0m`
  },
  green: function(str) {
    return `\x1b[32m${str}\x1b[0m`
  },
  yellow: function(str) {
    return `\x1b[33m${str}\x1b[0m`
  },
  blue: function(str) {
    return `\x1b[34m${str}\x1b[0m`
  },
  magenta: function(str) {
    return `\x1b[35m${str}\x1b[0m`
  },
  cyan: function(str) {
    return `\x1b[36m${str}\x1b[0m`
  },
  white: function(str) {
    return `\x1b[37m${str}\x1b[0m`
  },
  gray: function(str) {
    return `\x1b[30m${str}\x1b[0m`
  },

  // background
  blackBg: function(str) {
    return `\x1b[40m${str}\x1b[0m`
  },
  redBg: function(str) {
    return `\x1b[41m${str}\x1b[0m`
  },
  greenBg: function(str) {
    return `\x1b[42m${str}\x1b[0m`
  },
  yellowBg: function(str) {
    return `\x1b[43m${str}\x1b[0m`
  },
  blueBg: function(str) {
    return `\x1b[44m${str}\x1b[0m`
  },
  magentaBg: function(str) {
    return `\x1b[45m${str}\x1b[0m`
  },
  cyanBg: function(str) {
    return `\x1b[46m${str}\x1b[0m`
  },
  whiteBg: function(str) {
    return `\x1b[47m${str}\x1b[0m`
  },
  grayBg: function(str) {
    return `\x1b[40m${str}\x1b[0m`
  },
  reversed: function (str) {
    return `\x1b[7m${str}\x1b[0m`
  }
}