module.exports = {
  player: function() {
    return {
      id: 'player',
      target: '',
      attributes: {
        str: 14,
        dex: 16,
        con: 14,
        int: 12,
        wis: 10,
        cha: 12
      },
      hp: 16,
      hpMax: 16,
      ac: 14,
      ap: 5,
      apMax: 6,
      apRegen: 5,
      equipped: {
        wielding: {name: 'Sword of Slaying', diceCount: 1, diceSize: 6, hitBonus: 1, damBonus: 1, hitAttribute: 'dex', damAttribute: 'str', critRange: 19, critMult: 2, apCost: 4}
      },
      inventory: [
        'Key'
      ]
    }
  },

  goblin: function() {
    return {
      name: 'Goblin',
      id:'asdf',
      attributes: {
        str: 10,
        dex: 14,
        con: 12,
        int: 6,
        wis: 8,
        cha: 8
      },
      hp: 10,
      hpMax: 10,
      ac: 12,
      ap: 5,
      apMax: 5,
      apRegen: 5,
      equipped: {
        wielding: {name: 'Dagger', diceCount: 1, diceSize: 4, hitBonus: 0, damBonus: 0, hitAttribute: 'dex', damAttribute: 'str', critRange: 20, critMult: 2, apCost: 2}
      },
      inventory: ['Gold Coin']
    }
  }
}