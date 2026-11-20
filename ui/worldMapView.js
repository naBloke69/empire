import { BALANCE } from '../config/balance.js';
import { getMarchDurationMs } from '../core/timeEngine.js';
import { pushLog } from '../core/state.js';
import { sound } from '../audio/sound.js';

export function renderWorldMapView(container, state, filters, onMutate, onGoBattle) {
  const now = Date.now();
  const filtered = BALANCE.mapTargets.filter((t) => {
    const realmOk = filters.realm === 'ALL' || t.realm === filters.realm;
    const kindOk = filters.kind === 'ALL' || t.kind === filters.kind;
    return realmOk && kindOk;
  });

  container.innerHTML = `
    <div class="card">
      <h3>Карта королевств (${filtered.length})</h3>
      ${filtered
        .map((t) => {
          const scouted = state.scoutedIds.includes(t.id);
          const defTotal = ['left', 'center', 'right'].reduce((acc, sec) => {
            const s = t.defense[sec];
            return acc + (s.melee || 0) + (s.ranged || 0) + (s.siege || 0);
          }, 0);
          const marchSec = Math.round(getMarchDurationMs(state, t.distanceTiles) / 1000);
          const kindBadge =
            t.kind === 'VILLAGE'
              ? '<span class="badge ok">Деревня</span>'
              : t.kind === 'EVENT'
              ? '<span class="badge warn">Событие</span>'
              : '<span class="badge">Цель</span>';

          return `
            <div class="map-node">
              <div>
                <div>${kindBadge}<strong>${t.name}</strong></div>
                <div class="muted">${t.realm} • Дист: ${t.distanceTiles} (~${marchSec}с) • Гарнизон: ${scouted ? defTotal : `~${defTotal}`}</div>
                ${
                  scouted
                    ? `<div class="muted">Разведка: Л(${t.defense.left.melee}м/${t.defense.left.ranged}л) Ц(${t.defense.center.melee}м/${t.defense.center.ranged}л/${t.defense.center.siege}о) П(${t.defense.right.melee}м/${t.defense.right.ranged}л)</div>`
                    : `<div class="muted">Трофеи: Д:${t.loot.wood} К:${t.loot.stone} Е:${t.loot.food} М:${t.loot.gold}</div>`
                }
                ${
                  t.choiceReward
                    ? `<div class="row" style="margin-top:6px;">
                        <button class="mini-btn" data-diplomacy="${t.id}" type="button">Переговоры (+${t.choiceReward.gold}м, +${t.choiceReward.food}е)</button>
                      </div>`
                    : ''
                }
              </div>
              <button class="action-btn" data-select-target="${t.id}" type="button">К атаке</button>
            </div>
          `;
        })
        .join('')}
    </div>

    <div class="card">
      <h3>Активные марши (${state.marches.length})</h3>
      ${
        state.marches.length === 0
          ? '<p class="muted">Свободных походов сейчас нет.</p>'
          : state.marches
              .map((m) => {
                const target = BALANCE.mapTargets.find((x) => x.id === m.targetId);
                const leftSec = Math.max(0, Math.ceil((m.arrivesAt - now) / 1000));
                const kindLabel = m.kind === 'attack' ? 'Поход на цель' : 'Возврат в замок';
                return `<p class="muted">${kindLabel} → ${target?.name || m.targetId}: <strong>${leftSec}с</strong></p>`;
              })
              .join('')
      }
    </div>
  `;

  container.querySelectorAll('[data-select-target]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.selectedTargetId = btn.dataset.selectTarget;
      pushLog(state, `Выбрана цель: ${BALANCE.mapTargets.find((x) => x.id === state.selectedTargetId)?.name}`);
      sound.click();
      onMutate();
      if (onGoBattle) onGoBattle();
    });
  });

  container.querySelectorAll('[data-diplomacy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = BALANCE.mapTargets.find((x) => x.id === btn.dataset.diplomacy);
      if (!target || !target.choiceReward) return;
      state.resources.gold += target.choiceReward.gold || 0;
      state.resources.food += target.choiceReward.food || 0;
      pushLog(state, `Дипломатия у "${target.name}": получены ресурсы без боя.`);
      sound.success();
      onMutate();
    });
  });
                                             }
