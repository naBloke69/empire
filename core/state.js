import { BALANCE } from '../config/balance.js';

const STORAGE_KEY = 'e4k_royal_mobile_v6';

export function createInitialState() {
  const now = Date.now();
  return {
    lastTickAt: now,
    accountName: 'Лорд Stezzy',
    allianceName: 'Железный легион',
    allianceTreasury: 350,
    activeAlliancePerks: ['al_war'],
    completedResearchIds: [],
    claimedQuestIds: [],
    victoriesCount: 0,
    castleFireDamage: 0,
    activeRealm: 'great_empire',
    selectedSlotId: 'slot_keep',
    selectedTargetId: BALANCE.mapTargets[0].id,
    activeCommanderId: BALANCE.commanders[0].id,
    activeCastellanId: BALANCE.castellans[0].id,
    equippedIds: ['eq_blade'],
    ownedDecorIds: ['dec_garden'],
    quickMode: false,
    soundEnabled: true,
    taxCooldownUntil: 0,
    scoutedIds: [],
    capturedOutposts: [],
    resources: { ...BALANCE.startingResources },
    troops: { ...BALANCE.startingTroops },
    tools: { ...BALANCE.startingTools },
    slots: [
      { id: 'slot_keep', type: 'keep', level: 1, gx: 0, gy: 0 },
      { id: 'slot_wall', type: 'wall', level: 1, gx: 0, gy: 1 },
      { id: 'slot_barracks', type: 'barracks', level: 1, gx: -1, gy: 0 },
      { id: 'slot_workshop', type: 'workshop', level: 1, gx: 1, gy: 0 },
      { id: 'slot_tavern', type: 'tavern', level: 1, gx: 0, gy: -1 },
      { id: 'slot_farm', type: 'farm', level: 1, gx: -1, gy: 1 },
      { id: 'slot_sawmill', type: 'sawmill', level: 1, gx: -1, gy: -1 },
      { id: 'slot_quarry', type: 'quarry', level: 1, gx: 1, gy: -1 }
    ],
    buildQueue: null,
    trainQueue: null,
    marches: [],
    logs: [
      { id: now, text: 'Королевство готово! Замок, карта, волны штурма, герои, исследования, задания и альянс активны.' }
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
  if (state.logs.length > 45) state.logs.length = 45;
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
    const base = createInitialState();
    return {
      ...base,
      ...parsed,
      resources: { ...base.resources, ...(parsed.resources || {}) },
      troops: { ...base.troops, ...(parsed.troops || {}) },
      tools: { ...base.tools, ...(parsed.tools || {}) },
      slots: Array.isArray(parsed.slots) && parsed.slots.length ? parsed.slots : base.slots
    };
  } catch {
    return createInitialState();
  }
}

export function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  return createInitialState();
}
