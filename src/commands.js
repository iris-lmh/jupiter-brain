module.exports = function commands(game) {
  const contextMap = {
    longForm: '(m)ap',
    help: 'Show the map.',
    handler: ()=>{game.switchUiContext('map')}
  }
  const contextInventory = {
    longForm: '(i)nventory',
    help: "Show the player's inventory.",
    // handler: game.handleContextInventory.bind(game),
    handler: ()=>{game.switchUiContext('inventory')}
  }
  const contextCharacterSheet = {
    longForm: '(c)haracter sheet',
    help: "Show ther player's status.",
    handler: ()=>{game.switchUiContext('characterSheet')}
  }
  const contextMessageHistory = {
    longForm: '(M)essage history',
    help: 'Show an extended history of game messages.',
    handler: ()=>{game.switchUiContext('messageHistory')}
  }
  return {
    map: {
      // context switchers
      c: contextCharacterSheet,
      i: contextInventory,
      M: contextMessageHistory,

      // other commands
      t: {
        longForm: '(t)arget',
        help: '',
        handler: game.handleTarget.bind(game)
      },
      a: {
        longForm: '(a)ttack',
        help: '',
        handler: game.handleAttack.bind(game)
      },
      l: {
        longForm: '(l)ook',
        help: '',
        handler: game.handleLook.bind(game)
      },
      g: {
        longForm: '(g)rab item',
        help: '',
        handler: game.handleGrabItem.bind(game)
      },
    },
    inventory: {
      // context switchers
      m: contextMap,
      c: contextCharacterSheet,
      M: contextMessageHistory,

      // other commands
      d: {
        longForm: '(d)rop',
        help: '',
        handler: game.handleDropItem.bind(game)
      },
      q: {
        longForm: 'e(q)uip',
        help: '',
        handler: game.handleEquipItem.bind(game)
      }
    },
    characterSheet: {
      // context switchers
      m: contextMap,
      i: contextInventory,
      M: contextMessageHistory,
    },
    messageHistory: {
      // context switchers
      m: contextMap,
      c: contextCharacterSheet,
      i: contextInventory,
    },
  }
}