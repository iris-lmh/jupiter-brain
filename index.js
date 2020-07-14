const readline = require('readline')

const Game = require('./classes/Game')
const Renderer = require('./classes/Renderer')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function prompt() {
  console.clear() // TODO maybe this console.clear should belong to the renderer
  rl.question(renderer.render(game), (input) => {
    game.loop(input)
    prompt()
  })
}

const game = new Game()
const renderer = new Renderer(game)

prompt()