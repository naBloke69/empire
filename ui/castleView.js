import { BALANCE } from '../config/balance.js';
import {
  canAfford,
  getBuildingCost,
  getBuildingTimeSec,
  getEconomyStats,
  getMaxAttackWaves
} from '../core/economy.js';
import { pushLog } from '../core/state.js';
import { sound } from '../audio/sound.js';

let batchCount = 5;

function isoToScreen(gx, gy, cx, cy) {
  const tileW = 64;
  const tileH = 31;
  return {
    x: cx + (gx - gy) * tileW,
    y: cy + (gx + gy) * tileH
  };
}

function drawIsoDiamond(ctx, x, y, w, h, fill, stroke = null) {
  ctx.beginPath();
  ctx.moveTo(x, y - h);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x - w, y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function drawBuildingSprite(ctx, slot, pos, isSelected, isBuilding) {
  const { x, y } = pos;
  const lvl = slot.level;
  const h = 13 + Math.min(22, lvl * 3.5);

  drawIsoDiamond(ctx, x, y + 5, 30, 15, 'rgba(0,0,0,0.36)');

  const palette = {
    keep: { top: '#f5be48', left: '#9e7430', right: '#78551f', roof: '#c43b3b' },
    wall: { top: '#c6d2d8', left: '#7f8fa6', right: '#636e72', roof: '#4b5563' },
    barracks: { top: '#e29aff', left: '#833471', right: '#6f1e51', roof: '#a3293d' },
    workshop: { top: '#f7b290', left: '#cf6a87', right: '#9b435c', roof: '#774936' },
    farm: { top: '#c8ec68', left: '#6ab04c', right: '#4b8a34', roof: '#e1b12c' },
    sawmill: { top: '#dfa972', left: '#8c5a2b', right: '#663f1c', roof: '#4e342e' },
    quarry: { top: '#a7c2d4', left: '#535c68', right: '#3b424c', roof: '#576574' },
    tavern: { top: '#8be6ee', left: '#22a6b3', right: '#167c87', roof: '#c23616' }
  }[slot.type] || { top: '#ccc', left: '#888', right: '#666', roof: '#933' };

  ctx.beginPath();
  ctx.moveTo(x - 23, y);
  ctx.lineTo(x, y + 11.5);
  ctx.lineTo(x, y + 11.5 - h);
  ctx.lineTo(x - 23, y - h);
  ctx.closePath();
  ctx.fillStyle = palette.left;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + 23, y);
  ctx.lineTo(x, y + 11.5);
  ctx.lineTo(x, y + 11.5 - h);
  ctx.lineTo(x + 23, y - h);
  ctx.closePath();
  ctx.fillStyle = palette.right;
  ctx.fill();

  drawIsoDiamond(ctx, x, y - h, 23, 11.5, palette.top, '#1b222c');

  if (slot.type === 'keep') {
    ctx.beginPath();
    ctx.moveTo(x, y - h - 16);
    ctx.lineTo(x + 11, y - h - 2);
    ctx.lineTo(x - 11, y - h - 2);
    ctx.closePath();
    ctx.fillStyle = palette.roof;
    ctx.fill();
  }

  if (isSelected) {
    drawIsoDiamond(ctx, x, y + 3, 35, 17.5, 'rgba(255, 227, 153, 0.16)', '#ffe399');
  }

  const shortMap = {
    keep: 'Цитадель',
    wall: 'Стены',
    barracks: 'Казармы',
    workshop: 'Осадная',
    farm: 'Ферма',
    sawmill: 'Лесопилка',
    quarry: 'Каменоломня',
    tavern: 'Таверна'
  };
  const shortName = shortMap[slot.type] || BALANCE.buildings[slot.type].name.split(' ')[0];
  ctx.font = 'bold 9.5px system-ui, sans-serif';
  const label = isBuilding ? `🔨 ${shortName}` : `${shortName} ур.${lvl}`;
  const tw = ctx.measureText(label).width + 8;
  const badgeY = y + 13;
  ctx.fillStyle = 'rgba(11, 15, 22, 0.88)';
  ctx.fillRect(x - tw / 2, badgeY, tw, 14);
  ctx.strokeStyle = isSelected ? '#ffe399' : 'rgba(245, 190, 72, 0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - tw / 2, badgeY, tw, 14);
  ctx.fillStyle = isSelected ? '#ffe399' : '#f4f6fa';
  ctx.textAlign = 'center';
  ctx.fillText(label, x, badgeY + 10.5);
}

