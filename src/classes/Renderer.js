const _ = require('lodash')

const color = require('../color')

module.exports = class Renderer {
  constructor() {

  }

  _renderRoom(game) {
    const lines = []
    const room = game.getCurrentRoom()
    lines.push(room.desc)
    const creatures = game.getNearbyCreaturesWithout('player')
    const items = game.getNearbyItems()

    // if (creatures.length) {
      lines.push("\nCREATURES")
    // }
    creatures.forEach((creature, i) => {
      // const creature = game.getCreature(creatureId)
      const article = 'aeiou'.includes(creature.name[0].toLowerCase()) ? 'an' : 'a'
      if (creature.hp > 0) {
        lines.push(`${i} - There is ${article} ${creature.name}. ${creature.hp} hp`)
      } 
      else if (creature.hp <= 0) {
        lines.push(`${i} - There is ${article} ${creature.name} ${creature.remainsName}.`)
      }
    })

    // if (items.length) {
      lines.push("\nITEMS")
    // }
    items.forEach((item, i) => {
      if (!item.stored) {
        const article = 'aeiou'.includes(item.name[0].toLowerCase()) ? 'an' : 'a'
        lines.push(`${i} - There is ${article} ${item.name}.`)
      }
    })
    return lines
  }

  _renderCommands(game) {
    const exits = game.getCurrentRoom().exits
    const commands = [
      't',
      'a',
      // 'm',
      'l',
      'i',
      // 'c',
      // 'S',
      '?'
    ]
    const lines = [
      `Available commands: ${exits.concat(commands).join(', ')}`
    ]
    return lines.join('\n')
  }

  _renderMap(game) {
    const wall = color.white('█')
    const lines = []
    const player = game.getPlayer()
    console.log(`size: ${game.state.map.sizeX}x${game.state.map.sizeY}`)
    console.log(`attempts: ${game.state.map.attempts}`)
    console.log(`${game.state.map.getRoomCount()} rooms\n`)
    // var result = ''
    // lines.push(' ' + _.repeat('-', game.state.map.sizeX) + '\n')
    lines.push(wall + _.repeat(wall, game.state.map.sizeX + 1) + '\n')
    for (var y=0; y<game.state.map.sizeY; y++) {
      // lines.push('|')
      lines.push(wall)
      for (var x=0; x<game.state.map.sizeX; x++) {
        const cell = game.state.map.getCell(x, y)
        var icon
        if (cell.type) {
          icon = ' '
          const type = cell.type
          // TODO define these characters to the respective yamls
          if (cell.x == player.x && cell.y == player.y) {
            icon = color.cyan('@')
          } else if (type == 'chamber') {
            icon = '?'
          } else if (type == 'corridor') {
            icon = '•'
          } else {
          }
        } else {
          icon = wall
        }
        lines.push(icon)
      }
      // lines.push('|\n')
      lines.push(wall + '\n')
    }
    // lines.push(' ' + _.repeat('-', game.state.map.sizeX) + '\n')
    lines.push(wall + _.repeat(wall, game.state.map.sizeX + 1) + '\n')
    console.log(lines.join(''))
    return lines.join('')
  }

  render(game) {
    const prompt = '> '
  
    this._renderMap(game)
    
    const target = game.getTargetOf('player')
    var targetLine = 'No target'
    if (target) {
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
      targetLine = target.id 
        ? `Target: ${target.name} | ${targetStatus}` 
        : `Target: ${target.name}`
    }
  
    const selfLine = 
      `Self: ${game.getPlayer().hp}/${game.getPlayer().hpMax} hp | ${game.getPlayer().ap}/${game.getPlayer().apMax} ap`
  
    const lines = [
      this._renderRoom(game).join('\n'),
      '',
      game.state.messages.join('\n'),
      '',
      `${selfLine} // ${targetLine}`,
      '',
      this._renderCommands(game),
      prompt
    ]
    return lines.join('\n')
  }
} 