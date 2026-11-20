import { BALANCE } from '../config/balance.js';
import { emptyWave, resolveSiegeBattle } from '../core/combat.js';
import { getActiveCommander, getGearBonuses, getMaxAttackWaves } from '../core/economy.js';
import { getMarchDurationMs } from '../core/timeEngine.js';
import { pushLog } from '../core/state.js';
import { sound } from '../audio/sound.js';

let draftWaves = [emptyWave()];
let activeWaveIndex = 0;
let simReport = null;

function ensureWaveSlots(count) {
  while (draftWaves.length < count) draftWaves.push(emptyWave());
  if (draftWaves.length > count) draftWaves.length = count;
  if (activeWaveIndex >= count) activeWaveIndex = 0;
}

export function renderBattleView(container, state, onMutate) {
  const maxWaves = getMaxAttackWaves(state);
  ensureWaveSlots(maxWaves);

  const target = BALANCE.mapTargets.find((t) => t.id === state.selectedTargetId) || BALANCE.mapTargets[0];
  const cmd = getActiveCommander(state);
  const gear = getGearBonuses(state);
  const realm = BALANCE.realms[state.activeRealm] || BALANCE.realms.great_empire;
  const wave = draftWaves[activeWaveIndex];

  container.innerHTML = `
    <div class="card">
      <h3>Штурм: ${target.name}</h3>
      <p class="muted">
        Армия: Б:${state.troops.maceman} А:${state.troops.crossbow} Р:${state.troops.knight} •
        Орудия: Л:${state.tools.ladder} Т:${state.tools.ram} Щ:${state.tools.mantlet}
      </p>

      <div class="row" style="margin-bottom:8px;">
        ${draftWaves
          .map(
            (_, idx) => `
          <button class="mini-btn ${idx === activeWaveIndex ? 'gold' : ''}" data-wave="${idx}" type="button">
            Волна ${idx + 1}
          </button>
        `
          )
          .join('')}
        <button id="btn-clear-waves" class="mini-btn" type="button">Очистить</button>
      </div>

      <div class="flank-grid">
        ${['left', 'center', 'right']
          .map((sec) => {
            const title = sec === 'left' ? 'Левый фланг' : sec === 'right' ? 'Правый фланг' : 'Центр (ворота)';
            return `
              <div class="flank-box">
                <strong>${title}</strong>
                ${Object.entries(BALANCE.units)
                  .map(
                    ([uKey, uCfg]) => `
                  <label>${uCfg.name}
                    <input type="number" min="0" max="999" data-sec="${sec}" data-unit="${uKey}" value="${wave.flanks[sec][uKey] || 0}" />
                  </label>
                `
                  )
                  .join('')}
              </div>
            `;
          })
          .join('')}
      </div>

      <div class="flank-grid" style="margin-top:6px;">
        ${Object.entries(BALANCE.tools)
          .map(
            ([tKey, tCfg]) => `
          <div class="flank-box">
            <label>${tCfg.name}
              <input type="number" min="0" max="99" data-tool="${tKey}" value="${wave.tools[tKey] || 0}" />
            </label>
          </div>
        `
          )
          .join('')}
      </div>

      <div class="row" style="margin-top:8px;">
        <button id="btn-autofill" class="action-btn secondary" type="button">Автоподбор</button>
        <button id="btn-simulate" class="action-btn secondary" type="button">Симуляция</button>
        <button id="btn-attack" class="action-btn" type="button">⚔️ В атаку (${cmd.name})</button>
      </div>
    </div>

    <div class="card">
      <h3>PvP-рейды на замки игроков</h3>
      ${BALANCE.rivals
        .map((r) => {
          const status = r.shielded ? '🛡️ Щит мира' : r.online ? '🟢 В сети' : '⚪ Оффлайн';
          return `
            <div class="map-node">
              <div>
                <strong>${r.name}</strong> <span class="muted">[${r.alliance}] • ${status}</span>
                <div class="muted">Мощь: ${r.power} • Добыча: 🪵${r.loot.wood} 🪨${r.loot.stone} 🪙${r.loot.gold} 💎${r.loot.rubies}</div>
              </div>
              <button class="mini-btn gold" data-pvp-raid="${r.id}" ${r.shielded ? 'disabled' : ''} type="button">
                Набег
              </button>
            </div>
          `;
        })
        .join('')}
    </div>

    ${
      simReport
        ? `
      <div class="card">
        <h3>Прогноз симулятора</h3>
        <p><strong>Итог:</strong> ${simReport.victory ? '✅ Победа' : '❌ Поражение'} (${simReport.wonCount}/3 секторов)</p>
        ${
          simReport.notes.length
            ? `<p class="muted">${simReport.notes.join('; ')}</p>`
            : '<p class="muted">Стены и ворота успешно пробиты!</p>'
        }
      </div>
    `
        : ''
    }

    ${
      state.lastReport
        ? `
      <div class="card parchment">
        <h3>📜 Боевой отчёт: ${state.lastReport.targetName}</h3>
        <p><strong>Результат:</strong> ${state.lastReport.victory ? '⚔️ Победа' : '🛡️ Поражение'}</p>
        ${state.lastReport.notes?.length ? `<p class="muted">${state.lastReport.notes.join('; ')}</p>` : ''}
        <p class="muted">Трофеи: 🪵${state.lastReport.loot.wood} 🪨${state.lastReport.loot.stone} 🌾${state.lastReport.loot.food} 🪙${state.lastReport.loot.gold} 💎${state.lastReport.loot.rubies || 0}</p>
      </div>
    `
        : ''
    }
  `;

  const syncCurrentWaveInputs = () => {
    container.querySelectorAll('input[data-sec]').forEach((inp) => {
      wave.flanks[inp.dataset.sec][inp.dataset.unit] = Math.max(0, parseInt(inp.value || '0', 10) || 0);
    });
    container.querySelectorAll('input[data-tool]').forEach((inp) => {
      wave.tools[inp.dataset.tool] = Math.max(0, parseInt(inp.value || '0', 10) || 0);
    });
  };

  container.querySelectorAll('input').forEach((inp) => {
    inp.addEventListener('change', syncCurrentWaveInputs);
  });

  container.querySelectorAll('[data-wave]').forEach((btn) => {
    btn.addEventListener('click', () => {
      syncCurrentWaveInputs();
      activeWaveIndex = parseInt(btn.dataset.wave, 10) || 0;
      sound.click();
      onMutate();
    });
  });

  container.querySelector('#btn-clear-waves')?.addEventListener('click', () => {
    draftWaves = Array.from({ length: maxWaves }, () => emptyWave());
    simReport = null;
    sound.click();
    onMutate();
  });

  container.querySelector('#btn-autofill')?.addEventListener('click', () => {
    draftWaves = Array.from({ length: maxWaves }, () => emptyWave());
    const perWaveMult = 1 / maxWaves;
    for (let i = 0; i < maxWaves; i++) {
      const w = draftWaves[i];
      for (const uKey of Object.keys(BALANCE.units)) {
        const avail = Math.floor((state.troops[uKey] || 0) * perWaveMult);
        const each = Math.floor(avail / 3);
        w.flanks.left[uKey] = each;
        w.flanks.right[uKey] = each;
        w.flanks.center[uKey] = avail - each * 2;
      }
      for (const tKey of Object.keys(BALANCE.tools)) {
        w.tools[tKey] = Math.floor((state.tools[tKey] || 0) / maxWaves);
      }
    }
    sound.click();
    onMutate();
  });

  container.querySelector('#btn-simulate')?.addEventListener('click', () => {
    syncCurrentWaveInputs();
    simReport = resolveSiegeBattle(draftWaves, target, {
      mutate: false,
      commander: cmd,
      gear,
      realmAtkMult: realm.atkMult || 1
    });
    sound.click();
    onMutate();
  });

  container.querySelector('#btn-attack')?.addEventListener('click', () => {
    syncCurrentWaveInputs();
    const usedUnits = { maceman: 0, crossbow: 0, knight: 0 };
    const usedTools = { ladder: 0, ram: 0, mantlet: 0 };

    for (const w of draftWaves) {
      for (const sec of ['left', 'center', 'right']) {
        for (const uKey of Object.keys(usedUnits)) usedUnits[uKey] += w.flanks[sec][uKey] || 0;
      }
      for (const tKey of Object.keys(usedTools)) usedTools[tKey] += w.tools[tKey] || 0;
    }

    const totalTroops = Object.values(usedUnits).reduce((a, b) => a + b, 0);
    if (totalTroops <= 0) {
      pushLog(state, 'Назначьте войска хотя бы в одну волну.');
      sound.alert();
      onMutate();
      return;
    }

    for (const [uKey, cnt] of Object.entries(usedUnits)) {
      if ((state.troops[uKey] || 0) < cnt) {
        pushLog(state, `Не хватает воинов: ${BALANCE.units[uKey].name}.`);
        sound.alert();
        onMutate();
        return;
      }
    }
    for (const [tKey, cnt] of Object.entries(usedTools)) {
      if ((state.tools[tKey] || 0) < cnt) {
        pushLog(state, `Не хватает орудий: ${BALANCE.tools[tKey].name}.`);
        sound.alert();
        onMutate();
        return;
      }
    }

    for (const [uKey, cnt] of Object.entries(usedUnits)) state.troops[uKey] -= cnt;
    for (const [tKey, cnt] of Object.entries(usedTools)) state.tools[tKey] -= cnt;

    const travelMs = getMarchDurationMs(state, target.distanceTiles);
    state.marches.push({
      id: `atk_${Date.now()}`,
      targetId: target.id,
      realm: target.realm,
      kind: 'attack',
      waves: JSON.parse(JSON.stringify(draftWaves)),
      startedAt: Date.now(),
      arrivesAt: Date.now() + travelMs
    });

    draftWaves = Array.from({ length: maxWaves }, () => emptyWave());
    simReport = null;
    pushLog(state, `Армия выступила на штурм "${target.name}" (${Math.round(travelMs / 1000)}с).`);
    sound.march();
    onMutate();
  });

  container.querySelectorAll('[data-pvp-raid]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const rival = BALANCE.rivals.find((x) => x.id === btn.dataset.pvpRaid);
      if (!rival || rival.shielded) return;
      const myPow =
        (state.troops.maceman || 0) * 16 +
        (state.troops.crossbow || 0) * 21 +
        (state.troops.knight || 0) * 34;
      if (myPow <= 0) {
        pushLog(state, 'Сначала наймите войска для PvP-рейда.');
        sound.alert();
        onMutate();
        return;
      }
      const win = myPow >= rival.power * 0.72;
      const lossRatio = win ? 0.16 : 0.42;
      for (const uKey of Object.keys(BALANCE.units)) {
        state.troops[uKey] = Math.max(0, Math.round((state.troops[uKey] || 0) * (1 - lossRatio)));
      }
      if (win) {
        state.victoriesCount = (state.victoriesCount || 0) + 1;
        state.allianceWarPoints = (state.allianceWarPoints || 0) + 35;
        for (const [res, amt] of Object.entries(rival.loot)) {
          state.resources[res] = (state.resources[res] || 0) + amt;
        }
        state.lastReport = {
          targetName: `Замок: ${rival.name}`,
          victory: true,
          notes: ['Разграблена казна соперника и начислены очки войны альянса'],
          loot: rival.loot,
          at: Date.now()
        };
        pushLog(state, `PvP-набег на ${rival.name} успешен! Забраны трофеи и +35 очков войны.`);
        sound.success();
      } else {
        state.lastReport = {
          targetName: `Замок: ${rival.name}`,
          victory: false,
          notes: ['Гарнизон игрока отбил набег'],
          loot: { wood: 0, stone: 0, food: 0, gold: 0, rubies: 0 },
          at: Date.now()
        };
        pushLog(state, `PvP-набег на ${rival.name} отбит.`);
        sound.alert();
      }
      onMutate();
    });
  });
}
