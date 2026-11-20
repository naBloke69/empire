import { BALANCE } from '../config/balance.js';

export function emptyFlanks() {
  return {
    left: { melee: 0, ranged: 0, siege: 0 },
    center: { melee: 0, ranged: 0, siege: 0 },
    right: { melee: 0, ranged: 0, siege: 0 }
  };
}

function calcSectorPower(sectorUnits, isDefender, options = {}) {
  const wallBonus = options.wallBonus || 0;
  const atkMult = options.atkMult || 1;
  const siegeMult = options.siegeMult || 1;
  const fatiguePenalty = Math.max(0.5, 1 - (options.fatigue || 0));

  let atk = 0;
  let def = 0;
  let siege = 0;

  for (const [uType, cnt] of Object.entries(sectorUnits || {})) {
    const cfg = BALANCE.units[uType];
    if (!cfg || !cnt) continue;
    atk += cfg.attack * cnt;
    def += cfg.defense * cnt;
    if (cfg.siegeBonus) {
      siege += cfg.attack * cnt * (cfg.siegeBonus - 1) * siegeMult;
    }
  }

  if (isDefender) {
    def *= 1 + wallBonus;
  } else {
    atk = (atk + siege) * atkMult * fatiguePenalty;
  }

  return { atk, def };
}

export function resolveFlankBattle(attackFlanks, defenseFlanks, options = {}) {
  const mutate = Boolean(options.mutate);
  const atkClone = JSON.parse(JSON.stringify(attackFlanks));
  const defClone = JSON.parse(JSON.stringify(defenseFlanks));

  const sectors = ['left', 'center', 'right'];
  let atkWonSectors = 0;
  let defWonSectors = 0;
  const sectorDetails = [];

  for (const sec of sectors) {
    const aUnits = atkClone[sec];
    const dUnits = defClone[sec];

    const aPow = calcSectorPower(aUnits, false, options);
    const dPow = calcSectorPower(dUnits, true, options);

    const aTotal = aPow.atk + aPow.def * 0.25;
    const dTotal = dPow.def + dPow.atk * 0.25;

    const aLossRatio = dTotal <= 0 ? 0 : Math.min(1, dTotal / Math.max(1, aTotal * 1.4));
    const dLossRatio = aTotal <= 0 ? 0 : Math.min(1, aTotal / Math.max(1, dTotal * 1.4));

    const aLost = {};
    const dLost = {};

    for (const uType of Object.keys(BALANCE.units)) {
      const lostA = Math.min(aUnits[uType] || 0, Math.round((aUnits[uType] || 0) * aLossRatio));
      const lostD = Math.min(dUnits[uType] || 0, Math.round((dUnits[uType] || 0) * dLossRatio));
      aLost[uType] = lostA;
      dLost[uType] = lostD;

      if (mutate) {
        aUnits[uType] = Math.max(0, (aUnits[uType] || 0) - lostA);
        dUnits[uType] = Math.max(0, (dUnits[uType] || 0) - lostD);
      }
    }

    const won = aTotal >= dTotal;
    if (won) atkWonSectors += 1;
    else defWonSectors += 1;

    sectorDetails.push({
      sector: sec,
      won,
      atkPower: Math.round(aTotal),
      defPower: Math.round(dTotal),
      aLost,
      dLost
    });
  }

  const victory = atkWonSectors >= 2;
  const bottlenecks = [];

  for (const s of sectorDetails) {
    if (!s.won) {
      const label = s.sector === 'left' ? 'Левый фланг' : s.sector === 'right' ? 'Правый фланг' : 'Центр';
      bottlenecks.push(`${label}: враг сильнее (${s.defPower} против ${s.atkPower})`);
    }
  }
  if ((options.fatigue || 0) >= 0.16) {
    bottlenecks.push(`Усталость армии снижает удар (${Math.round(options.fatigue * 100)}%)`);
  }
  if (!victory && bottlenecks.length === 0) {
    bottlenecks.push('Не хватило общего перевеса сил по секторам');
  }

  return {
    victory,
    atkWonSectors,
    defWonSectors,
    sectorDetails,
    bottlenecks,
    remainingAttackers: atkClone,
    remainingDefenders: defClone
  };
      }
