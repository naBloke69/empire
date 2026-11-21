export const BALANCE = {
  tickIntervalMs: 1000,
  maxOfflineSeconds: 86400,
  quickModeMultiplier: 2,

  realms: {
    great_empire: {
      id: 'great_empire',
      name: 'Великая империя',
      perkDesc: '+12 порядок и сбалансированная добыча',
      orderBonus: 12,
      prodMult: 1.06,
      atkMult: 1.0,
      wallMult: 1.0,
      groundTop: '#4e833d',
      groundBottom: '#284d1f',
      accent: '#78e08f'
    },
    burning_sands: {
      id: 'burning_sands',
      name: 'Пылающие пески',
      perkDesc: '+12% добыча и +10% скорость марша',
      orderBonus: 0,
      prodMult: 1.12,
      atkMult: 1.05,
      wallMult: 0.96,
      marchMult: 1.1,
      groundTop: '#d2a55a',
      groundBottom: '#936929',
      accent: '#f6b93b'
    },
    everwinter: {
      id: 'everwinter',
      name: 'Вечный холод',
      perkDesc: '+20% прочность стен, выше расход еды',
      orderBonus: 5,
      prodMult: 1.0,
      atkMult: 1.0,
      wallMult: 1.2,
      foodUpkeepMult: 1.15,
      groundTop: '#9fc3d8',
      groundBottom: '#5e8196',
      accent: '#82ccdd'
    },
    fire_peaks: {
      id: 'fire_peaks',
      name: 'Огненные вершины',
      perkDesc: '+18% сила атаки и трофеи гор',
      orderBonus: 0,
      prodMult: 1.08,
      atkMult: 1.18,
      wallMult: 1.05,
      groundTop: '#6e352e',
      groundBottom: '#391814',
      accent: '#ff6b6b'
    }
  },

  startingResources: {
    wood: 900,
    stone: 800,
    food: 1000,
    gold: 750,
    rubies: 240
  },

  startingTroops: {
    maceman: 40,
    crossbow: 30,
    knight: 18
  },

  startingTools: {
    ladder: 18,
    ram: 12,
    mantlet: 12
  },

  buildings: {
    keep: {
      name: 'Цитадель',
      desc: 'Главная крепость замка: открывает волны штурма, расширяет склад и повышает порядок.',
      baseCost: { wood: 140, stone: 130, gold: 90 },
      baseTimeSec: 10,
      costScale: 1.45,
      storageBonus: 450,
      orderBonus: 15
    },
    wall: {
      name: 'Стены и башни',
      desc: 'Крепостные стены, бойницы и ров — усиливают защиту при обороне замка.',
      baseCost: { wood: 90, stone: 140, gold: 60 },
      baseTimeSec: 9,
      costScale: 1.4,
      defenseBonusPerLvl: 0.18,
      orderBonus: 10
    },
    barracks: {
      name: 'Казармы',
      desc: 'Тренировочный двор и казармы для найма воинов и ускорения вербовки.',
      baseCost: { wood: 100, stone: 85, gold: 70 },
      baseTimeSec: 8,
      costScale: 1.38,
      trainSpeedPerLvl: 0.12
    },
    workshop: {
      name: 'Осадный двор',
      desc: 'Изготовление лестниц, таранов и щитов для штурма укреплений.',
      baseCost: { wood: 110, stone: 75, gold: 65 },
      baseTimeSec: 8,
      costScale: 1.38
    },
    farm: {
      name: 'Ферма и амбар',
      desc: 'Производство провианта и расширение запасов еды для армии.',
      baseCost: { wood: 75, stone: 45, gold: 25 },
      baseTimeSec: 7,
      costScale: 1.34,
      foodPerMin: 36,
      foodCapBonus: 300
    },
    sawmill: {
      name: 'Лесопилка',
      desc: 'Заготовка древесины для строительства и осадных орудий.',
      baseCost: { wood: 55, stone: 55, gold: 25 },
      baseTimeSec: 7,
      costScale: 1.34,
      woodPerMin: 30
    },
    quarry: {
      name: 'Каменоломня',
      desc: 'Добыча камня для башен, цитадели и укреплений.',
      baseCost: { wood: 75, stone: 45, gold: 30 },
      baseTimeSec: 8,
      costScale: 1.34,
      stonePerMin: 28
    },
    tavern: {
      name: 'Таверна и гильдия',
      desc: 'Поднимает боевой дух и общественный порядок в замке.',
      baseCost: { wood: 80, stone: 70, gold: 95 },
      baseTimeSec: 8,
      costScale: 1.36,
      orderBonus: 45
    }
  },

  decorItems: [
    { id: 'dec_garden', name: 'Королевский сад', orderBonus: 35, cost: { wood: 90, stone: 60, gold: 70 } },
    { id: 'dec_statue', name: 'Статуя Завоевателя', orderBonus: 65, cost: { stone: 140, gold: 120, rubies: 15 } },
    { id: 'dec_fest', name: 'Турнирная площадь', orderBonus: 110, cost: { wood: 180, stone: 180, gold: 200, rubies: 35 } }
  ],

  shopItems: [
    { id: 'sh_pack_res', name: 'Королевский обоз ресурсов', desc: '+400 дерева, +400 камня, +400 еды, +300 монет', costRubies: 25, grant: { wood: 400, stone: 400, food: 400, gold: 300 } },
    { id: 'sh_pack_knights', name: 'Дружина тяжёлых рыцарей', desc: '+15 Рыцарей и +15 Арбалетчиков в гарнизон', costRubies: 35, grantTroops: { knight: 15, crossbow: 15 } },
    { id: 'sh_pack_siege', name: 'Осадный арсенал', desc: '+10 Лестниц, +10 Таранов, +10 Щитов', costRubies: 30, grantTools: { ladder: 10, ram: 10, mantlet: 10 } },
    { id: 'sh_pack_bp', name: 'Ускорение Боевого пропуска (+250 BP)', desc: 'Мгновенно добавляет +250 опыта БП', costRubies: 40, grantBp: 250 }
  ],

  dailyRewards: [
    { day: 1, title: 'День 1: Приветственный дар', reward: { gold: 150, wood: 180, rubies: 15, bp: 60 } },
    { day: 2, title: 'День 2: Камень и сталь', reward: { stone: 220, gold: 180, rubies: 20, bp: 80 } },
    { day: 3, title: 'День 3: Знамя похода', reward: { food: 260, gold: 220, rubies: 25, bp: 100 } },
    { day: 4, title: 'День 4: Казна лорда', reward: { gold: 350, wood: 250, stone: 250, rubies: 40, bp: 140 } }
  ],

  eventsList: [
    { id: 'ev_nomads', name: 'Нашествие кочевников', desc: 'Усиленные трофеи за штурм лагерей и башен (+25% очков войны)', bonusText: 'Активно сейчас' },
    { id: 'ev_fair', name: 'Королевская ярмарка', desc: 'Выгодный обмен и повышенный приток монет при сборе налогов', bonusText: 'Активно сейчас' },
    { id: 'ev_clan_war', name: 'Битва гильдий за пограничье', desc: 'Собирайте ралли, захватывайте аванпосты и поднимайте альянс в топе', bonusText: 'Сезон I' }
  ],

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
      role: 'Тяжёлая атака',
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
      desc: 'Срезает защиту стен на флангах',
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
      desc: 'Снижает урон стрелков',
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
      perk: '+24% прорыв центра и бонус орудий',
      marchSpeedMult: 1.0,
      flankAtkMult: 1.06,
      centerAtkMult: 1.24
    }
  ],

  castellans: [
    {
      id: 'cast_roland',
      name: 'Кастелян Роланд',
      perk: '+25% защита стен и ворот замка',
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

  equipmentPool: [
    { id: 'eq_blade', slot: 'weapon', name: 'Клинок Стража', bonusText: '+12% атака флангов', flankAtk: 0.12, centerAtk: 0, wallDef: 0, lootBonus: 0 },
    { id: 'eq_aegis', slot: 'armor', name: 'Кираса Бастиона', bonusText: '+15% защита стен', flankAtk: 0, centerAtk: 0, wallDef: 0.15, lootBonus: 0 },
    { id: 'eq_gem_ruby', slot: 'gem', name: 'Рубиновый самоцвет', bonusText: '+10% атака центра и +15% добычи', flankAtk: 0, centerAtk: 0.10, wallDef: 0, lootBonus: 0.15 }
  ],

  researchTree: [
    { id: 'res_siege', name: 'Инженерия осад', desc: '+12% прорыв центра и флангов', costGold: 140, atkBonus: 0.12, prodBonus: 0, wallBonus: 0 },
    { id: 'res_agri', name: 'Трёхполье и лесоводство', desc: '+15% добыча ресурсов', costGold: 130, atkBonus: 0, prodBonus: 0.15, wallBonus: 0 },
    { id: 'res_fort', name: 'Каменная кладка', desc: '+15% защита стен замка', costGold: 135, atkBonus: 0, prodBonus: 0, wallBonus: 0.15 }
  ],

  storyChapter: {
    title: 'Глава I: Знамя над Четырьмя Королевствами',
    summary: 'Укрепи цитадель, набери дружину, разбей башню разбойников и подними авторитет лорда.'
  },

  quests: [
    { id: 'q_build', chapter: 'Глава I', title: 'Застройка королевства', desc: 'Суммарный уровень построек замка: цель 14', target: 14, rewardGold: 180, rewardRubies: 20, rewardBp: 80 },
    { id: 'q_raid', chapter: 'Глава I', title: 'Гроза разбойников', desc: 'Победоносных походов на карте: цель 2', target: 2, rewardGold: 220, rewardRubies: 30, rewardBp: 100 },
    { id: 'q_order', chapter: 'Глава I', title: 'Процветание подданных', desc: 'Общественный порядок замка: цель 210', target: 210, rewardGold: 200, rewardRubies: 25, rewardBp: 90 },
    { id: 'q_spy', chapter: 'Глава II', title: 'Глаза и уши короны', desc: 'Разведанных целей на карте: цель 2', target: 2, rewardGold: 190, rewardRubies: 25, rewardBp: 90 },
    { id: 'q_outpost', chapter: 'Глава II', title: 'Властелин пограничья', desc: 'Захваченных аванпостов: цель 1', target: 1, rewardGold: 300, rewardRubies: 40, rewardBp: 120 },
    { id: 'q_keep4', chapter: 'Глава III', title: 'Сердце империи', desc: 'Уровень Цитадели: цель 4', target: 4, rewardGold: 350, rewardRubies: 50, rewardBp: 150 }
  ],

  alliancePerks: [
    { id: 'al_war', name: 'Военный пакт', desc: '+10% к силе штурма всех флангов', costGold: 120, atkBonus: 0.10, prodBonus: 0 },
    { id: 'al_trade', name: 'Караванный союз', desc: '+15% к добыче ресурсов всей империи', costGold: 120, atkBonus: 0, prodBonus: 0.15 }
  ],

  rivals: [
    {
      id: 'rival_korsar',
      name: 'Лорд Корсар',
      alliance: 'Багровая корона',
      power: 420,
      online: true,
      shielded: false,
      loot: { wood: 220, stone: 190, food: 180, gold: 240, rubies: 6 },
      defense: {
        left: { maceman: 12, crossbow: 8, knight: 2 },
        center: { maceman: 16, crossbow: 12, knight: 4 },
        right: { maceman: 12, crossbow: 8, knight: 2 }
      }
    },
    {
      id: 'rival_valeria',
      name: 'Леди Валерия',
      alliance: 'Железный легион',
      power: 560,
      online: true,
      shielded: false,
      loot: { wood: 290, stone: 270, food: 250, gold: 310, rubies: 9 },
      defense: {
        left: { maceman: 16, crossbow: 14, knight: 4 },
        center: { maceman: 22, crossbow: 16, knight: 6 },
        right: { maceman: 16, crossbow: 14, knight: 4 }
      }
    },
    {
      id: 'rival_torin',
      name: 'Барон Торин',
      alliance: 'Хранители Севера',
      power: 740,
      online: false,
      shielded: true,
      loot: { wood: 380, stone: 360, food: 320, gold: 420, rubies: 14 },
      defense: {
        left: { maceman: 22, crossbow: 18, knight: 6 },
        center: { maceman: 28, crossbow: 22, knight: 9 },
        right: { maceman: 22, crossbow: 18, knight: 6 }
      }
    }
  ],

  marketOffers: [
    { id: 'mk_1', seller: 'Торговец Марк', give: 'wood', giveAmt: 220, want: 'gold', wantAmt: 130 },
    { id: 'mk_2', seller: 'Караванщик Рашид', give: 'stone', giveAmt: 200, want: 'gold', wantAmt: 145 },
    { id: 'mk_3', seller: 'Амбар Севера', give: 'food', giveAmt: 260, want: 'wood', wantAmt: 170 }
  ],

  mapTargets: [
    {
      id: 'rbc_green_1',
      kind: 'TOWER',
      name: 'Башня разбойников (Ур. 3)',
      realm: 'great_empire',
      x: 0.24,
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
      id: 'player_korsar_map',
      kind: 'PLAYER_CASTLE',
      name: 'Замок Лорда Корсара',
      realm: 'great_empire',
      x: 0.76,
      y: 0.28,
      distanceTiles: 3,
      wallBonus: 0.30,
      gateBonus: 0.35,
      loot: { wood: 220, stone: 190, food: 180, gold: 240, rubies: 6 },
      defense: {
        left: { maceman: 12, crossbow: 8, knight: 2 },
        center: { maceman: 16, crossbow: 12, knight: 4 },
        right: { maceman: 12, crossbow: 8, knight: 2 }
      }
    },
    {
      id: 'outpost_green_1',
      kind: 'OUTPOST',
      name: 'Свободный аванпост',
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
      x: 0.28,
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
      name: 'Крепость ледяных ярлов',
      realm: 'everwinter',
      x: 0.74,
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
      name: 'Цитадель Огненных вершин',
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
