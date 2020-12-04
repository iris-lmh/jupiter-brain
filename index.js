const xterm = require('xterm')

const Game = require('./src/classes/Game')
const Renderer = require('./src/classes/Renderer')

const game = new Game()
const renderer = new Renderer(game)

var term = new xterm.Terminal({cols: 60, rows:30, scrollback: 0});
term.setOption('fontSize', '22')
term.open(document.getElementById('terminal'));
term.write(renderer.render(game))

let input = ''

term.focus()

term.onKey(e => {
  
  if (e.key === '\r') {
    term.clear()
    game.loop(input)
    input = ''
    term.write('\r' + renderer.render(game))
  } else if (e.domEvent.key === 'Backspace') {
    if (input.length) {
      input = input.substring(0, input.length - 1)
      term.write('\b')
      term.write(' ')
      term.write('\b')
    }
  } else {
    input += e.key
    term.write(e.key);
  }
});