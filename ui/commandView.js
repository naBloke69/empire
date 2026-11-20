import { BALANCE } from '../config/balance.js';
import { getMarchDurationMs } from '../core/timeEngine.js';
import { pushLog } from '../core/state.js';
import { sound } from '../audio/sound.js';

export function renderCommandView(container, state, onMutate) {
  const planTarget = BALANCE.mapTargets.find((t) => t.id === state.alliancePlanTargetId) || BALANCE.mapTargets[0];
  const marchSec = Math.round(getMarchDurationMs(state, planTarget.distanceTiles) / 1000);
  const launchInSec = Math.max(5, (state.allianceTargetOffsetSec || 30) - marchSec);

  container.innerHTML = `
    <div class="card">
      <h3>Командиры похода</h3>
      ${BALANCE.commanders
        .map((c) => {
          const active = c.id === state.activeCommanderId;
          return `
            <div class="map-node">
              <div>
                <strong>${c.name}</strong> — <span class="muted">${c.perkName}</span>
                <div class="muted">${c.perkDesc}</div>
              </div>
              <button class="mini-btn" data-cmd="${c.id}" type="button">${active ? 'Активен' : 'Выбрать'}</button>
            </div>
          `;
        })
        .join('')}
    </div>

    <div class="card">
      <h3>Кастеляны замка</h3>
      ${BALANCE.castellans
        .map((c) => {
          const active = c.id === state.activeCastellanId;
          return `
            <div class="map-node">
              <div>
                <strong>${c.name}</strong> — <span class="muted">${c.perkName}</span>
                <div class="muted">${c.perkDesc}</div>
              </div>
              <button class="mini-btn" data-cast="${c.id}" type="button">${active ? 'Активен' : 'Выбрать'}</button>
            </div>
          `;
        })
        .join('')}
    </div>

    <div class="card">
      <h3>Планёр общей атаки альянса</h3>
      <label class="muted">Цель операции
        <select id="plan-target">
          ${BALANCE.mapTargets
            .map((t) => `<option value="${t.id}" ${t.id === planTarget.id ? 'selected' : ''}>${t.name} (${t.realm})</option>`)
            .join('')}
        </select>
      </label>
      <label class="muted" style="display:block; margin-top:8px;">Окно удара через (сек)
        <input id="plan-offset" type="number" min="15" max="600" value="${state.allianceTargetOffsetSec || 30}" />
      </label>
      <p class="muted" style="margin-top:8px;">
        Ваш марш: ~${marchSec}с. Рекомендуемый старт вашего отряда: через <strong>${launchInSec}с</strong>.
      </p>
      <button id="btn-share-plan" class="action-btn secondary" type="button">Зафиксировать метку в журнале</button>
    </div>
  `;

  container.querySelectorAll('[data-cmd]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.activeCommanderId = btn.dataset.cmd;
      const c = BALANCE.commanders.find((x) => x.id === state.activeCommanderId);
      pushLog(state, `Назначен командир: ${c?.name}`);
      sound.click();
      onMutate();
    });
  });

  container.querySelectorAll('[data-cast]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.activeCastellanId = btn.dataset.cast;
      const c = BALANCE.castellans.find((x) => x.id === state.activeCastellanId);
      pushLog(state, `Назначен кастелян: ${c?.name}`);
      sound.click();
      onMutate();
    });
  });

  container.querySelector('#plan-target')?.addEventListener('change', (e) => {
    state.alliancePlanTargetId = e.target.value;
    sound.click();
    onMutate();
  });

  container.querySelector('#plan-offset')?.addEventListener('change', (e) => {
    state.allianceTargetOffsetSec = Math.max(15, parseInt(e.target.value || '30', 10) || 30);
    onMutate();
  });

  container.querySelector('#btn-share-plan')?.addEventListener('click', () => {
    pushLog(
      state,
      `План альянса по "${planTarget.name}": старт через ${launchInSec}с (марш ~${marchSec}с).`
    );
    sound.click();
    onMutate();
  });
}

