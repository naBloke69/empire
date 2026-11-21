import { BALANCE } from '../config/balance.js';
import { pushLog } from '../core/state.js';
import { sound } from '../audio/sound.js';

let socialSubTab = 'alliance';

export function renderCommandView(container, state, onMutate) {
  const friends = state.friends || [];
  const allChat = socialSubTab === 'global' ? state.globalChat || [] : state.allianceChat || [];

  container.innerHTML = `
    <div class="subtabs">
      <button class="mini-btn ${socialSubTab === 'alliance' ? 'gold' : ''}" data-stab="alliance" type="button">🛡️ Альянс и чат</button>
      <button class="mini-btn ${socialSubTab === 'global' ? 'gold' : ''}" data-stab="global" type="button">🌐 Общий чат</button>
      <button class="mini-btn ${socialSubTab === 'friends' ? 'gold' : ''}" data-stab="friends" type="button">🤝 Друзья и списки</button>
      <button class="mini-btn ${socialSubTab === 'heroes' ? 'gold' : ''}" data-stab="heroes" type="button">👑 Герои</button>
    </div>

    ${
      socialSubTab === 'alliance'
        ? `
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
        ${allChat
          .slice(0, 6)
          .map((m) => `<p class="muted"><strong>${m.author}:</strong> ${m.text}</p>`)
          .join('')}
        <div class="row" style="margin-top:6px;">
          <input id="chat-input" type="text" placeholder="Сообщение в чат союза..." />
          <button id="btn-send-chat" class="action-btn" type="button">Отправить</button>
        </div>
      </div>
    `
        : ''
    }

    ${
      socialSubTab === 'global'
        ? `
      <div class="card">
        <h3>Общий чат королевств</h3>
        ${allChat
          .slice(0, 8)
          .map((m) => `<p class="muted"><strong>${m.author}:</strong> ${m.text}</p>`)
          .join('')}
        <div class="row" style="margin-top:6px;">
          <input id="chat-input" type="text" placeholder="Написать в общий чат..." />
          <button id="btn-send-chat" class="action-btn" type="button">Отправить</button>
        </div>
      </div>
    `
        : ''
    }

    ${
      socialSubTab === 'friends'
        ? `
      <div class="card">
        <h3>Друзья и союзники (${friends.length})</h3>
        <div class="row" style="margin-bottom:8px;">
          <input id="new-friend-input" type="text" placeholder="Имя лорда для добавления..." />
          <button id="btn-add-friend" class="mini-btn gold" type="button">+ Добавить</button>
        </div>
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

      <div class="card">
        <h3>Список игроков и альянсов сервера</h3>
        ${BALANCE.rivals
          .map(
            (r) => `
          <div class="map-node">
            <div>
              <strong>${r.name}</strong> <span class="muted">• Альянс: ${r.alliance}</span>
              <div class="muted">Мощь: ${r.power} • ${r.online ? '🟢 В сети' : '⚪ Оффлайн'} • ${r.shielded ? '🛡️ Щит' : '⚔️ Открыт для рейдов'}</div>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    `
        : ''
    }

    ${
      socialSubTab === 'heroes'
        ? `
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
    `
        : ''
    }
  `;

  container.querySelectorAll('[data-stab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      socialSubTab = btn.dataset.stab;
      sound.click();
      onMutate();
    });
  });

  container.querySelector('#btn-send-chat')?.addEventListener('click', () => {
    const inp = container.querySelector('#chat-input');
    const txt = (inp?.value || '').trim();
    if (!txt) return;
    const msgObj = { id: `m_${Date.now()}`, author: state.accountName || 'Лорд Stezzy', text: txt };
    if (socialSubTab === 'global') state.globalChat = [msgObj, ...(state.globalChat || [])];
    else state.allianceChat = [msgObj, ...(state.allianceChat || [])];
    sound.click();
    onMutate();
  });

  container.querySelector('#btn-add-friend')?.addEventListener('click', () => {
    const inp = container.querySelector('#new-friend-input');
    const name = (inp?.value || '').trim();
    if (!name) return;
    state.friends = [...new Set([...(state.friends || []), name])];
    pushLog(state, `Лорд "${name}" добавлен в друзья.`);
    sound.success();
    onMutate();
  });

  container.querySelector('#btn-join-rally')?.addEventListener('click', () => {
    const avail = state.troops.maceman || 0;
    const take = Math.min(15, avail);
    if (take <= 0) {
      pushLog(state, 'Нет свободных булавщиков для присоединения к сбору.');
      sound.alert();
      onMutate();
      return;
    }
    state.troops.maceman -= take;
    state.rallyJoinedTroops = (state.rallyJoinedTroops || 0) + take;
    state.allianceWarPoints = (state.allianceWarPoints || 0) + 15;
    pushLog(state, `Вы присоединились к общему сбору альянса (+${take} бойцов, +15 очков войны).`);
    sound.success();
    onMutate();
  });

  container.querySelector('#btn-share-coord')?.addEventListener('click', () => {
    const t = BALANCE.mapTargets.find((x) => x.id === state.selectedTargetId) || BALANCE.mapTargets[0];
    state.allianceChat = [
      { id: `c_${Date.now()}`, author: state.accountName || 'Лорд Stezzy', text: `Цель для атаки: ${t.name} (${BALANCE.realms[t.realm]?.name})` },
      ...(state.allianceChat || [])
    ];
    pushLog(state, `Метка "${t.name}" отправлена в чат альянса.`);
    sound.click();
    onMutate();
  });

  container.querySelector('#btn-donate-alliance')?.addEventListener('click', () => {
    if ((state.resources.gold || 0) < 50) {
      pushLog(state, 'Не хватает монет для взноса в альянс (нужно 50).');
      sound.alert();
      onMutate();
      return;
    }
    state.resources.gold -= 50;
    state.allianceTreasury = (state.allianceTreasury || 0) + 50;
    pushLog(state, 'Внесено 50 монет в казну альянса.');
    sound.success();
    onMutate();
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
          onMutate();
          return;
        }
        state.allianceTreasury -= perk.costGold;
        set.add(pId);
      }
      state.activeAlliancePerks = [...set];
      sound.click();
      onMutate();
    });
  });

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
