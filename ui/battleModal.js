import { BALANCE } from '../config/balance.js';
import { emptyFlanks, resolveFlankBattle } from '../core/combat.js';
import { getActiveCommander, getEconomyStats } from '../core/economy.js';
import { getMarchDurationMs } from '../core/timeEngine.js';
import { pushLog } from '../core/state.js';
import { sound } from '../audio/sound.js';

let draftFlanks = emptyFlanks();
let lastSimResult = null;

export function renderBattleView(container, state, onMutate) {
  const target = BALANCE.mapTargets.find((t) => t.id === state.selectedTargetId) || BALANCE.mapTargets[0];
  const cmd = getActiveCommander(state);
  const spec = BALANCE.specializations[state.specialization] || BALANCE.specializations.balanced;
  const econ = getEconomyStats(state);
  const marchSec = Math.round(getMarchDurationMs(state, target.distanceTiles) / 1000);

  container.innerHTML = `
    <div class="card">
      <h3>Распределение по секторам — ${target.name}</h3>
      <p class="muted">Войска: М:${state.troops.melee} Л:${state.troops.ranged} О:${state.troops.siege} • Командир: ${cmd.name} • Марш: ~${marchSec}с</p>
      <div class="flank-grid">
        ${['left', 'center', 'right']
          .map((sec) => {
            const label = sec === 'left' ? 'Левый фланг' : sec === 'right' ? 'Правый фланг' : 'Центр';
            return `
              <div class="flank-box">
                <strong>${label}</strong>
                ${Object.keys(BALANCE.units)
                  .map((uKey) => {
                    const uCfg = BALANCE.units[uKey];
                    return `
                      <label class="muted">${uCfg.name}
                        <input type="number" min="0" max="999" data-sec="${sec}" data-unit="${uKey}" value="${draftFlanks[sec][uKey] || 0}" />
                      </label>
                    `;
                  })
                  .join('')}
              </div>
            `;
          })
          .join('')}
      </div>
      <div class="row" style="margin-top: 10px;">
        <button id="btn-auto-split" class="action-btn secondary" type="button">Авто-раскладка</button>
        <button id="btn-sim" class="action-btn secondary" type="button">Симулятор</button>
        <button id="btn-launch" class="action-btn" type="button">В поход</button>
      </div>
    </div>

    ${
      lastSimResult
        ? `
      <div class="card">
        <h3>Результат симулятора (без потерь)</h3>
        <p><strong>Прогноз:</strong> ${lastSimResult.victory ? 'Победа' : 'Поражение'} (${lastSimResult.atkWonSectors}/3 секторов)</p>
        ${
          lastSimResult.bottlenecks.length
            ? `<p class="muted">Слабые места: ${lastSimResult.bottlenecks.join('; ')}</p>`
            : '<p class="muted">Все сектора сбалансированы.</p>'
        }
      </div>
    `
        : ''
    }

    ${
      state.lastReport
        ? `
      <div class="card">
        <h3>Последний отчёт боя (${state.lastReport.targetName})</h3>
        <p><strong>Итог:</strong> ${state.lastReport.victory ? 'Победа' : 'Поражение'}</p>
        ${
          state.lastReport.bottlenecks?.length
            ? `<p class="muted">Разбор: ${state.lastReport.bottlenecks.join('; ')}</p>`
            : ''
        }
        <p class="muted">Трофеи: Д:${state.lastReport.loot.wood} К:${state.lastReport.loot.stone} Е:${state.lastReport.loot.food} М:${state.lastReport.loot.gold}</p>
      </div>
    `
        : ''
    }
  `;

  const readInputs = () => {
    const next = emptyFlanks();
    container.querySelectorAll('input[data-sec]').forEach((inp) => {
      const sec = inp.dataset.sec;
      const unit = inp.dataset.unit;
      next[sec][unit] = Math.max(0, parseInt(inp.value || '0', 10) || 0);
    });
    draftFlanks = next;
    return next;
  };

  container.querySelectorAll('input[data-sec]').forEach((inp) => {
    inp.addEventListener('change', readInputs);
  });

  container.querySelector('#btn-auto-split')?.addEventListener('click', () => {
    const next = emptyFlanks();
    for (const uKey of Object.keys(BALANCE.units)) {
      const total = state.troops[uKey] || 0;
      const each = Math.floor(total / 3);
      next.left[uKey] = each;
      next.right[uKey] = each;
      next.center[uKey] = total - each * 2;
    }
    draftFlanks = next;
    sound.click();
    onMutate();
  });

  container.querySelector('#btn-sim')?.addEventListener('click', () => {
    const flanks = readInputs();
    lastSimResult = resolveFlankBattle(flanks, target.defense, {
      mutate: false,
      wallBonus: econ.wallDefenseBonus,
      atkMult: (cmd.atkMult || 1) * (spec.atkMult || 1),
      siegeMult: cmd.siegeMult || 1,
      fatigue: state.fatigue || 0
    });
    sound.click();
    onMutate();
  });

  container.querySelector('#btn-launch')?.addEventListener('click', () => {
    const flanks = readInputs();
    const totalNeeded = { melee: 0, ranged: 0, siege: 0 };
    for (const sec of ['left', 'center', 'right']) {
      for (const uKey of Object.keys(totalNeeded)) {
        totalNeeded[uKey] += flanks[sec][uKey] || 0;
      }
    }

    const totalCount = totalNeeded.melee + totalNeeded.ranged + totalNeeded.siege;
    if (totalCount <= 0) {
      pushLog(state, 'Распределите хотя бы один отряд перед отправкой.');
      sound.alert();
      onMutate();
      return;
    }

    for (const uKey of Object.keys(totalNeeded)) {
      if ((state.troops[uKey] || 0) < totalNeeded[uKey]) {
        pushLog(state, `Не хватает войск (${BALANCE.units[uKey].name}).`);
        sound.alert();
        onMutate();
        return;
      }
    }

    for (const uKey of Object.keys(totalNeeded)) {
      state.troops[uKey] -= totalNeeded[uKey];
    }

    const travelMs = getMarchDurationMs(state, target.distanceTiles);
    state.marches.push({
      id: `march_${Date.now()}`,
      targetId: target.id,
      kind: 'attack',
      flanks,
      startedAt: Date.now(),
      arrivesAt: Date.now() + travelMs
    });

    draftFlanks = emptyFlanks();
    pushLog(state, `Отряд выступил на "${target.name}" (${Math.round(travelMs / 1000)}с).`);
    sound.march();
    onMutate();
  });
}

