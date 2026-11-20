import { BALANCE } from '../config/balance.js';

const STORAGE_KEY = 'four_realms_fixed_save_v1';

export function createInitialState() {
  const now = Date.now();
  return {
    lastTickAt: now,
    selectedSlotId: 'slot_1',
    selectedTargetId: BALANCE.mapTargets[0].id,
    specialization: 'balanced',
    activeCommanderId: BALANCE.commanders[0].id,
    activeCastellanId: BALANCE.castellans[0].id,
    quickMode: false,
    cleanView: false,
    soundEnabled: true,
    fatigue: 0,
    autoLogisticsEnabled: true,
    autoFoodThreshold: 400,
    alliancePlanTargetId: BALANCE.mapTargets[1].id,
    allianceTargetOffsetSec: 30,
    scoutedIds: [],
    resources: { ...BALANCE.startingResources },
    reserve: { ...BALANCE.startingReserve },
    troops: { ...BALANCE.startingTroops },
    slots: [
      { id: 'slot_1', type: 'keep', level: 1 },
      { id: 'slot_2', type: 'farm', level: 1 },
      { id: 'slot_3', type: 'sawmill', level: 1 },
      { id: 'slot_4', type: 'quarry', level: 1 },
      { id: 'slot_5', type: 'barracks', level: 1 },
      { id: 'slot_6', type: 'wall', level: 1 }
    ],
    buildQueue: null,
    trainQueue: null,
    marches: [],
    logs: [
      { id: now, text: 'Замок готов. Настраивай специализацию, разведуй цели и гоняй симулятор перед походом.' }
    ],
    lastReport: null
  };
}

export function pushLog(state, text) {
  const timeStr = new Date().toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  state.logs.unshift({
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    text: `[${timeStr}] ${text}`
  });
  if (state.logs.length > 50) {
    state.logs.length = 50;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Ошибка сохранения:', err);
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);
    return {
      ...createInitialState(),
      ...parsed,
      resources: { ...BALANCE.startingResources, ...(parsed.resources || {}) },
      reserve: { ...BALANCE.startingReserve, ...(parsed.reserve || {}) },
      troops: { ...BALANCE.startingTroops, ...(parsed.troops || {}) }
    };
  } catch {
    return createInitialState();
  }
}

export function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  return createInitialState();
}

