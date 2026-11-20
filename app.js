import { BALANCE } from './config/balance.js';
import { loadState, resetState, saveState, pushLog } from './core/state.js';
import { advanceSimulation } from './core/timeEngine.js';
import { renderHud, renderLogs } from './ui/hud.js';
import { renderCastleView } from './ui/castleView.js';
import { renderWorldMapView } from './ui/worldMapView.js';
import { renderBattleView } from './ui/battleModal.js';
import { renderCommandView } from './ui/commandView.js';
import { sound } from './audio/sound.js';

let state = loadState();
sound.enabled = state.soundEnabled !== false;
advanceSimulation(state, Date.now(), false);
saveState(state);

let activeTab = 'castle';

const hudEl = document.getElementById('hud');
const viewEl = document.getElementById('view-container');
const logListEl = document.getElementById('event-log');
const toggleLogBtn = document.getElementById('btn-toggle-log');
const realmSelectEl = document.getElementById('realm-select');
const taxBtn = document.getElementById('btn-tax');
const rubyBoostBtn = document.getElementById('btn-ruby-boost');

function renderSystemView(container) {
  const serialized = JSON.stringify(state);
  container.innerHTML = `
    <div class="card">
      <h3>Настройки и сохранение</h3>
      <div class="row" style="margin-bottom:8px;">
        <button id="btn-quick-mode" class="action-btn secondary" type="button">
          Быстрый темп (x2): ${state.quickMode ? 'Вкл' : 'Выкл'}
        </button>
        <button id="btn-sound" class="action-btn secondary" type="button">
          Звук: ${sound.enabled ? 'Вкл' : 'Выкл'}
        </button>
        <button id="btn-reset" class="action-btn danger" type="button">Новая игра</button>
      </div>
      <label class="muted">Код сохранения (JSON)</label>
      <textarea id="save-json" rows="4">${serialized}</textarea>
      <div class="row" style="margin-top:8px;">
        <button id="btn-import" class="action-btn secondary" type="button">Загрузить JSON</button>
      </div>
    </div>
  `;

  container.querySelector('#btn-quick-mode')?.addEventListener('click', () => {
    state.quickMode = !state.quickMode;
    pushLog(state, `Быстрый темп: ${state.quickMode ? 'включён' : 'выключен'}`);
    sound.click();
    syncAndRender(false);
  });

  container.querySelector('#btn-sound')?.addEventListener('click', () => {
    sound.enabled = !sound.enabled;
    state.soundEnabled = sound.enabled;
    if (sound.enabled) sound.click();
    syncAndRender(false);
  });

  container.querySelector('#btn-reset')?.addEventListener('click', () => {
    state = resetState();
    activeTab = 'castle';
    syncAndRender(false);
  });

  container.querySelector('#btn-import')?.addEventListener('click', () => {
    try {
      const parsed = JSON.parse(container.querySelector('#save-json')?.value || '');
      state = { ...state, ...parsed };
      advanceSimulation(state, Date.now(), false);
      pushLog(state, 'Сохранение загружено.');
      sound.success();
      syncAndRender(false);
    } catch {
      pushLog(state, 'Ошибка формата JSON.');
      sound.alert();
      syncAndRender(false);
    }
  });
}

function render() {
  const now = Date.now();
  if (realmSelectEl) realmSelectEl.value = state.activeRealm;

  if (taxBtn) {
    const leftSec = Math.max(0, Math.ceil((state.taxCooldownUntil - now) / 1000));
    taxBtn.disabled = leftSec > 0;
    taxBtn.textContent = leftSec > 0 ? `Налоги (${leftSec}с)` : 'Сбор налогов';
  }

  renderHud(hudEl, state);
  renderLogs(logListEl, state);

  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === activeTab);
  });

  if (activeTab === 'castle') {
    renderCastleView(viewEl, state, () => syncAndRender(false));
  } else if (activeTab === 'map') {
    renderWorldMapView(
      viewEl,
      state,
      () => syncAndRender(false),
      () => {
        activeTab = 'battle';
        syncAndRender(false);
      }
    );
  } else if (activeTab === 'battle') {
    renderBattleView(viewEl, state, () => syncAndRender(false));
  } else if (activeTab === 'command') {
    renderCommandView(viewEl, state, () => syncAndRender(false));
  } else if (activeTab === 'system') {
    renderSystemView(viewEl);
  }
}

function syncAndRender(isLiveTick = false) {
  advanceSimulation(state, Date.now(), isLiveTick);
  saveState(state);
  render();
}

document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    activeTab = btn.dataset.tab;
    sound.click();
    render();
  });
});

realmSelectEl?.addEventListener('change', (e) => {
  state.activeRealm = e.target.value;
  sound.click();
  syncAndRender(false);
});

taxBtn?.addEventListener('click', () => {
  const now = Date.now();
  if (now < state.taxCooldownUntil) return;
  const keepLvl = state.slots.find((s) => s.type === 'keep')?.level || 1;
  const gain = 110 + keepLvl * 45;
  state.resources.gold += gain;
  state.taxCooldownUntil = now + 45000;
  pushLog(state, `Сборщик налогов принёс +${gain} монет.`);
  sound.success();
  syncAndRender(false);
});

rubyBoostBtn?.addEventListener('click', () => {
  if ((state.resources.rubies || 0) < 15) {
    pushLog(state, 'Не хватает рубинов для ускорения (нужно 15).');
    sound.alert();
    render();
    return;
  }
  if (!state.buildQueue && !state.trainQueue && state.marches.length === 0) {
    pushLog(state, 'Сейчас нет активных таймеров для ускорения.');
    sound.alert();
    render();
    return;
  }
  state.resources.rubies -= 15;
  if (state.buildQueue) state.buildQueue.endsAt = Date.now();
  if (state.trainQueue) state.trainQueue.totalEndsAt = Date.now();
  for (const m of state.marches) m.arrivesAt = Date.now();
  pushLog(state, 'Потрачено 15 рубинов: текущие таймеры мгновенно завершены!');
  sound.success();
  syncAndRender(false);
});

toggleLogBtn?.addEventListener('click', () => {
  const collapsed = logListEl.classList.toggle('collapsed');
  toggleLogBtn.textContent = collapsed ? 'Развернуть' : 'Свернуть';
});

setInterval(() => {
  syncAndRender(true);
}, BALANCE.tickIntervalMs);

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) syncAndRender(false);
});

render();
