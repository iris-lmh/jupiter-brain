module.exports = function commands(game) {
  const contextMap = {
    longForm: '(m)ap',
    help: 'Show the map.',
    handler: ()=>{game.switchUiContext('map')}
  }
  const contextInventory = {
    longForm: '(i)nventory',
    help: "Show the player's inventory.",
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
  const contextDebug = {
    longForm: '(D)ebug',
    help: 'Show an extended history of game messages.',
    handler: ()=>{game.switchUiContext('debug')}
  }
  const contextSystem = {
    longForm: '(S)ystem',
    help: '',
    handler: ()=>{game.switchUiContext('system')}
  }

  const commands = {
    system: {
      m: contextMap,
      c: contextCharacterSheet,
      i: contextInventory,
      M: contextMessageHistory,
      D: contextDebug,

      s: {
        longForm: '(s)ave game',
        help: '',
        handler: game.handleSave
      },
      // l: {
      //   longForm: '(l)oad game',
      //   help: '',
      //   handler: game.handleLoad
      // },
      N: {
        longForm: '(N)ew game',
        help: '',
        handler: game.handleNewGame
      }
    },
    debug: {
      m: contextMap,
      c: contextCharacterSheet,
      i: contextInventory,
      M: contextMessageHistory,

      N: {
        longForm: '(N)ew map',
        help: '',
        handler: game.handleNewMap
      },
      s: {
        longForm: '(s)pawn entity',
        help: '',
        handler: game.debugSpawnEntity
      },
      n: {
        longForm: '(n)dd nanites',
        help: '',
        handler: game.debugAddNanites
      }
    },
    map: {
      // context switchers
      c: contextCharacterSheet,
      i: contextInventory,
      M: contextMessageHistory,
      D: contextDebug,
      S: contextSystem,

      // other commands
      t: {
        longForm: '(t)arget',
        help: '',
        handler: game.handleTarget
      },
      a: {
        longForm: '(a)ttack',
        help: '',
        handler: game.handleAttack
      },
      l: {
        longForm: '(l)ook',
        help: '',
        handler: game.handleLook
      },
      g: {
        longForm: '(g)rab item',
        help: '',
        handler: game.handleGrabItem
      },
      u: {
        longForm: '(u)se',
        help: '',
        handler: game.handleUse
      }
    },
    inventory: {
      // context switchers
      m: contextMap,
      c: contextCharacterSheet,
      M: contextMessageHistory,
      D: contextDebug,

      // other commands
      d: {
        longForm: '(d)rop',
        help: '',
        handler: game.handleDropItem
      },
      q: {
        longForm: 'e(q)uip',
        help: '',
        handler: game.handleEquipItem
      },
      u: {
        longForm: '(u)se',
        help: '',
        handler: game.handleUse
      },
      l: {
        longForm: '(l)ook',
        help: '',
        handler: game.handleLook
      },
    },
    characterSheet: {
      // context switchers
      m: contextMap,
      i: contextInventory,
      M: contextMessageHistory,
      D: contextDebug,

      // other commands
      i: {
        longForm: '(i)ncrease attribute',
        help: '',
        handler: game.handleIncreaseAttribute
      }
    },
    messageHistory: {
      // context switchers
      m: contextMap,
      c: contextCharacterSheet,
      i: contextInventory,
      D: contextDebug,
    },
  }

  return commands
}