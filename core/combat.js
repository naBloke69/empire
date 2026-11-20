import { BALANCE } from '../config/balance.js';

export function emptyWave() {
  return {
    flanks: {
      left: { maceman: 0, crossbow: 0, knight: 0 },
      center: { maceman: 0, crossbow: 0, knight: 0 },
      right: { maceman: 0, crossbow: 0, knight: 0 }
    },
    tools: {
      ladder: 0,
      ram: 0,
      mantlet: 0
    }
  };
}

function calcAttackerSectorPower(units, sec, tools, cmd, gear) {
  let raw = 0;
  for (const [uType, cnt] of Object.entries(units || {})) {
    const cfg = BALANCE.units[uType];
    if (!cfg || !cnt) continue;
    raw += cfg.attack * cnt;
  }
  const baseMult = sec === 'center' ? (cmd.centerAtkMult || 1) : (cmd.flankAtkMult || 1);
  const gearBonus = sec === 'center' ? (gear.centerAtk || 0) : (gear.flankAtk || 0);
  return raw * (baseMult + gearBonus);
}

function calcDefenderSectorPower(units, sec, target, tools) {
  let meleeDef = 0;
  let rangedDef = 0;
  for (const [uType, cnt] of Object.entries(units || {})) {
    const cfg = BALANCE.units[uType];
    if (!cfg || !cnt) continue;
    if (uType === 'crossbow') rangedDef += cfg.defense * cnt;
    else meleeDef += cfg.defense * cnt;
  }

  const shieldReduce = Math.min(0.65, (tools.mantlet || 0) * BALANCE.tools.mantlet.rangedReduce);
  rangedDef *= 1 - shieldReduce;

  let wallBonus = target.wallBonus || 0;
  let gateBonus = sec === 'center' ? (target.gateBonus || 0) : 0;

  wallBonus = Math.max(0, wallBonus - (tools.ladder || 0) * BALANCE.tools.ladder.wallNegate);
  gateBonus = Math.max(0, gateBonus - (tools.ram || 0) * BALANCE.tools.ram.gateNegate);

  return (meleeDef + rangedDef) * (1 + wallBonus + gateBonus);
}

export function resolveSiegeBattle(waves, target, options = {}) {
  const mutate = Boolean(options.mutate);
  const cmd = options.commander || BALANCE.commanders[0];
  const gear = options.gear || { flankAtk: 0, centerAtk: 0 };
  const defClone = JSON.parse(JSON.stringify(target.defense));
  const wavesClone = JSON.parse(JSON.stringify(waves));

  const sectors = ['left', 'center', 'right'];
  const sectorWon = { left: false, center: false, right: false };
  const notes = [];

  for (let wIdx = 0; wIdx < wavesClone.length; wIdx++) {
    const wave = wavesClone[wIdx];
    const tools = wave.tools || {};

    for (const sec of sectors) {
      const aUnits = wave.flanks[sec];
      const dUnits = defClone[sec];

      const aPow = calcAttackerSectorPower(aUnits, sec, tools, cmd, gear);
      const dPow = calcDefenderSectorPower(dUnits, sec, target, tools);

      if (aPow <= 0) continue;

      const aLossRatio = dPow <= 0 ? 0 : Math.min(1, dPow / Math.max(1, aPow * 1.35));
      const dLossRatio = aPow <= 0 ? 0 : Math.min(1, aPow / Math.max(1, dPow * 1.25));

      for (const uType of Object.keys(BALANCE.units)) {
        const lostA = Math.min(aUnits[uType] || 0, Math.round((aUnits[uType] || 0) * aLossRatio));
        const lostD = Math.min(dUnits[uType] || 0, Math.round((dUnits[uType] || 0) * dLossRatio));
        if (mutate) {
          aUnits[uType] = Math.max(0, (aUnits[uType] || 0) - lostA);
        }
        dUnits[uType] = Math.max(0, (dUnits[uType] || 0) - lostD);
      }

      const remainingDefCount = Object.values(dUnits).reduce((s, v) => s + v, 0);
      if (aPow >= dPow || remainingDefCount === 0) {
        sectorWon[sec] = true;
      }
    }
  }

  for (const sec of sectors) {
    if (!sectorWon[sec]) {
      const name = sec === 'left' ? 'Левый фланг' : sec === 'right' ? 'Правый фланг' : 'Центр (ворота)';
      notes.push(`${name}: защита устояла — добавьте орудий или волну`);
    }
  }

  const wonCount = sectors.filter((s) => sectorWon[s]).length;
  const victory = wonCount >= 2;

  const survivors = { maceman: 0, crossbow: 0, knight: 0 };
  for (const wave of wavesClone) {
    for (const sec of sectors) {
      for (const uType of Object.keys(survivors)) {
        survivors[uType] += wave.flanks[sec][uType] || 0;
      }
    }
  }

  return {
    victory,
    wonCount,
    sectorWon,
    notes,
    survivors
  };
}
