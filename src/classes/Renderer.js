const _ = require('lodash')

const color = require('../color')
const storage = require('../storage')

module.exports = class Renderer {
  constructor() {}

  _renderRoomDesc(game) {
    const lines = []
    const room = game.getCurrentRoom()
    lines.push(room.desc)

    game.getNearbyEntitiesWithout('player').forEach((entity, i) => {
      if (!entity.stored) {
        const article = 'aeiou'.includes(entity.name[0].toLowerCase()) ? 'an' : 'a'
        if (entity.type === 'creature') {
          if (entity.hp > 0) {
            lines.push(`  ${i}. There is ${article} ${entity.name} ${entity.id}. ${entity.hp} hp`)
          } 
          else if (entity.hp <= 0) {
            lines.push(`  ${i}. There is ${article} ${entity.name} ${entity.id} ${entity.remainsName}.`)
          }
        }
        else {
          lines.push(`  ${i}. There is ${article} ${entity.name} ${entity.id}.`)
        }
      }
    })
    return lines.join('\r\n')
  }

  _renderCommands(game) {
    const exits = game.getCurrentRoom().exits.map(exit => {
      if (exit === 'n') {
        return color.whiteBg(color.black('n')) + 'orth'
      }
      else if (exit === 's') {
        return color.whiteBg(color.black('s')) + 'outh'
      }
      else if (exit === 'e') {
        return color.whiteBg(color.black('e')) + 'ast'
      }
      else if (exit === 'w') {
        return color.whiteBg(color.black('w')) + 'est'
      }
    })
    const commands = []
    _.forOwn(game.commands[game.state.uiContext], (command, key) => {
      commands.push(command.longForm.replace(`(${key})`, color.whiteBg(color.black(key))))
    })
    commands.push(color.whiteBg(color.black('?')))
    const lines = [
      `\r\nCOMMANDS: ${game.state.uiContext === 'map' ? exits.concat(commands).join(', ') : commands.join(', ')}`
    ]
    return lines.join('\r\n')
  }

  _renderMap(game) {
    const wall = color.whiteBg(' ')
    const lines = []
    const player = game.getPlayer()
    lines.push(`DEPTH: ${game.state.depth}                                         \r\n`)
    lines.push(wall + _.repeat(wall, game.state.map.sizeX + 1) + '\r\n')
    for (var y=0; y<game.state.map.sizeY; y++) {
      lines.push(wall)
      for (var x=0; x<game.state.map.sizeX; x++) {
        const cell = game.getCell(x, y)
        var icon
        if (cell.type) {
          icon = ' '
          if (cell.x == player.x && cell.y == player.y) {
            icon = color.cyanBg('@')
          }
          else if (cell.structures.includes('exit')) {
            icon = color.greenBg('X')
          }
          else {
            icon = cell.room.icon
          }
        } else {
          icon = wall
        }
        lines.push(icon)
      }
      lines.push(wall + '\r\n')
    }
    lines.push(wall + _.repeat(wall, game.state.map.sizeX + 1) + '\r\n')
    return lines.join('')
  }

  _renderContextMap(game) {
    const mapLines = this._renderMap(game)
    const lines = []

    lines.push('')
    lines.push(this._renderRoomDesc(game))
    lines.push('')
    if (game.state.messages.length) {
      lines.push(game.state.messages.join('\r\n'))
      lines.push('')
    }
    lines.push(this._renderTargetLine(game))
    lines.push(`${this._renderSelfLine(game)}`)
    return mapLines + lines.join('\r\n')
  }

  _renderContextInventory(game) {
    const lines = []
    const player = game.getPlayer()
    lines.push('INVENTORY')
    lines.push('')
    lines.push(`WIELDING: ${player.wielding ? player.wielding.name : 'Nothing'}`)
    lines.push(`WEARING: ${player.wearing ? player.wearing.name : 'Nothing'}`)
    lines.push(`CARRYING:`)
    player.inventory.forEach((item, i) => {
      lines.push(`  ${i}. ${item.name} ${item.id}`)
    })
    lines.push('')
    if (game.state.messages.length) {
      lines.push(game.state.messages.join('\r\n'))
      lines.push('')
    }
    lines.push(this._renderSelfLine(game))
    return lines.join('\r\n')
  }

  _renderContextCharacterSheet(game) {
    const lines = []
    const player = game.getPlayer()

    const getModStr = function(name) {
      return game.getAttributeMod(player, name) >= 0 
        ? '+' + game.getAttributeMod(player, name) 
        : game.getAttributeMod(player, name) 
    }

    lines.push('CHARACTER SHEET')
    lines.push('')
    lines.push(`LVL: ${player.level} | NANITE COST: ${player.naniteCost}`)
    lines.push('')
    lines.push(`0. INT: ${player.int} | ${getModStr('int')}`)
    lines.push(`1. WIS: ${player.wis} | ${getModStr('wis')}`)
    lines.push(`2. CHA: ${player.cha} | ${getModStr('cha')}`)
    lines.push(`3. STR: ${player.str} | ${getModStr('str')}`)
    lines.push(`4. DEX: ${player.dex} | ${getModStr('dex')}`)
    lines.push(`5. CON: ${player.con} | ${getModStr('con')}`)
    lines.push('')
    lines.push(`AC: ${game.getAc(player)}`)

    lines.push('')
    if (game.state.messages.length) {
      lines.push(game.state.messages.join('\r\n'))
      lines.push('')
    }
    lines.push(this._renderSelfLine(game))
    return lines.join('\r\n')
  }

  _renderContextMessageHistory(game) {
    const lines = []
    lines.push('MESSAGE HISTORY')
    lines.push('')
    lines.push(game.state.messageHistory.join('\r\n'))
    return lines.join('\r\n')
  }

  _renderContextSystem(game) {
    const saveList = JSON.parse(localStorage.getItem('saveList'))
    const lines = []
    lines.push('SYSTEM MENU')
    lines.push('')
    lines.push('SAVES')
    saveList.forEach((save, i) => {
      if (save) {
        lines.push(`  ${i}. ${save.name}`)
      } else {
        lines.push(`  ${i}. empty`)
      }
    })
    return lines.join('\r\n')
  }

  _renderSelfLine(game) {
    const player = game.getPlayer()
    return `SELF: ${player.hp}/${player.hpMax} HP | ${player.ap}/${player.apMax} AP | ${player.nanites} NANITES`
  }

  _renderTargetLine(game) {
    const target = game.getTargetOf('player')
    var targetLine = 'TARGET: None'
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
        targetStatus = color.redBg( color.black(' Dead ') )
      }
      targetLine = target.id 
        ? `Target: ${target.name} | ${targetStatus}` 
        : `Target: ${target.name}`
    }
    return targetLine
  }

  render(game) {
    const lines = []
    const prompt = '> '
  
    if (game.state.uiContext === 'map') {
      lines.push(this._renderContextMap(game))
    } 
    else if (game.state.uiContext === 'inventory') {
      lines.push(this._renderContextInventory(game))
    }
    else if (game.state.uiContext === 'characterSheet') {
      lines.push(this._renderContextCharacterSheet(game))
    }
    else if (game.state.uiContext === 'messageHistory') {
      lines.push(this._renderContextMessageHistory(game))
    }
    else if (game.state.uiContext === 'system') {
      lines.push(this._renderContextSystem(game))
    }
    
    lines.push(this._renderCommands(game))

    lines.push(prompt)

    return lines.join('\r\n')
  }
} 