function drawCastleCanvas(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const realm = BALANCE.realms[state.activeRealm] || BALANCE.realms.great_empire;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, realm.groundTop);
  grad.addColorStop(1, realm.groundBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 + 8;

  drawIsoDiamond(ctx, cx, cy + 4, 212, 102, 'rgba(28, 110, 158, 0.44)', '#5bc0eb');
  drawIsoDiamond(ctx, cx, cy + 2, 190, 91, 'rgba(255, 240, 200, 0.12)', '#f5be48');

  const sorted = [...state.slots].sort((a, b) => a.gx + a.gy - (b.gx + b.gy));
  const hitBoxes = [];

  for (const slot of sorted) {
    const pos = isoToScreen(slot.gx, slot.gy, cx, cy);
    const isSelected = slot.id === state.selectedSlotId;
    const isBuilding = state.buildQueue?.slotId === slot.id;
    drawBuildingSprite(ctx, slot, pos, isSelected, isBuilding);
    hitBoxes.push({ id: slot.id, x: pos.x, y: pos.y });
  }

  if ((state.castleFireDamage || 0) > 0) {
    ctx.font = '16px system-ui, sans-serif';
    for (let i = 0; i < state.castleFireDamage; i++) {
      ctx.fillText('🔥', cx - 60 + i * 30, cy - 38 + (i % 2) * 14);
    }
  }

  canvas._hitBoxes = hitBoxes;
}

