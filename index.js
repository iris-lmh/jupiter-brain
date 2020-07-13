const readline = require('readline')

const Game = require('./classes/Game')
const Renderer = require('./classes/Renderer')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function prompt() {
  console.clear()
  rl.question(renderer.render(game), (input) => {
    game.loop(input)
    prompt()
  })
}

const game = new Game()
const renderer = new Renderer(game)

prompt()