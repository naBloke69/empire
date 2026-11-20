export const BALANCE = {
  tickIntervalMs: 1000,
  maxOfflineSeconds: 86400,
  quickModeMultiplier: 2,
  fatiguePerMarch: 0.08,
  maxFatigue: 0.4,

  startingResources: {
    wood: 550,
    stone: 450,
    food: 650,
    gold: 350
  },

  startingReserve: {
    wood: 120,
    stone: 100,
    food: 180,
    gold: 80
  },

  startingTroops: {
    melee: 30,
    ranged: 24,
    siege: 6
  },

  specializations: {
    balanced: {
      name: 'Универсальный центр',
      prodMult: 1.1,
      defMult: 1.1,
      trainMult: 1.0
    },
    granary: {
      name: 'Житница королевства',
      prodMult: 1.0,
      foodMult: 1.3,
      defMult: 1.0,
      trainMult: 1.0
    },
    war_hub: {
      name: 'Военный форпост',
      prodMult: 1.0,
      defMult: 1.05,
      trainMult: 1.25,
      atkMult: 1.15
    }
  },

  buildPresets: {
    eco: {
      name: 'Пресет: Экономика',
      priority: ['farm', 'sawmill', 'quarry', 'keep', 'wall', 'barracks']
    },
    war: {
      name: 'Пресет: Армия и осада',
      priority: ['barracks', 'keep', 'wall', 'farm', 'sawmill', 'quarry']
    }
  },

  commanders: [
    {
      id: 'cmd_vanguard',
      name: 'Капитан Торн',
      perkName: 'Быстрый авангард',
      perkDesc: '+20% скорость марша, +15% урон по секторам',
      marchSpeedMult: 1.2,
      atkMult: 1.15,
      siegeMult: 1.1
    },
    {
      id: 'cmd_siege',
      name: 'Инженер Марта',
      perkName: 'Осадный расчёт',
      perkDesc: '+35% бонус осадных машин',
      marchSpeedMult: 1.0,
      atkMult: 1.08,
      siegeMult: 1.35
    }
  ],

  castellans: [
    {
      id: 'cast_ironwall',
      name: 'Кастелян Брам',
      perkName: 'Железный вал',
      perkDesc: '+25% к обороне стен и флангов',
      defMult: 1.25
    },
    {
      id: 'cast_steward',
      name: 'Управляющая Лира',
      perkName: 'Бережный амбар',
      perkDesc: '+20% к добыче ресурсов',
      defMult: 1.08,
      prodMult: 1.2
    }
  ],

  buildings: {
    keep: {
      name: 'Цитадель',
      baseCost: { wood: 120, stone: 100, gold: 80 },
      baseTimeSec: 10,
      costScale: 1.42,
      foodCapBonus: 220,
      storageBonus: 320
    },
    farm: {
      name: 'Ферма',
      baseCost: { wood: 70, stone: 40, gold: 20 },
      baseTimeSec: 7,
      costScale: 1.35,
      foodPerMin: 26,
      foodCapBonus: 200
    },
    sawmill: {
      name: 'Лесопилка',
      baseCost: { wood: 50, stone: 50, gold: 20 },
      baseTimeSec: 7,
      costScale: 1.35,
      woodPerMin: 22
    },
    quarry: {
      name: 'Каменоломня',
      baseCost: { wood: 70, stone: 40, gold: 25 },
      baseTimeSec: 8,
      costScale: 1.35,
      stonePerMin: 20
    },
    barracks: {
      name: 'Казармы',
      baseCost: { wood: 90, stone: 80, gold: 60 },
      baseTimeSec: 9,
      costScale: 1.38,
      trainSpeedBonusPerLvl: 0.12
    },
    wall: {
      name: 'Стены и ворота',
      baseCost: { wood: 80, stone: 120, gold: 50 },
      baseTimeSec: 9,
      costScale: 1.38,
      defenseBonusPerLvl: 0.15
    }
  },

  units: {
    melee: {
      name: 'Мечники',
      cost: { wood: 15, gold: 12, food: 10 },
      trainSec: 3,
      upkeepFoodPerMin: 0.55,
      attack: 15,
      defense: 17,
      marchSecPerTile: 3
    },
    ranged: {
      name: 'Лучники',
      cost: { wood: 22, gold: 14, food: 10 },
      trainSec: 4,
      upkeepFoodPerMin: 0.65,
      attack: 19,
      defense: 10,
      marchSecPerTile: 3.2
    },
    siege: {
      name: 'Осадные башни',
      cost: { wood: 35, stone: 25, gold: 20 },
      trainSec: 5,
      upkeepFoodPerMin: 0.9,
      attack: 25,
      defense: 13,
      siegeBonus: 1.65,
      marchSecPerTile: 4.2
    }
  },

  mapTargets: [
    {
      id: 'bandit_camp_1',
      kind: 'CAMP',
      name: 'Лагерь мародёров',
      realm: 'Зелёные просторы',
      distanceTiles: 2,
      loot: { wood: 150, stone: 100, food: 130, gold: 90 },
      defense: {
        left: { melee: 8, ranged: 4, siege: 0 },
        center: { melee: 12, ranged: 8, siege: 1 },
        right: { melee: 8, ranged: 4, siege: 0 }
      }
    },
    {
      id: 'village_green_1',
      kind: 'VILLAGE',
      name: 'Деревня плодородных полей',
      realm: 'Зелёные просторы',
      distanceTiles: 2,
      loot: { wood: 100, stone: 80, food: 220, gold: 70 },
      defense: {
        left: { melee: 6, ranged: 4, siege: 0 },
        center: { melee: 10, ranged: 6, siege: 0 },
        right: { melee: 6, ranged: 4, siege: 0 }
      }
    },
    {
      id: 'sand_outpost_2',
      kind: 'CAMP',
      name: 'Форт Пылающих песков',
      realm: 'Пылающие пески',
      distanceTiles: 4,
      loot: { wood: 230, stone: 250, food: 190, gold: 170 },
      defense: {
        left: { melee: 16, ranged: 12, siege: 2 },
        center: { melee: 22, ranged: 16, siege: 4 },
        right: { melee: 16, ranged: 12, siege: 2 }
      }
    },
    {
      id: 'frost_citadel_3',
      kind: 'CAMP',
      name: 'Бастион Вечного холода',
      realm: 'Вечный холод',
      distanceTiles: 6,
      loot: { wood: 360, stone: 390, food: 310, gold: 290 },
      defense: {
        left: { melee: 28, ranged: 22, siege: 5 },
        center: { melee: 36, ranged: 28, siege: 8 },
        right: { melee: 28, ranged: 22, siege: 5 }
      }
    },
    {
      id: 'event_caravan_1',
      kind: 'EVENT',
      name: 'Событие: Караван на перепутье',
      realm: 'Пылающие пески',
      distanceTiles: 3,
      loot: { wood: 180, stone: 140, food: 180, gold: 210 },
      choiceReward: { gold: 120, food: 120 },
      defense: {
        left: { melee: 12, ranged: 10, siege: 1 },
        center: { melee: 16, ranged: 12, siege: 2 },
        right: { melee: 12, ranged: 10, siege: 1 }
      }
    }
  ]
};
    
