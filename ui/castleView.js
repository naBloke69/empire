import { BALANCE } from '../config/balance.js';
import {
  canAfford,
  getBuildingCost,
  getBuildingTimeSec,
  getEconomyStats,
  packReserve,
  unpackReserve
} from '../core/economy.js';
import { pushLog } from '../core/state.js';
import { sound } from '../audio/sound.js';

export function renderCastleView(container, state, onMutate) {
  const now = Date.now();
  const econ = getEconomyStats(state);
  const slot = state.slots.find((s) => s.id === state.selectedSlotId) || state.slots[0];
  const cfg = BALANCE.buildings[slot.type];
  const nextLevel = slot.level + 1;
  const cost = getBuildingCost(slot.type, nextLevel);
  const timeSec = getBuildingTimeSec(slot.type, nextLevel, state);
  const affordable = canAfford(state.resources, cost);
  const busyBuild = Boolean(state.buildQueue);

  const buildStatusText = state.buildQueue
    ? `Строится: ${BALANCE.buildings[state.buildQueue.type]?.name} (ур. ${state.buildQueue.targetLevel}) — ${Math.max(0, Math.ceil((state.buildQueue.endsAt - now) / 1000))}с`
    : 'Слот стройки свободен';

  const trainStatusText = state.trainQueue
    ? `Вербовка: ${state.trainQueue.count}x ${BALANCE.units[state.trainQueue.unitType]?.name} — ${Math.max(0, Math.ceil((state.trainQueue.totalEndsAt - now) / 1000))}с`
    : 'Казармы свободны';

  container.innerHTML = `
    <div class="card">
      <h3>Специализация и пресеты замка</h3>
      <p class="muted">Защита стен: +${Math.round(econ.wallDefenseBonus * 100)}% • Скорость вербовки: +${Math.round(econ.trainSpeedBonus * 100)}%</p>
      <div class="row" style="margin-bottom: 8px;">
        ${Object.entries(BALANCE.specializations)
          .map(
            ([key, s]) => `
          <button class="mini-btn" data-spec="${key}" type="button">
            ${state.specialization === key ? '★ ' : ''}${s.name}
          </button>
        `
          )
          .join('')}
      </div>
      <div class="row">
        <button id="btn-preset-eco" class="action-btn secondary" type="button">Пресет: Экономика</button>
        <button id="btn-preset-war" class="action-btn secondary" type="button">Пресет: Армия и осада</button>
      </div>
    </div>

    <div class="card">
      <h3>Сетка построек</h3>
      <div class="grid-slots">
        ${state.slots
          .map((s) => {
            const b = BALANCE.buildings[s.type];
            return `
              <button class="slot-btn ${s.id === slot.id ? 'active-slot' : ''}" data-slot="${s.id}" type="button">
                <strong>${b.name}</strong>
                <span class="muted">Уровень ${s.level}</span>
              </button>
            `;
          })
          .join('')}
      </div>
    </div>

    <div class="card">
      <h3>${cfg.name} (Ур. ${slot.level} → ${nextLevel})</h3>
      <p class="muted">Цена: Д:${cost.wood || 0} К:${cost.stone || 0} М:${cost.gold || 0} • Время: ${timeSec}с</p>
      <p class="muted">${buildStatusText}</p>
      <button id="btn-upgrade" class="action-btn" ${!affordable || busyBuild ? 'disabled' : ''} type="button">
        Улучшить до ур. ${nextLevel}
      </button>
    </div>

    <div class="card">
      <h3>Казармы — Вербовка</h3>
      <p class="muted">${trainStatusText}</p>
      <div class="row">
        ${Object.entries(BALANCE.units)
          .map(([uKey, uCfg]) => {
            const count = 5;
            const unitCost = {
              wood: (uCfg.cost.wood || 0) * count,
              stone: (uCfg.cost.stone || 0) * count,
              food: (uCfg.cost.food || 0) * count,
              gold: (uCfg.cost.gold || 0) * count
            };
            const canTrain = !state.trainQueue && canAfford(state.resources, unitCost);
            const speedDiv = 1 + Math.max(0, econ.trainSpeedBonus);
            const quickDiv = state.quickMode ? BALANCE.quickModeMultiplier : 1;
            const sec = Math.max(2, Math.round((uCfg.trainSec * count) / speedDiv / quickDiv));
            return `
              <button class="action-btn secondary" data-train="${uKey}" ${canTrain ? '' : 'disabled'} type="button">
                +5 ${uCfg.name} (${sec}с)
              </button>
            `;
          })
          .join('')}
      </div>
    </div>

    <div class="card">
      <h3>Резерв и автологистика</h3>
      <p class="muted">Защищённые ресурсы не сгорают при минусовой еде или набеге.</p>
      <div class="row">
        <button id="btn-pack-food" class="action-btn secondary" type="button">В резерв (+100 еды)</button>
        <button id="btn-unpack-food" class="action-btn secondary" type="button">На склад (+100 еды)</button>
        <button id="btn-toggle-logistics" class="mini-btn" type="button">
          Авто-резерв: ${state.autoLogisticsEnabled ? 'Вкл' : 'Выкл'}
        </button>
      </div>
    </div>
  `;

  container.querySelectorAll('[data-spec]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.specialization = btn.dataset.spec;
      pushLog(state, `Выбрана специализация: ${BALANCE.specializations[state.specialization].name}`);
      sound.click();
      onMutate();
    });
  });

  const applyPreset = (presetKey) => {
    const preset = BALANCE.buildPresets[presetKey];
    if (!preset) return;
    const candidate = preset.priority
      .map((type) => state.slots.find((s) => s.type === type))
      .find((s) => s && canAfford(state.resources, getBuildingCost(s.type, s.level + 1)));

    if (!candidate) {
      pushLog(state, `По "${preset.name}" пока не хватает ресурсов ни на одно улучшение.`);
      sound.alert();
      onMutate();
      return;
    }

    state.selectedSlotId = candidate.id;
    if (!state.buildQueue) {
      const nextLvl = candidate.level + 1;
      const c = getBuildingCost(candidate.type, nextLvl);
      const t = getBuildingTimeSec(candidate.type, nextLvl, state);
      for (const [k, v] of Object.entries(c)) state.resources[k] -= v;
      state.buildQueue = {
        slotId: candidate.id,
        type: candidate.type,
        targetLevel: nextLvl,
        endsAt: Date.now() + t * 1000
      };
      pushLog(state, `${preset.name}: начат апгрейд "${BALANCE.buildings[candidate.type].name}" до ур. ${nextLvl}`);
      sound.click();
    }
    onMutate();
  };

  container.querySelector('#btn-preset-eco')?.addEventListener('click', () => applyPreset('eco'));
  container.querySelector('#btn-preset-war')?.addEventListener('click', () => applyPreset('war'));

  container.querySelectorAll('[data-slot]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.selectedSlotId = btn.dataset.slot;
      sound.click();
      onMutate();
    });
  });

  container.querySelector('#btn-upgrade')?.addEventListener('click', () => {
    if (state.buildQueue || !canAfford(state.resources, cost)) return;
    for (const [k, v] of Object.entries(cost)) state.resources[k] -= v;
    state.buildQueue = {
      slotId: slot.id,
      type: slot.type,
      targetLevel: nextLevel,
      endsAt: Date.now() + timeSec * 1000
    };
    pushLog(state, `Начато улучшение "${cfg.name}" до ур. ${nextLevel}`);
    sound.click();
    onMutate();
  });

  container.querySelectorAll('[data-train]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const uKey = btn.dataset.train;
      const uCfg = BALANCE.units[uKey];
      const count = 5;
      const unitCost = {
        wood: (uCfg.cost.wood || 0) * count,
        stone: (uCfg.cost.stone || 0) * count,
        food: (uCfg.cost.food || 0) * count,
        gold: (uCfg.cost.gold || 0) * count
      };
      if (state.trainQueue || !canAfford(state.resources, unitCost)) return;
      for (const [k, v] of Object.entries(unitCost)) state.resources[k] -= v;
      const speedDiv = 1 + Math.max(0, econ.trainSpeedBonus);
      const quickDiv = state.quickMode ? BALANCE.quickModeMultiplier : 1;
      const totalSec = Math.max(2, Math.round((uCfg.trainSec * count) / speedDiv / quickDiv));
      state.trainQueue = {
        unitType: uKey,
        count,
        eachSec: uCfg.trainSec,
        totalEndsAt: Date.now() + totalSec * 1000
      };
      pushLog(state, `Запущена вербовка: ${count}x ${uCfg.name}`);
      sound.click();
      onMutate();
    });
  });

  container.querySelector('#btn-pack-food')?.addEventListener('click', () => {
    if (packReserve(state, 'food', 100) > 0) {
      pushLog(state, 'Отложено в резерв: 100 еды');
      sound.click();
      onMutate();
    }
  });

  container.querySelector('#btn-unpack-food')?.addEventListener('click', () => {
    if (unpackReserve(state, 'food', 100) > 0) {
      pushLog(state, 'Переведено на склад: 100 еды');
      sound.click();
      onMutate();
    }
  });

  container.querySelector('#btn-toggle-logistics')?.addEventListener('click', () => {
    state.autoLogisticsEnabled = !state.autoLogisticsEnabled;
    pushLog(state, `Авто-резерв еды: ${state.autoLogisticsEnabled ? 'включён' : 'выключен'}`);
    sound.click();
    onMutate();
  });
}