export function renderCastleView(container, state, onMutate) {
  const now = Date.now();
  const econ = getEconomyStats(state);
  const slot = state.slots.find((s) => s.id === state.selectedSlotId) || state.slots[0];
  const cfg = BALANCE.buildings[slot.type];
  const nextLevel = slot.level + 1;
  const cost = getBuildingCost(slot.type, nextLevel);
  const timeSec = getBuildingTimeSec(slot.type, nextLevel, state);
  const affordable = canAfford(state.resources, cost);
  const busyBuild = Boolean(state.buildQueue);
  const wavesCount = getMaxAttackWaves(state);
  const fireCount = state.castleFireDamage || 0;
  const repairCost = { wood: fireCount * 70, stone: fireCount * 70, gold: fireCount * 50 };
  const shieldActive = (state.shieldUntil || 0) > now;

  const buildStatusText = state.buildQueue
    ? `Строится: ${BALANCE.buildings[state.buildQueue.type]?.name} → ур.${state.buildQueue.targetLevel} (${Math.max(0, Math.ceil((state.buildQueue.endsAt - now) / 1000))}с)`
    : 'Слот стройки свободен';

  const trainStatusText = state.trainQueue
    ? `Очередь: ${state.trainQueue.count}x ${
        state.trainQueue.category === 'unit'
          ? BALANCE.units[state.trainQueue.itemKey]?.name
          : BALANCE.tools[state.trainQueue.itemKey]?.name
      } (${Math.max(0, Math.ceil((state.trainQueue.totalEndsAt - now) / 1000))}с)`
    : 'Казармы и мастерская свободны';

  container.innerHTML = `
    <div class="canvas-wrap">
      <canvas id="castle-canvas" width="500" height="286"></canvas>
      <div class="canvas-overlay-top">
        <span class="pill">🏰 ${BALANCE.realms[state.activeRealm]?.name}</span>
        <span class="pill">🌊 Волн: ${wavesCount} • 🛡️ Стены: +${Math.round(econ.wallDefenseBonus * 100)}%</span>
      </div>
    </div>

    ${
      fireCount > 0
        ? `
      <div class="card alert-fire">
        <h3>🔥 Очаги пожара в замке: ${fireCount}</h3>
        <p class="muted">Снижают добычу и порядок. Ремонт: 🪵${repairCost.wood} 🪨${repairCost.stone} 🪙${repairCost.gold}</p>
        <button id="btn-repair-fire" class="action-btn danger" ${canAfford(state.resources, repairCost) ? '' : 'disabled'} type="button">
          Потушить и восстановить замок
        </button>
      </div>
    `
        : ''
    }

    <div class="card">
      <h3>${cfg.name} (Ур. ${slot.level} → ${nextLevel})</h3>
      <p class="muted">${cfg.desc}</p>
      <p class="muted">Цена: 🪵${cost.wood || 0} 🪨${cost.stone || 0} 🪙${cost.gold || 0} • Время: ${timeSec}с • ${buildStatusText}</p>
      <div class="row">
        <button id="btn-upgrade" class="action-btn ${affordable && !busyBuild ? 'ready-glow' : ''}" ${!affordable || busyBuild ? 'disabled' : ''} type="button">
          Улучшить до ур. ${nextLevel}
        </button>
        ${
          busyBuild
            ? `<button id="btn-rush-build" class="mini-btn ruby" ${(state.resources.rubies || 0) >= 10 ? '' : 'disabled'} type="button">Ускорить (10💎)</button>`
            : ''
        }
        <button id="btn-buy-shield" class="mini-btn ${shieldActive ? 'ok' : 'gold'}" type="button">
          ${shieldActive ? '🛡️ Щит активен' : '🛡️ Щит замка (20💎)'}
        </button>
      </div>
    </div>

    <div class="card">
      <h3>
        <span>Казармы — Найм армии</span>
        <span class="row" style="gap:4px;">
          ${[1, 5, 10]
            .map(
              (n) =>
                `<button class="mini-btn ${batchCount === n ? 'active-pill' : ''}" data-batch="${n}" type="button">+${n}</button>`
            )
            .join('')}
        </span>
      </h3>
      <p class="muted">${trainStatusText}</p>
      <div class="grid-3">
        ${Object.entries(BALANCE.units)
          .map(([uKey, uCfg]) => {
            const uCost = {
              gold: (uCfg.cost.gold || 0) * batchCount,
              food: (uCfg.cost.food || 0) * batchCount
            };
            const canTrain = !state.trainQueue && canAfford(state.resources, uCost);
            return `
              <button class="action-btn secondary ${canTrain ? 'ready-glow' : ''}" data-train-unit="${uKey}" ${canTrain ? '' : 'disabled'} type="button">
                +${batchCount} ${uCfg.name}<br><span class="muted">🪙${uCost.gold} 🌾${uCost.food}</span>
              </button>
            `;
          })
          .join('')}
      </div>
    </div>

    <div class="card">
      <h3>Осадная мастерская — Орудия штурма</h3>
      <p class="muted">В наличии: Лестницы ${state.tools.ladder || 0} • Тараны ${state.tools.ram || 0} • Щиты ${state.tools.mantlet || 0}</p>
      <div class="grid-3">
        ${Object.entries(BALANCE.tools)
          .map(([tKey, tCfg]) => {
            const tCost = {
              wood: (tCfg.cost.wood || 0) * batchCount,
              stone: (tCfg.cost.stone || 0) * batchCount,
              gold: (tCfg.cost.gold || 0) * batchCount
            };
            const canCraft = !state.trainQueue && canAfford(state.resources, tCost);
            return `
              <button class="action-btn secondary ${canCraft ? 'ready-glow' : ''}" data-craft-tool="${tKey}" ${canCraft ? '' : 'disabled'} type="button">
                +${batchCount} ${tCfg.name.split(' ')[0]}<br><span class="muted">🪵${tCost.wood} 🪨${tCost.stone}</span>
              </button>
            `;
          })
          .join('')}
      </div>
    </div>

    <div class="card">
      <h3>Декор замка (Общественный порядок)</h3>
      ${BALANCE.decorItems
        .map((dec) => {
          const owned = (state.ownedDecorIds || []).includes(dec.id);
          const ok = !owned && canAfford(state.resources, dec.cost);
          return `
            <div class="map-node">
              <div>
                <strong>${dec.name}</strong>
                <div class="muted">+${dec.orderBonus} порядок • Цена: 🪵${dec.cost.wood || 0} 🪨${dec.cost.stone || 0} 🪙${dec.cost.gold || 0} 💎${dec.cost.rubies || 0}</div>
              </div>
              <button class="mini-btn ${owned ? 'ok' : 'gold'}" data-decor="${dec.id}" ${owned || !ok ? 'disabled' : ''} type="button">
                ${owned ? 'Установлен' : 'Купить'}
              </button>
            </div>
          `;
        })
        .join('')}
    </div>
  `;

  const canvas = container.querySelector('#castle-canvas');
  if (canvas) {
    drawCastleCanvas(canvas, state);
    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      let best = null;
      let bestDist = 52;
      for (const box of canvas._hitBoxes || []) {
        const d = Math.hypot(clickX - box.x, clickY - box.y);
        if (d < bestDist) {
          bestDist = d;
          best = box.id;
        }
      }
      if (best) {
        state.selectedSlotId = best;
        sound.click();
        onMutate();
      }
    });
  }

  container.querySelectorAll('[data-batch]').forEach((btn) => {
    btn.addEventListener('click', () => {
      batchCount = parseInt(btn.dataset.batch, 10) || 5;
      sound.click();
      onMutate();
    });
  });

  container.querySelector('#btn-buy-shield')?.addEventListener('click', () => {
    if ((state.resources.rubies || 0) < 20) {
      pushLog(state, 'Нужно 20 рубинов для активации щита замка.');
      sound.alert();
      onMutate();
      return;
    }
    state.resources.rubies -= 20;
    state.shieldUntil = Math.max(Date.now(), state.shieldUntil || 0) + 180000;
    pushLog(state, 'Активирован щит замка на 3 минуты!');
    sound.success();
    onMutate();
  });

  container.querySelector('#btn-rush-build')?.addEventListener('click', () => {
    if (!state.buildQueue || (state.resources.rubies || 0) < 10) return;
    state.resources.rubies -= 10;
    state.buildQueue.endsAt = Date.now();
    pushLog(state, 'Стройка мгновенно завершена за 10 рубинов!');
    sound.success();
    onMutate();
  });

  container.querySelector('#btn-repair-fire')?.addEventListener('click', () => {
    if (fireCount <= 0 || !canAfford(state.resources, repairCost)) return;
    for (const [k, v] of Object.entries(repairCost)) state.resources[k] -= v;
    state.castleFireDamage = 0;
    pushLog(state, 'Пожары потушены, укрепления замка восстановлены.');
    sound.success();
    onMutate();
  });

  container.querySelector('#btn-upgrade')?.addEventListener('click', () => {
    if (state.buildQueue || !canAfford(state.resources, cost)) return;
    for (const [k, v] of Object.entries(cost)) state.resources[k] -= v;
    state.buildQueue = {
      slotId: slot.id,
      type: slot.type,
      targetLevel: nextLevel,
      endsAt: Date.now() + timeSec * 1000
    };
    pushLog(state, `Начато строительство: "${cfg.name}" до ур. ${nextLevel}`);
    sound.click();
    onMutate();
  });

  container.querySelectorAll('[data-train-unit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const uKey = btn.dataset.trainUnit;
      const uCfg = BALANCE.units[uKey];
      const uCost = { gold: (uCfg.cost.gold || 0) * batchCount, food: (uCfg.cost.food || 0) * batchCount };
      if (state.trainQueue || !canAfford(state.resources, uCost)) return;
      for (const [k, v] of Object.entries(uCost)) state.resources[k] -= v;
      const speedDiv = 1 + Math.max(0, econ.trainSpeedBonus);
      const quickDiv = state.quickMode ? BALANCE.quickModeMultiplier : 1;
      const totalSec = Math.max(2, Math.round((uCfg.trainSec * batchCount) / speedDiv / quickDiv));
      state.trainQueue = {
        category: 'unit',
        itemKey: uKey,
        count: batchCount,
        totalEndsAt: Date.now() + totalSec * 1000
      };
      pushLog(state, `Казармы: начат найм ${batchCount}x ${uCfg.name}`);
      sound.click();
      onMutate();
    });
  });

  container.querySelectorAll('[data-craft-tool]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tKey = btn.dataset.craftTool;
      const tCfg = BALANCE.tools[tKey];
      const tCost = {
        wood: (tCfg.cost.wood || 0) * batchCount,
        stone: (tCfg.cost.stone || 0) * batchCount,
        gold: (tCfg.cost.gold || 0) * batchCount
      };
      if (state.trainQueue || !canAfford(state.resources, tCost)) return;
      for (const [k, v] of Object.entries(tCost)) state.resources[k] -= v;
      const quickDiv = state.quickMode ? BALANCE.quickModeMultiplier : 1;
      const totalSec = Math.max(2, Math.round((2 * batchCount + 4) / quickDiv));
      state.trainQueue = {
        category: 'tool',
        itemKey: tKey,
        count: batchCount,
        totalEndsAt: Date.now() + totalSec * 1000
      };
      pushLog(state, `Мастерская: заказано ${batchCount}x ${tCfg.name}`);
      sound.click();
      onMutate();
    });
  });

  container.querySelectorAll('[data-decor]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const dec = BALANCE.decorItems.find((x) => x.id === btn.dataset.decor);
      if (!dec || (state.ownedDecorIds || []).includes(dec.id) || !canAfford(state.resources, dec.cost)) return;
      for (const [k, v] of Object.entries(dec.cost)) state.resources[k] -= v;
      state.ownedDecorIds = [...(state.ownedDecorIds || []), dec.id];
      pushLog(state, `Установлен декор "${dec.name}" (+${dec.orderBonus} порядок)`);
      sound.success();
      onMutate();
    });
  });
}
