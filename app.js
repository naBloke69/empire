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
const filters = { realm: 'ALL', kind: 'ALL' };

const appEl = document.getElementById('app');
const hudEl = document.getElementById('hud');
const viewEl = document.getElementById('view-container');
const logListEl = document.getElementById('event-log');
const toggleLogBtn = document.getElementById('btn-toggle-log');
const realmFilterEl = document.getElementById('realm-filter');
const kindFilterEl = document.getElementById('map-layer-filter');
const cleanViewBtn = document.getElementById('btn-clean-view');
const quickScoutBtn = document.getElementById('btn-quick-scout');

function renderSystemView(container) {
  const serialized = JSON.stringify(state);
  container.innerHTML = `
    <div class="card">
      <h3>Темп, звук и сохранение</h3>
      <div class="row" style="margin-bottom: 10px;">
        <button id="btn-quick-mode" class="action-btn secondary" type="button">
          Быстрый режим (x${BALANCE.quickModeMultiplier}): ${state.quickMode ? 'Вкл' : 'Выкл'}
        </button>
        <button id="btn-sound" class="action-btn secondary" type="button">
          Звук (Web Audio): ${sound.enabled ? 'Вкл' : 'Выкл'}
        </button>
        <button id="btn-reset" class="action-btn danger" type="button">Сброс</button>
      </div>
      <label class="muted">Экспорт / импорт сейва (JSON)</label>
      <textarea id="save-json" rows="4">${serialized}</textarea>
      <div class="row" style="margin-top: 8px;">
        <button id="btn-import" class="action-btn secondary" type="button">Импортировать JSON</button>
      </div>
    </div>
  `;

  container.querySelector('#btn-quick-mode')?.addEventListener('click', () => {
    state.quickMode = !state.quickMode;
    pushLog(state, `Быстрый режим: ${state.quickMode ? 'включён' : 'выключен'}`);
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
    const raw = container.querySelector('#save-json')?.value || '';
    try {
      const parsed = JSON.parse(raw);
      state = { ...state, ...parsed };
      advanceSimulation(state, Date.now(), false);
      pushLog(state, 'Сейв импортирован.');
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
  appEl?.classList.toggle('clean-mode', Boolean(state.cleanView));
  if (cleanViewBtn) {
    cleanViewBtn.textContent = state.cleanView ? 'Обычный вид' : 'Чистый вид';
  }
  if (realmFilterEl) realmFilterEl.value = filters.realm;
  if (kindFilterEl) kindFilterEl.value = filters.kind;

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
      filters,
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

realmFilterEl?.addEventListener('change', (e) => {
  filters.realm = e.target.value;
  sound.click();
  render();
});

kindFilterEl?.addEventListener('change', (e) => {
  filters.kind = e.target.value;
  sound.click();
  render();
});

cleanViewBtn?.addEventListener('click', () => {
  state.cleanView = !state.cleanView;
  sound.click();
  saveState(state);
  render();
});

quickScoutBtn?.addEventListener('click', () => {
  state.scoutedIds = BALANCE.mapTargets.map((t) => t.id);
  pushLog(state, 'Разведка обновила данные по целям на карте.');
  sound.success();
  saveState(state);
  render();
});

toggleLogBtn?.addEventListener('click', () => {
  const collapsed = logListEl.classList.toggle('collapsed');
  toggleLogBtn.textContent = collapsed ? 'Развернуть' : 'Свернуть';
});

setInterval(() => {
  syncAndRender(true);
}, BALANCE.tickIntervalMs);

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    syncAndRender(false);
  }
});

render();