const xterm = require('xterm')

const Game = require('./src/classes/Game')
const Renderer = require('./src/classes/Renderer')

const game = new Game()
const renderer = new Renderer(game)

var term = new xterm.Terminal();
term.open(document.getElementById('terminal'));
term.write(renderer.render(game))

let input = ''

term.onKey(e => {
  input += e.key
  if (e.key === '\r') {
    term.clear()
    game.loop(input)
    input = ''
    term.write(renderer.render(game))
  } else if (e.domEvent.key === 'Backspace') {
    term.clear()
    term.write(renderer.render(game))
    input = ''
  } else {
    // console.log(e)
    term.write(e.key);
  }
});