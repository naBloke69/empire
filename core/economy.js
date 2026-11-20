import { BALANCE } from '../config/balance.js';

export function getActiveCommander(state) {
  return BALANCE.commanders.find((c) => c.id === state.activeCommanderId) || BALANCE.commanders[0];
}

export function getActiveCastellan(state) {
  return BALANCE.castellans.find((c) => c.id === state.activeCastellanId) || BALANCE.castellans[0];
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

export function getEconomyStats(state) {
  const spec = BALANCE.specializations[state.specialization] || BALANCE.specializations.balanced;
  const castellan = getActiveCastellan(state);

  let foodPerMin = 12;
  let woodPerMin = 12;
  let stonePerMin = 10;
  let goldPerMin = 10;
  let foodCap = 700;
  let storageCap = 1000;
  let trainSpeedBonus = 0;
  let wallDefenseBonus = 0;

  for (const slot of state.slots) {
    const cfg = BALANCE.buildings[slot.type];
    if (!cfg || slot.level <= 0) continue;

    if (cfg.foodPerMin) foodPerMin += cfg.foodPerMin * slot.level;
    if (cfg.woodPerMin) woodPerMin += cfg.woodPerMin * slot.level;
    if (cfg.stonePerMin) stonePerMin += cfg.stonePerMin * slot.level;
    if (cfg.foodCapBonus) foodCap += cfg.foodCapBonus * slot.level;
    if (cfg.storageBonus) storageCap += cfg.storageBonus * slot.level;
    if (cfg.trainSpeedBonusPerLvl) trainSpeedBonus += cfg.trainSpeedBonusPerLvl * slot.level;
    if (cfg.defenseBonusPerLvl) wallDefenseBonus += cfg.defenseBonusPerLvl * slot.level;
  }

  const prodMult = (spec.prodMult || 1) * (castellan.prodMult || 1);
  const foodMult = (spec.foodMult || 1) * (castellan.prodMult || 1);

  woodPerMin *= prodMult;
  stonePerMin *= prodMult;
  goldPerMin *= prodMult;
  foodPerMin *= foodMult;
  foodCap = Math.round(foodCap * (spec.foodMult || 1));

  let upkeepPerMin = 0;
  const activeTroops = { ...state.troops };
  for (const m of state.marches) {
    for (const [uType, cnt] of Object.entries(m.troops || {})) {
      activeTroops[uType] = (activeTroops[uType] || 0) + cnt;
    }
    if (m.flanks) {
      for (const sec of ['left', 'center', 'right']) {
        for (const [uType, cnt] of Object.entries(m.flanks[sec] || {})) {
          activeTroops[uType] = (activeTroops[uType] || 0) + cnt;
        }
      }
    }
  }

  for (const [uType, cnt] of Object.entries(activeTroops)) {
    const uCfg = BALANCE.units[uType];
    if (uCfg) {
      upkeepPerMin += (uCfg.upkeepFoodPerMin || 0) * cnt;
    }
  }

  const netFoodPerMin = foodPerMin - upkeepPerMin;

  return {
    ratesPerMin: {
      wood: woodPerMin,
      stone: stonePerMin,
      food: netFoodPerMin,
      gold: goldPerMin
    },
    caps: {
      wood: storageCap,
      stone: storageCap,
      food: foodCap,
      gold: storageCap
    },
    trainSpeedBonus: trainSpeedBonus + ((spec.trainMult || 1) - 1),
    wallDefenseBonus: wallDefenseBonus * (castellan.defMult || 1) * (spec.defMult || 1)
  };
}

export function stepEconomy(state, dtSec) {
  if (dtSec <= 0) return;
  const stats = getEconomyStats(state);
  const mins = dtSec / 60;

  for (const res of ['wood', 'stone', 'gold']) {
    const cap = stats.caps[res];
    const nextVal = state.resources[res] + stats.ratesPerMin[res] * mins;
    state.resources[res] = Math.max(0, Math.min(cap, nextVal));
  }

  const foodDelta = stats.ratesPerMin.food * mins;
  let nextFood = state.resources.food + foodDelta;
  if (nextFood < 0) {
    const deficit = Math.abs(nextFood);
    const fromReserve = Math.min(state.reserve.food, deficit);
    state.reserve.food -= fromReserve;
    nextFood = Math.max(0, nextFood + fromReserve);
  }
  state.resources.food = Math.min(stats.caps.food, nextFood);

  state.fatigue = Math.max(0, (state.fatigue || 0) - dtSec * 0.004);

  if (state.autoLogisticsEnabled && state.resources.food > state.autoFoodThreshold) {
    const excess = Math.min(25, Math.floor((state.resources.food - state.autoFoodThreshold) * 0.25));
    if (excess > 0) {
      state.resources.food -= excess;
      state.reserve.food = (state.reserve.food || 0) + excess;
    }
  }
}

export function canAfford(resources, cost) {
  for (const [res, amount] of Object.entries(cost)) {
    if ((resources[res] || 0) < amount) return false;
  }
  return true;
}

export function packReserve(state, res, amount) {
  const avail = Math.floor(state.resources[res] || 0);
  const take = Math.max(0, Math.min(avail, Math.floor(amount)));
  if (take <= 0) return 0;
  state.resources[res] -= take;
  state.reserve[res] = (state.reserve[res] || 0) + take;
  return take;
}

export function unpackReserve(state, res, amount) {
  const avail = Math.floor(state.reserve[res] || 0);
  const take = Math.max(0, Math.min(avail, Math.floor(amount)));
  if (take <= 0) return 0;
  state.reserve[res] -= take;
  state.resources[res] = Math.min(getEconomyStats(state).caps[res], (state.resources[res] || 0) + take);
  return take;
}

