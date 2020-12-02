const _ = require('lodash')

module.exports = function onUseMedHypo(game, helpers, item) {
  const player = game.getPlayer()

  // TODO this should be a game.healCreature function or something
  player.ap += helpers.diceRoll(item.diceCount, item.diceSize) + item.bonus
  if (player.ap > player.apMax) {player.ap = player.apMax}
  player.ap -= item.apCostBase

  // TODO this should belong to a game.removeEntity function or something. Lodash doesnt belong here.
  player.inventory = _.without(player.inventory, item)
  game.state.entities = _.without(game.state.entities, item)
}