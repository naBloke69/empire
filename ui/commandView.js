import { BALANCE } from '../config/balance.js';
import { pushLog } from '../core/state.js';
import { sound } from '../audio/sound.js';

export function renderCommandView(container, state, onMutate) {
  const friends = state.friends || [];

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

    <div class="card">
      <h3>Снаряжение и самоцветы</h3>
      ${BALANCE.equipmentPool
        .map((eq) => {
          const equipped = (state.equippedIds || []).includes(eq.id);
          return `
            <div class="map-node">
              <div>
                <strong>${eq.name}</strong>
                <div class="muted">${eq.bonusText}</div>
              </div>
              <button class="mini-btn ${equipped ? 'gold' : ''}" data-equip="${eq.id}" type="button">
                ${equipped ? 'Надето' : 'Надеть'}
              </button>
            </div>
          `;
        })
        .join('')}
    </div>

    <div class="card">
      <h3>Союзники и друзья (${friends.length})</h3>
      ${friends
        .map(
          (fname) => `
          <div class="map-node">
            <div>
              <strong>${fname}</strong> <span class="muted">• 🟢 В сети</span>
              <div class="muted">Отправка каравана поддержки союзнику</div>
            </div>
            <button class="mini-btn gold" data-send-caravan="${fname}" type="button">
              Обоз (🪙50)
            </button>
          </div>
        `
        )
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

  container.querySelectorAll('[data-equip]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.equip;
      const list = new Set(state.equippedIds || []);
      if (list.has(id)) list.delete(id);
      else list.add(id);
      state.equippedIds = [...list];
      sound.click();
      onMutate();
    });
  });

  container.querySelectorAll('[data-send-caravan]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const fname = btn.dataset.sendCaravan;
      if ((state.resources.gold || 0) < 50) {
        pushLog(state, 'Нужно 50 монет для отправки обоза союзнику.');
        sound.alert();
        onMutate();
        return;
      }
      state.resources.gold -= 50;
      state.allianceWarPoints = (state.allianceWarPoints || 0) + 10;
      pushLog(state, `Отправлен торговый обоз союзнику ${fname} (+10 очков союза).`);
      sound.success();
      onMutate();
    });
  });
}
