const _ = require('lodash')

const color = require('./color')
const helpers = require('./helpers')

function renderRoom(state) {
  const lines = []
  lines.push(state.room.desc)
  state.room.creatures.forEach(thing => lines.push(`There is a ${thing.name}.`))
  return lines
}

function renderCommands() {
  const commands = [
    // 'n',
    // 's',
    // 'e',
    // 'w',
    't',
    'a',
    // 'm',
    'l',
    'i',
    // 'c',
    // 'S',
    '?'
  ].join(', ')
  const lines = [
    `Available commands: ${commands}`
  ]
  return lines.join('\n')
}

function render(state) {
  const target = helpers.getTarget(state)
  const prompt = '> '
  let targetStatus = color.cyan('Unhurt')
  const targetHpPercent = target.hp / target.hpMax
  if (targetHpPercent >= 1) {
    targetStatus = color.cyan('Unhurt')
  } else if (targetHpPercent >= 0.66) {
    targetStatus = color.green('Wounded')
  } else if (targetHpPercent >= 0.33) {
    targetStatus = color.yellow('Badly Wounded')
  } else if (targetHpPercent > 0) {
    targetStatus = color.red('Mortally Wounded')
  } else if (targetHpPercent <= 0) {
    targetStatus = color.reversed(color.red('Dead'))
  }
  const targetLine = target.id 
    ? `Target: ${target.name} | ${targetStatus}` 
    : `Target: ${target.name}`

  const selfLine = 
    `Self: ${state.player.hp}/${state.player.hpMax} hp | ${state.player.ap}/${state.player.apMax} ap`

  const lines = [
    renderRoom(state).join('\n'),
    '',
    state.messages.join('\n'),
    '',
    `${selfLine} // ${targetLine}`,
    '',
    renderCommands(),
    prompt
  ]
  return lines.join('\n')
}

module.exports = render