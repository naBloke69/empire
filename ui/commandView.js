import { BALANCE } from '../config/balance.js';
import { pushLog } from '../core/state.js';
import { sound } from '../audio/sound.js';

export function renderCommandView(container, state, onMutate) {
  container.innerHTML = `
    <div class="card">
      <h3>Командиры походов</h3>
      ${BALANCE.commanders
        .map((c) => {
          const active = c.id === state.activeCommanderId;
          return `
            <div class="map-node">
              <div>
                <strong>${c.name}</strong>
                <div class="muted">${c.perk}</div>
              </div>
              <button class="mini-btn ${active ? 'gold' : ''}" data-cmd="${c.id}" type="button">
                ${active ? 'Активен' : 'Выбрать'}
              </button>
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
                <strong>${c.name}</strong>
                <div class="muted">${c.perk}</div>
              </div>
              <button class="mini-btn ${active ? 'gold' : ''}" data-cast="${c.id}" type="button">
                ${active ? 'Активен' : 'Выбрать'}
              </button>
            </div>
          `;
        })
        .join('')}
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
}
