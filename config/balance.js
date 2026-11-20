export const BALANCE = {
  tickIntervalMs: 1000,
  maxOfflineSeconds: 86400,
  quickModeMultiplier: 2,

  realms: {
    great_empire: {
      id: 'great_empire',
      name: 'Великая империя',
      groundTop: '#3e6b34',
      groundBottom: '#2b4d24',
      accent: '#6ab04c'
    },
    burning_sands: {
      id: 'burning_sands',
      name: 'Пылающие пески',
      groundTop: '#c29b57',
      groundBottom: '#997438',
      accent: '#f0932b'
    },
    everwinter: {
      id: 'everwinter',
      name: 'Вечный холод',
      groundTop: '#9cb8c9',
      groundBottom: '#6f8ea1',
      accent: '#7ed6df'
    },
    fire_peaks: {
      id: 'fire_peaks',
      name: 'Огненные вершины',
      groundTop: '#59332e',
      groundBottom: '#361d1a',
      accent: '#eb4d4b'
    }
  },

  startingResources: {
    wood: 650,
    stone: 550,
    food: 750,
    gold: 480,
    rubies: 120
  },

  startingTroops: {
    maceman: 28,
    crossbow: 22,
    knight: 10
  },

  startingTools: {
    ladder: 12,
    ram: 6,
    mantlet: 8
  },

  buildings: {
    keep: {
      name: 'Цитадель',
      desc: 'Центр замка: открывает волны атаки и увеличивает склад.',
      baseCost: { wood: 140, stone: 130, gold: 90 },
      baseTimeSec: 10,
      costScale: 1.45,
      storageBonus: 450,
      orderBonus: 15
    },
    wall: {
      name: 'Стены и ров',
      desc: 'Защита флангов и ворот замка при обороне.',
      baseCost: { wood: 90, stone: 140, gold: 60 },
      baseTimeSec: 9,
      costScale: 1.4,
      defenseBonusPerLvl: 0.18,
      orderBonus: 10
    },
    barracks: {
      name: 'Казармы',
      desc: 'Найм булавщиков, арбалетчиков и рыцарей.',
      baseCost: { wood: 100, stone: 85, gold: 70 },
      baseTimeSec: 8,
      costScale: 1.38,
      trainSpeedPerLvl: 0.12
    },
    workshop: {
      name: 'Осадная мастерская',
      desc: 'Производство лестниц, таранов и щитов для штурма стен.',
      baseCost: { wood: 110, stone: 75, gold: 65 },
      baseTimeSec: 8,
      costScale: 1.38
    },
    farm: {
      name: 'Ферма и мельница',
      desc: 'Производство еды для содержания армии.',
      baseCost: { wood: 75, stone: 45, gold: 25 },
      baseTimeSec: 7,
      costScale: 1.34,
      foodPerMin: 32,
      foodCapBonus: 260
    },
    sawmill: {
      name: 'Лесопилка',
      desc: 'Добыча древесины для построек и орудий.',
      baseCost: { wood: 55, stone: 55, gold: 25 },
      baseTimeSec: 7,
      costScale: 1.34,
      woodPerMin: 26
    },
    quarry: {
      name: 'Каменоломня',
      desc: 'Добыча камня для укреплений и цитадели.',
      baseCost: { wood: 75, stone: 45, gold: 30 },
      baseTimeSec: 8,
      costScale: 1.34,
      stonePerMin: 24
    },
    tavern: {
      name: 'Таверна и декор',
      desc: 'Повышает общественный порядок и открывает шпионов.',
      baseCost: { wood: 80, stone: 70, gold: 95 },
      baseTimeSec: 8,
      costScale: 1.36,
      orderBonus: 45
    }
  },

  units: {
    maceman: {
      name: 'Булавщик',
      role: 'Ближний бой',
      cost: { gold: 14, food: 8 },
      trainSec: 3,
      upkeepFoodPerMin: 0.45,
      attack: 16,
      defense: 14
    },
    crossbow: {
      name: 'Арбалетчик',
      role: 'Дальний бой',
      cost: { gold: 18, food: 9 },
      trainSec: 4,
      upkeepFoodPerMin: 0.55,
      attack: 21,
      defense: 11
    },
    knight: {
      name: 'Рыцарь',
      role: 'Элита штурма',
      cost: { gold: 34, food: 15 },
      trainSec: 6,
      upkeepFoodPerMin: 0.95,
      attack: 34,
      defense: 28
    }
  },

  tools: {
    ladder: {
      name: 'Штурм. лестница',
      desc: 'Срезает бонус защиты стен на флангах',
      cost: { wood: 18, stone: 6 },
      wallNegate: 0.08
    },
    ram: {
      name: 'Таран',
      desc: 'Пробивает ворота по центру',
      cost: { wood: 24, stone: 12 },
      gateNegate: 0.12
    },
    mantlet: {
      name: 'Осадный щит',
      desc: 'Снижает урон вражеских стрелков',
      cost: { wood: 20, gold: 10 },
      rangedReduce: 0.07
    }
  },

  commanders: [
    {
      id: 'cmd_aldric',
      name: 'Маршал Альдрик',
      perk: '+22% скорость марша, +15% атака флангов',
      marchSpeedMult: 1.22,
      flankAtkMult: 1.15,
      centerAtkMult: 1.05
    },
    {
      id: 'cmd_helga',
      name: 'Осадница Хельга',
      perk: '+30% эффективность орудий и прорыв центра',
      marchSpeedMult: 1.0,
      flankAtkMult: 1.06,
      centerAtkMult: 1.24
    }
  ],

  castellans: [
    {
      id: 'cast_roland',
      name: 'Кастелян Роланд',
      perk: '+25% защита стен и ворот',
      wallDefMult: 1.25,
      prodMult: 1.0
    },
    {
      id: 'cast_mira',
      name: 'Наместница Мира',
      perk: '+20% добыча ресурсов и +25 порядок',
      wallDefMult: 1.05,
      prodMult: 1.2,
      orderFlat: 25
    }
  ],

  mapTargets: [
    {
      id: 'rbc_green_1',
      kind: 'TOWER',
      name: 'Башня разбойников (Ур. 3)',
      realm: 'great_empire',
      x: 0.25,
      y: 0.30,
      distanceTiles: 2,
      wallBonus: 0.25,
      gateBonus: 0.30,
      loot: { wood: 180, stone: 140, food: 150, gold: 130, rubies: 4 },
      defense: {
        left: { maceman: 8, crossbow: 5, knight: 0 },
        center: { maceman: 12, crossbow: 8, knight: 2 },
        right: { maceman: 8, crossbow: 5, knight: 0 }
      }
    },
    {
      id: 'village_green_1',
      kind: 'VILLAGE',
      name: 'Деревня плодородия',
      realm: 'great_empire',
      x: 0.76,
      y: 0.26,
      distanceTiles: 3,
      wallBonus: 0.15,
      gateBonus: 0.15,
      loot: { wood: 120, stone: 90, food: 280, gold: 95, rubies: 2 },
      defense: {
        left: { maceman: 6, crossbow: 4, knight: 0 },
        center: { maceman: 9, crossbow: 6, knight: 1 },
        right: { maceman: 6, crossbow: 4, knight: 0 }
      }
    },
    {
      id: 'outpost_green_1',
      kind: 'OUTPOST',
      name: 'Каменный аванпост',
      realm: 'great_empire',
      x: 0.78,
      y: 0.74,
      distanceTiles: 4,
      wallBonus: 0.35,
      gateBonus: 0.40,
      loot: { wood: 240, stone: 310, food: 170, gold: 185, rubies: 6 },
      defense: {
        left: { maceman: 14, crossbow: 10, knight: 2 },
        center: { maceman: 18, crossbow: 14, knight: 4 },
        right: { maceman: 14, crossbow: 10, knight: 2 }
      }
    },
    {
      id: 'nomad_camp_sands',
      kind: 'EVENT',
      name: 'Лагерь кочевников',
      realm: 'burning_sands',
      x: 0.30,
      y: 0.72,
      distanceTiles: 4,
      wallBonus: 0.40,
      gateBonus: 0.45,
      loot: { wood: 260, stone: 250, food: 230, gold: 260, rubies: 8 },
      defense: {
        left: { maceman: 16, crossbow: 14, knight: 3 },
        center: { maceman: 22, crossbow: 16, knight: 5 },
        right: { maceman: 16, crossbow: 14, knight: 3 }
      }
    },
    {
      id: 'frost_fortress',
      kind: 'TOWER',
      name: 'Башня варваров Севера',
      realm: 'everwinter',
      x: 0.72,
      y: 0.34,
      distanceTiles: 5,
      wallBonus: 0.50,
      gateBonus: 0.55,
      loot: { wood: 340, stone: 320, food: 290, gold: 310, rubies: 10 },
      defense: {
        left: { maceman: 22, crossbow: 18, knight: 5 },
        center: { maceman: 28, crossbow: 22, knight: 7 },
        right: { maceman: 22, crossbow: 18, knight: 5 }
      }
    },
    {
      id: 'dragon_cult_peaks',
      kind: 'TOWER',
      name: 'Крепость культа дракона',
      realm: 'fire_peaks',
      x: 0.28,
      y: 0.28,
      distanceTiles: 6,
      wallBonus: 0.65,
      gateBonus: 0.70,
      loot: { wood: 450, stone: 460, food: 410, gold: 440, rubies: 15 },
      defense: {
        left: { maceman: 30, crossbow: 24, knight: 8 },
        center: { maceman: 38, crossbow: 30, knight: 12 },
        right: { maceman: 30, crossbow: 24, knight: 8 }
      }
    }
  ]
};
