module.exports = function commands(game) {
  return {
    map: {
      // context switchers
      c: {
        longForm: '(c)haracter sheet',
        help: '',
        handler: game.handleContextCharacterSheet.bind(game)
      },
      i: {
        longForm: '(i)nventory',
        help: "Show the player's inventory.",
        handler: game.handleContextInventory.bind(game)
      },
      M: {
        longForm: '(M)essage history',
        help: '',
        handler: game.handleContextMessageHistory.bind(game)
      },

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
      m: {
        longForm: '(m)ap',
        help: '',
        handler: game.handleContextMap.bind(game)
      },
      c: {
        longForm: '(c)haracter sheet',
        help: '',
        handler: game.handleContextCharacterSheet.bind(game)
      },
      i: {
        longForm: '(i)nventory',
        help: '',
        handler: game.handleContextInventory.bind(game)
      },
      M: {
        longForm: '(M)essage history',
        help: '',
        handler: game.handleContextMessageHistory.bind(game)
      },

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
      m: {
        longForm: '(m)ap',
        help: '',
        handler: game.handleContextMap.bind(game)
      },
      c: {
        longForm: '(c)haracter sheet',
        help: '',
        handler: game.handleContextCharacterSheet.bind(game)
      },
      i: {
        longForm: '(i)nventory',
        help: '',
        handler: game.handleContextInventory.bind(game)
      },
      M: {
        longForm: '(M)essage history',
        help: '',
        handler: game.handleContextMessageHistory.bind(game)
      },
    },
    messageHistory: {
      // context switchers
      m: {
        longForm: '(m)ap',
        help: '',
        handler: game.handleContextMap.bind(game)
      },
      c: {
        longForm: '(c)haracter sheet',
        help: '',
        handler: game.handleContextCharacterSheet.bind(game)
      },
      i: {
        longForm: '(i)nventory',
        help: '',
        handler: game.handleContextInventory.bind(game)
      },
      M: {
        longForm: '(M)essage history',
        help: '',
        handler: game.handleContextMessageHistory.bind(game)
      },
    },
  }
}