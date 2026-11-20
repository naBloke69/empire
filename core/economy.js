import { BALANCE } from '../config/balance.js';

export function getActiveCommander(state) {
  return BALANCE.commanders.find((c) => c.id === state.activeCommanderId) || BALANCE.commanders[0];
}

export function getActiveCastellan(state) {
  return BALANCE.castellans.find((c) => c.id === state.activeCastellanId) || BALANCE.castellans[0];
}

export function getGearBonuses(state) {
  let flankAtk = 0;
  let centerAtk = 0;
  let wallDef = 0;
  let lootBonus = 0;
  let researchProd = 0;

  for (const eqId of state.equippedIds || []) {
    const item = BALANCE.equipmentPool.find((x) => x.id === eqId);
    if (!item) continue;
    flankAtk += item.flankAtk || 0;
    centerAtk += item.centerAtk || 0;
    wallDef += item.wallDef || 0;
    lootBonus += item.lootBonus || 0;
  }

  for (const pId of state.activeAlliancePerks || []) {
    const perk = BALANCE.alliancePerks.find((x) => x.id === pId);
    if (!perk) continue;
    flankAtk += perk.atkBonus || 0;
    centerAtk += perk.atkBonus || 0;
  }

  for (const rId of state.completedResearchIds || []) {
    const res = BALANCE.researchTree.find((x) => x.id === rId);
    if (!res) continue;
    flankAtk += res.atkBonus || 0;
    centerAtk += res.atkBonus || 0;
    wallDef += res.wallBonus || 0;
    researchProd += res.prodBonus || 0;
  }

  return { flankAtk, centerAtk, wallDef, lootBonus, researchProd };
}

export function getBuildingCost(type, nextLevel) {
  const cfg = BALANCE.buildings[type];
  const mult = Math.pow(cfg.costScale, Math.max(0, nextLevel - 1));
  const out = {};
  for (const [res, val] of Object.entries(cfg.baseCost)) {
    out[res] = Math.round(val * mult);
  }
  return out;
}

export function getBuildingTimeSec(type, nextLevel, state = null) {
  const cfg = BALANCE.buildings[type];
  const mult = Math.pow(cfg.costScale * 0.85, Math.max(0, nextLevel - 1));
  const quickMult = state?.quickMode ? BALANCE.quickModeMultiplier : 1;
  return Math.max(2, Math.round((cfg.baseTimeSec * mult) / quickMult));
}

export function getMaxAttackWaves(state) {
  const keep = state.slots.find((s) => s.type === 'keep');
  const lvl = keep ? keep.level : 1;
  return Math.min(4, 1 + Math.floor(lvl / 2));
}

export function getEconomyStats(state) {
  const castellan = getActiveCastellan(state);
  const gear = getGearBonuses(state);
  const firePenalty = Math.max(0.45, 1 - (state.castleFireDamage || 0) * 0.08);

  let publicOrder = 100 + (castellan.orderFlat || 0) - (state.castleFireDamage || 0) * 8;
  let foodPerMin = 16;
  let woodPerMin = 15;
  let stonePerMin = 13;
  let goldPerMin = 15;
  let foodCap = 950;
  let storageCap = 1250;
  let trainSpeedBonus = 0;
  let wallDefenseBonus = 0;

  for (const slot of state.slots) {
    const cfg = BALANCE.buildings[slot.type];
    if (!cfg || slot.level <= 0) continue;
    if (cfg.orderBonus) publicOrder += cfg.orderBonus * slot.level;
    if (cfg.foodPerMin) foodPerMin += cfg.foodPerMin * slot.level;
    if (cfg.woodPerMin) woodPerMin += cfg.woodPerMin * slot.level;
    if (cfg.stonePerMin) stonePerMin += cfg.stonePerMin * slot.level;
    if (cfg.foodCapBonus) foodCap += cfg.foodCapBonus * slot.level;
    if (cfg.storageBonus) storageCap += cfg.storageBonus * slot.level;
    if (cfg.trainSpeedPerLvl) trainSpeedBonus += cfg.trainSpeedPerLvl * slot.level;
    if (cfg.defenseBonusPerLvl) wallDefenseBonus += cfg.defenseBonusPerLvl * slot.level;
  }

  for (const decId of state.ownedDecorIds || []) {
    const dec = BALANCE.decorItems.find((d) => d.id === decId);
    if (dec) publicOrder += dec.orderBonus || 0;
  }

  let allianceProdBonus = 0;
  for (const pId of state.activeAlliancePerks || []) {
    const perk = BALANCE.alliancePerks.find((x) => x.id === pId);
    if (perk) allianceProdBonus += perk.prodBonus || 0;
  }

  const outpostBonus = 1 + (state.capturedOutposts?.length || 0) * 0.12;
  const orderMult = 1 + Math.max(0, publicOrder - 100) / 300;
  const prodMult =
    orderMult *
    (castellan.prodMult || 1) *
    outpostBonus *
    (1 + allianceProdBonus + (gear.researchProd || 0)) *
    firePenalty;

  woodPerMin *= prodMult;
  stonePerMin *= prodMult;
  goldPerMin *= prodMult;
  foodPerMin *= prodMult;

  let upkeepPerMin = 0;
  const allTroops = { ...state.troops };
  for (const m of state.marches) {
    for (const [uType, cnt] of Object.entries(m.troops || {})) {
      allTroops[uType] = (allTroops[uType] || 0) + cnt;
    }
    for (const wave of m.waves || []) {
      for (const sec of ['left', 'center', 'right']) {
        for (const [uType, cnt] of Object.entries(wave.flanks?.[sec] || {})) {
          allTroops[uType] = (allTroops[uType] || 0) + cnt;
        }
      }
    }
  }

  for (const [uType, cnt] of Object.entries(allTroops)) {
    const uCfg = BALANCE.units[uType];
    if (uCfg) upkeepPerMin += (uCfg.upkeepFoodPerMin || 0) * cnt;
  }

  return {
    publicOrder: Math.round(publicOrder),
    orderEfficiencyPct: Math.round(orderMult * 100),
    ratesPerMin: {
      wood: woodPerMin,
      stone: stonePerMin,
      food: foodPerMin - upkeepPerMin,
      gold: goldPerMin
    },
    caps: {
      wood: storageCap,
      stone: storageCap,
      food: foodCap,
      gold: storageCap * 2
    },
    trainSpeedBonus: trainSpeedBonus + (orderMult - 1) * 0.5,
    wallDefenseBonus: wallDefenseBonus * (castellan.wallDefMult || 1) + gear.wallDef
  };
}

export function stepEconomy(state, dtSec) {
  if (dtSec <= 0) return;
  const stats = getEconomyStats(state);
  const mins = dtSec / 60;

  for (const res of ['wood', 'stone', 'gold']) {
    const cap = stats.caps[res];
    state.resources[res] = Math.max(0, Math.min(cap, (state.resources[res] || 0) + stats.ratesPerMin[res] * mins));
  }

  const nextFood = (state.resources.food || 0) + stats.ratesPerMin.food * mins;
  state.resources.food = Math.max(0, Math.min(stats.caps.food, nextFood));
}

export function canAfford(resources, cost) {
  for (const [res, amount] of Object.entries(cost)) {
    if ((resources[res] || 0) < amount) return false;
  }
  return true;
}
