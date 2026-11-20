import { BALANCE } from './config/balance.js';
import { createInitialState, loadState, resetState, saveState, pushLog } from './core/state.js';
import { advanceSimulation } from './core/timeEngine.js';
import { getEconomyStats } from './core/economy.js';
import { renderHud, renderTimerStrip, renderLogs } from './ui/hud.js';
import { renderCastleView } from './ui/castleView.js';
import { renderWorldMapView } from './ui/worldMapView.js';
import { renderBattleView } from './ui/battleModal.js';
import { renderCommandView } from './ui/commandView.js';
import { sound } from './audio/sound.js';

const PROFILES_KEY = 'e4k_profiles_v5';
let systemSubTab = 'quests';
let toastTimer = null;

function showToast(text) {
  const banner = document.getElementById('toast-banner');
  if (!banner || !text) return;
  banner.textContent = text;
  banner.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    banner.classList.add('hidden');
  }, 3200);
}

function getProfilesMap() {
  try {
    return JSON.parse(localStorage.getItem(PROFILES_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveCurrentProfile(stateObj) {
  try {
    const map = getProfilesMap();
    const key = (stateObj.accountName || 'Лорд Stezzy').trim() || 'Лорд Stezzy';
    map[key] = stateObj;
    localStorage.setItem(PROFILES_KEY, JSON.stringify(map));
  } catch {}
}

let state = loadState();
sound.enabled = state.soundEnabled !== false;
advanceSimulation(state, Date.now(), false, showToast);
saveState(state);
saveCurrentProfile(state);

let activeTab = 'castle';

const hudEl = document.getElementById('hud');
const timerStripEl = document.getElementById('timer-strip');
const viewEl = document.getElementById('view-container');
const logListEl = document.getElementById('event-log');
const toggleLogBtn = document.getElementById('btn-toggle-log');
const realmSelectEl = document.getElementById('realm-select');
const taxBtn = document.getElementById('btn-tax');
const rubyBoostBtn = document.getElementById('btn-ruby-boost');

function getQuestProgress(qId) {
  const econ = getEconomyStats(state);
  if (qId === 'q_build') {
    return state.slots.reduce((s, slot) => s + (slot.level || 0), 0);
  }
  if (qId === 'q_raid') {
    return state.victoriesCount || 0;
  }
  if (qId === 'q_order') {
    return econ.publicOrder;
  }
  if (qId === 'q_spy') {
    return (state.scoutedIds || []).length;
  }
  if (qId === 'q_outpost') {
    return (state.capturedOutposts || []).length;
  }
  if (qId === 'q_keep4') {
    return state.slots.find((s) => s.type === 'keep')?.level || 1;
  }
  return 0;
}

function renderSystemView(container) {
  const profiles = Object.keys(getProfilesMap());
  const serialized = JSON.stringify(state);

  let sectionHtml = '';

  if (systemSubTab === 'quests') {
    const claimedCount = (state.claimedQuestIds || []).length;
    sectionHtml = `
      <div class="card parchment">
        <h3>📖 ${BALANCE.storyChapter.title}</h3>
        <p class="muted">${BALANCE.storyChapter.summary}</p>
        <p class="muted"><strong>Прогресс главы:</strong> выполнено заданий ${claimedCount} из ${BALANCE.quests.length}</p>
      </div>

      <div class="card">
        <h3>Квестовая линия и задания</h3>
        ${BALANCE.quests
          .map((q) => {
            const cur = getQuestProgress(q.id);
            const pct = Math.min(100, Math.round((cur / q.target) * 100));
            const claimed = (state.claimedQuestIds || []).includes(q.id);
            const ready = !claimed && cur >= q.target;
            return `
              <div class="map-node" style="flex-direction:column;align-items:stretch;">
                <div class="row" style="justify-content:space-between;">
                  <div>
                    <span class="muted">[${q.chapter}]</span> <strong>${q.title}</strong>
                    <div class="muted">${q.desc} (${cur}/${q.target}) • Награда: 🪙${q.rewardGold} 💎${q.rewardRubies}</div>
                  </div>
                  <button class="mini-btn ${claimed ? 'ok' : ready ? 'gold' : ''}" data-claim-quest="${q.id}" ${ready ? '' : 'disabled'} type="button">
                    ${claimed ? 'Получено' : ready ? 'Забрать' : 'В работе'}
                  </button>
                </div>
                <div class="quest-bar"><div class="quest-fill" style="width:${pct}%"></div></div>
              </div>
            `;
          })
          .join('')}
      </div>
    `;
  } else if (systemSubTab === 'research') {
    sectionHtml = `
      <div class="card">
        <h3>Академия и исследования</h3>
        ${BALANCE.researchTree
          .map((r) => {
            const done = (state.completedResearchIds || []).includes(r.id);
            const canRes = !done && (state.resources.gold || 0) >= r.costGold;
            return `
              <div class="map-node">
                <div>
                  <strong>${r.name}</strong>
                  <div class="muted">${r.desc} • Цена: 🪙${r.costGold}</div>
                </div>
                <button class="mini-btn ${done ? 'ok' : 'gold'}" data-research="${r.id}" ${done || !canRes ? 'disabled' : ''} type="button">
                  ${done ? 'Изучено' : 'Изучить'}
                </button>
              </div>
            `;
          })
          .join('')}
      </div>
    `;
  } else if (systemSubTab === 'alliance') {
    const chatItems = state.allianceChat || [];
    sectionHtml = `
      <div class="card">
        <h3>Альянс: ${state.allianceName || 'Железный легион'} • Казна: 🪙${state.allianceTreasury || 0} • Очки войны: ${state.allianceWarPoints || 0}</h3>
        <div class="row" style="margin-bottom:8px;">
          <button id="btn-donate-alliance" class="action-btn secondary" type="button">Взнос в казну (🪙50)</button>
          <button id="btn-join-rally" class="mini-btn gold" type="button">🚩 Сбор на цель (+15 бойцов)</button>
          <button id="btn-share-coord" class="mini-btn" type="button">📍 Метка в чат</button>
        </div>
        <p class="muted">Активный сбор (ралли): <strong>${state.activeRallyTarget}</strong> • Вложено в сбор: ${state.rallyJoinedTroops || 0} бойцов</p>
        ${BALANCE.alliancePerks
          .map((perk) => {
            const active = (state.activeAlliancePerks || []).includes(perk.id);
            return `
              <div class="map-node">
                <div>
                  <strong>${perk.name}</strong>
                  <div class="muted">${perk.desc} (Казна: 🪙${perk.costGold})</div>
                </div>
                <button class="mini-btn ${active ? 'ok' : 'gold'}" data-perk="${perk.id}" type="button">
                  ${active ? 'Активен' : 'Активировать'}
                </button>
              </div>
            `;
          })
          .join('')}
      </div>

      <div class="card">
        <h3>Чат союза</h3>
        ${chatItems
          .slice(0, 6)
          .map((m) => `<p class="muted"><strong>${m.author}:</strong> ${m.text}</p>`)
          .join('')}
        <div class="row" style="margin-top:6px;">
          <input id="alliance-chat-input" type="text" placeholder="Сообщение соклановцам..." />
          <button id="btn-send-chat" class="action-btn" type="button">Отправить</button>
        </div>
      </div>
    `;
  } else if (systemSubTab === 'market') {
    sectionHtml = `
      <div class="card">
        <h3>Онлайн-рынок ресурсов</h3>
        ${BALANCE.marketOffers
          .map((o) => {
            const labelMap = { wood: '🪵 Дерево', stone: '🪨 Камень', food: '🌾 Еда', gold: '🪙 Монеты' };
            const ok = (state.resources[o.want] || 0) >= o.wantAmt;
            return `
              <div class="map-node">
                <div>
                  <strong>${o.seller}</strong>
                  <div class="muted">Отдаёт: ${o.giveAmt} ${labelMap[o.give] || o.give} • Просит: ${o.wantAmt} ${labelMap[o.want] || o.want}</div>
                </div>
                <button class="mini-btn gold" data-market="${o.id}" ${ok ? '' : 'disabled'} type="button">
                  Обменять
                </button>
              </div>
            `;
          })
          .join('')}
      </div>
    `;
  } else {
    sectionHtml = `
      <div class="card">
        <h3>Аккаунт и профили империи</h3>
        <div class="row" style="margin-bottom:8px;">
          <input id="account-name-input" type="text" value="${state.accountName || 'Лорд Stezzy'}" placeholder="Имя правителя" />
          <button id="btn-save-profile" class="action-btn" type="button">Сохранить</button>
        </div>
        ${
          profiles.length
            ? `<div class="row" style="margin-bottom:8px;">
                ${profiles
                  .map(
                    (name) =>
                      `<button class="mini-btn ${name === state.accountName ? 'gold' : ''}" data-load-profile="${name}" type="button">👤 ${name}</button>`
                  )
                  .join('')}
              </div>`
            : ''
        }
        <button id="btn-new-account" class="action-btn secondary" type="button">+ Новый аккаунт (чистый старт)</button>
      </div>

      <div class="card">
        <h3>Настройки и сохранение</h3>
        <div class="row" style="margin-bottom:8px;">
          <button id="btn-quick-mode" class="action-btn secondary" type="button">
            Темп (x2): ${state.quickMode ? 'Вкл' : 'Выкл'}
          </button>
          <button id="btn-sound" class="action-btn secondary" type="button">
            Звук: ${sound.enabled ? 'Вкл' : 'Выкл'}
          </button>
          <button id="btn-reset" class="action-btn danger" type="button">Сброс</button>
        </div>
        <label class="muted">Экспорт / импорт сохранения (JSON)</label>
        <textarea id="save-json" rows="4">${serialized}</textarea>
        <div class="row" style="margin-top:8px;">
          <button id="btn-copy-json" class="mini-btn gold" type="button">Копировать JSON</button>
          <button id="btn-import" class="action-btn secondary" type="button">Загрузить JSON</button>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="subtabs">
      <button class="mini-btn ${systemSubTab === 'quests' ? 'gold' : ''}" data-subtab="quests" type="button">🏆 Задания</button>
      <button class="mini-btn ${systemSubTab === 'research' ? 'gold' : ''}" data-subtab="research" type="button">🔬 Исследования</button>
      <button class="mini-btn ${systemSubTab === 'alliance' ? 'gold' : ''}" data-subtab="alliance" type="button">🛡️ Альянс</button>
      <button class="mini-btn ${systemSubTab === 'market' ? 'gold' : ''}" data-subtab="market" type="button">⚖️ Рынок</button>
      <button class="mini-btn ${systemSubTab === 'account' ? 'gold' : ''}" data-subtab="account" type="button">⚙️ Аккаунт</button>
    </div>
    ${sectionHtml}
  `;

  container.querySelectorAll('[data-subtab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      systemSubTab = btn.dataset.subtab;
      sound.click();
      render();
    });
  });

  container.querySelectorAll('[data-claim-quest]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const q = BALANCE.quests.find((x) => x.id === btn.dataset.claimQuest);
      if (!q || (state.claimedQuestIds || []).includes(q.id)) return;
      if (getQuestProgress(q.id) < q.target) return;
      state.claimedQuestIds = [...(state.claimedQuestIds || []), q.id];
      state.resources.gold = (state.resources.gold || 0) + q.rewardGold;
      state.resources.rubies = (state.resources.rubies || 0) + q.rewardRubies;
      const msg = `Награда за задание "${q.title}": +🪙${q.rewardGold} и +💎${q.rewardRubies}!`;
      pushLog(state, msg);
      showToast(msg);
      sound.success();
      syncAndRender(false);
    });
  });

  container.querySelectorAll('[data-research]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const r = BALANCE.researchTree.find((x) => x.id === btn.dataset.research);
      if (!r || (state.completedResearchIds || []).includes(r.id)) return;
      if ((state.resources.gold || 0) < r.costGold) return;
      state.resources.gold -= r.costGold;
      state.completedResearchIds = [...(state.completedResearchIds || []), r.id];
      pushLog(state, `Изучено исследование: "${r.name}"!`);
      sound.success();
      syncAndRender(false);
    });
  });

  container.querySelector('#btn-join-rally')?.addEventListener('click', () => {
    const avail = state.troops.maceman || 0;
    const take = Math.min(15, avail);
    if (take <= 0) {
      pushLog(state, 'Нет свободных булавщиков для присоединения к сбору.');
      sound.alert();
      syncAndRender(false);
      return;
    }
    state.troops.maceman -= take;
    state.rallyJoinedTroops = (state.rallyJoinedTroops || 0) + take;
    state.allianceWarPoints = (state.allianceWarPoints || 0) + 15;
    pushLog(state, `Вы присоединились к общему сбору альянса (+${take} бойцов, +15 очков войны).`);
    sound.success();
    syncAndRender(false);
  });

  container.querySelector('#btn-share-coord')?.addEventListener('click', () => {
    const t = BALANCE.mapTargets.find((x) => x.id === state.selectedTargetId) || BALANCE.mapTargets[0];
    state.allianceChat = [
      { id: `c_${Date.now()}`, author: state.accountName || 'Лорд Stezzy', text: `Цель для атаки: ${t.name} (${BALANCE.realms[t.realm]?.name})` },
      ...(state.allianceChat || [])
    ];
    pushLog(state, `Метка "${t.name}" отправлена в чат альянса.`);
    sound.click();
    syncAndRender(false);
  });

  container.querySelector('#btn-send-chat')?.addEventListener('click', () => {
    const inp = container.querySelector('#alliance-chat-input');
    const txt = (inp?.value || '').trim();
    if (!txt) return;
    state.allianceChat = [
      { id: `c_${Date.now()}`, author: state.accountName || 'Лорд Stezzy', text: txt },
      ...(state.allianceChat || [])
    ];
    sound.click();
    syncAndRender(false);
  });

  container.querySelectorAll('[data-market]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const offer = BALANCE.marketOffers.find((x) => x.id === btn.dataset.market);
      if (!offer || (state.resources[offer.want] || 0) < offer.wantAmt) return;
      state.resources[offer.want] -= offer.wantAmt;
      state.resources[offer.give] = (state.resources[offer.give] || 0) + offer.giveAmt;
      pushLog(state, `Сделка на рынке: получено ${offer.giveAmt} ${offer.give}.`);
      sound.success();
      syncAndRender(false);
    });
  });

  container.querySelector('#btn-save-profile')?.addEventListener('click', () => {
    const val = (container.querySelector('#account-name-input')?.value || '').trim() || 'Лорд Stezzy';
    state.accountName = val;
    saveCurrentProfile(state);
    pushLog(state, `Профиль сохранён под именем "${val}".`);
    sound.success();
    syncAndRender(false);
  });

  container.querySelectorAll('[data-load-profile]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pName = btn.dataset.loadProfile;
      const map = getProfilesMap();
      if (map[pName]) {
        state = { ...createInitialState(), ...map[pName], accountName: pName };
        advanceSimulation(state, Date.now(), false, showToast);
        pushLog(state, `Переключён аккаунт на "${pName}".`);
        sound.click();
        syncAndRender(false);
      }
    });
  });

  container.querySelector('#btn-new-account')?.addEventListener('click', () => {
    const idx = Object.keys(getProfilesMap()).length + 1;
    state = createInitialState();
    state.accountName = `Лорд #${idx}`;
    saveCurrentProfile(state);
    pushLog(state, `Создан новый аккаунт "${state.accountName}".`);
    sound.success();
    activeTab = 'castle';
    syncAndRender(false);
  });

  container.querySelector('#btn-donate-alliance')?.addEventListener('click', () => {
    if ((state.resources.gold || 0) < 50) {
      pushLog(state, 'Не хватает монет для взноса в альянс (нужно 50).');
      sound.alert();
      syncAndRender(false);
      return;
    }
    state.resources.gold -= 50;
    state.allianceTreasury = (state.allianceTreasury || 0) + 50;
    pushLog(state, 'Внесено 50 монет в казну альянса.');
    sound.success();
    syncAndRender(false);
  });

  container.querySelectorAll('[data-perk]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pId = btn.dataset.perk;
      const perk = BALANCE.alliancePerks.find((x) => x.id === pId);
      if (!perk) return;
      const set = new Set(state.activeAlliancePerks || []);
      if (set.has(pId)) {
        set.delete(pId);
      } else {
        if ((state.allianceTreasury || 0) < perk.costGold) {
          pushLog(state, 'Недостаточно монет в казне альянса.');
          sound.alert();
          syncAndRender(false);
          return;
        }
        state.allianceTreasury -= perk.costGold;
        set.add(pId);
      }
      state.activeAlliancePerks = [...set];
      sound.click();
      syncAndRender(false);
    });
  });

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

  container.querySelector('#btn-copy-json')?.addEventListener('click', () => {
    const txt = container.querySelector('#save-json')?.value || '';
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(txt).catch(() => {});
    }
    showToast('Сохранение JSON скопировано!');
    sound.click();
  });

  container.querySelector('#btn-import')?.addEventListener('click', () => {
    try {
      const parsed = JSON.parse(container.querySelector('#save-json')?.value || '');
      state = { ...createInitialState(), ...parsed };
      advanceSimulation(state, Date.now(), false, showToast);
      saveCurrentProfile(state);
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
  try {
    const now = Date.now();
    if (realmSelectEl) realmSelectEl.value = state.activeRealm;

    if (taxBtn) {
      const leftSec = Math.max(0, Math.ceil((state.taxCooldownUntil - now) / 1000));
      taxBtn.disabled = leftSec > 0;
      taxBtn.textContent = leftSec > 0 ? `Налоги (${leftSec}с)` : 'Налоги';
    }

    renderHud(hudEl, state);
    renderTimerStrip(timerStripEl, state);
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
  } catch (err) {
    console.error(err);
    viewEl.innerHTML = `<div class="card"><h3>Ошибка отрисовки</h3><p class="muted">${err?.message || err}</p></div>`;
  }
}

function syncAndRender(isLiveTick = false) {
  advanceSimulation(state, Date.now(), isLiveTick, showToast);
  saveState(state);
  saveCurrentProfile(state);
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

window.addEventListener('error', (ev) => {
  pushLog(state, `Ошибка скрипта: ${ev.message || 'unknown'}`);
  render();
});

render();
