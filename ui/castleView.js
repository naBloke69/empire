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
  const tileW = 66;
  const tileH = 31;
  return {
    x: cx + (gx - gy) * tileW,
    y: cy + (gx + gy) * tileH
  };
}

function drawIsoDiamond(ctx, x, y, w, h, fill, stroke = null, lw = 1.5) {
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
    ctx.lineWidth = lw;
    ctx.stroke();
  }
}

function drawCastleFortressSprite(ctx, slot, pos, isSelected, isBuilding) {
  const { x, y } = pos;
  const lvl = slot.level;
  const wallH = 15 + Math.min(18, lvl * 3);
  const towerH = wallH + 14;

  drawIsoDiamond(ctx, x, y + 6, 36, 17, 'rgba(0,0,0,0.42)');

  const themes = {
    keep: { stoneL: '#b89f6d', stoneR: '#8b7447', roof: '#c92a2a', trim: '#ffd43b' },
    wall: { stoneL: '#9aa7b8', stoneR: '#6c7888', roof: '#495057', trim: '#dee2e6' },
    barracks: { stoneL: '#9c7864', stoneR: '#6e5141', roof: '#a61e4d', trim: '#fcc419' },
    workshop: { stoneL: '#8d7b68', stoneR: '#5e5042', roof: '#8c2d19', trim: '#ffa94d' },
    farm: { stoneL: '#8fa35e', stoneR: '#64753e', roof: '#e67700', trim: '#ffe066' },
    sawmill: { stoneL: '#9c6f44', stoneR: '#6b4a2b', roof: '#2b8a3e', trim: '#ffd43b' },
    quarry: { stoneL: '#8695a6', stoneR: '#596573', roof: '#364fc7', trim: '#ced4da' },
    tavern: { stoneL: '#9e7652', stoneR: '#6e4f33', roof: '#c2255c', trim: '#ffd43b' }
  };
  const th = themes[slot.type] || themes.keep;

  // Крепостной корпус (левая и правая стены)
  ctx.beginPath();
  ctx.moveTo(x - 24, y);
  ctx.lineTo(x, y + 12);
  ctx.lineTo(x, y + 12 - wallH);
  ctx.lineTo(x - 24, y - wallH);
  ctx.closePath();
  ctx.fillStyle = th.stoneL;
  ctx.fill();
  ctx.strokeStyle = '#1d2430';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + 24, y);
  ctx.lineTo(x, y + 12);
  ctx.lineTo(x, y + 12 - wallH);
  ctx.lineTo(x + 24, y - wallH);
  ctx.closePath();
  ctx.fillStyle = th.stoneR;
  ctx.fill();
  ctx.stroke();

  // Зубцы стен по краям
  ctx.fillStyle = th.trim;
  for (let i = -2; i <= 2; i += 2) {
    ctx.fillRect(x + i * 7 - 2, y + 8 - wallH - 3, 4, 3);
  }

  // Центральная башня цитадели или строения
  const bW = slot.type === 'keep' ? 14 : 11;
  ctx.beginPath();
  ctx.moveTo(x - bW, y - 4);
  ctx.lineTo(x, y + 2);
  ctx.lineTo(x, y + 2 - towerH);
  ctx.lineTo(x - bW, y - towerH);
  ctx.closePath();
  ctx.fillStyle = th.stoneL;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + bW, y - 4);
  ctx.lineTo(x, y + 2);
  ctx.lineTo(x, y + 2 - towerH);
  ctx.lineTo(x + bW, y - towerH);
  ctx.closePath();
  ctx.fillStyle = th.stoneR;
  ctx.fill();

  // Шатровая крыша башни
  ctx.beginPath();
  ctx.moveTo(x, y - towerH - 15);
  ctx.lineTo(x + bW + 4, y - towerH + 1);
  ctx.lineTo(x - bW - 4, y - towerH + 1);
  ctx.closePath();
  ctx.fillStyle = th.roof;
  ctx.fill();
  ctx.strokeStyle = '#1b2028';
  ctx.stroke();

  // Флаг на вершине башни
  ctx.strokeStyle = '#ffe69e';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y - towerH - 15);
  ctx.lineTo(x, y - towerH - 24);
  ctx.stroke();

  ctx.fillStyle = slot.type === 'keep' ? '#ffd43b' : th.roof;
  ctx.beginPath();
  ctx.moveTo(x, y - towerH - 24);
  ctx.lineTo(x + 11, y - towerH - 20);
  ctx.lineTo(x, y - towerH - 16);
  ctx.closePath();
  ctx.fill();

  if (isSelected) {
    drawIsoDiamond(ctx, x, y + 3, 38, 18.5, 'rgba(255, 230, 158, 0.16)', '#ffe69e', 2);
  }

  const shortMap = {
    keep: 'Цитадель',
    wall: 'Стены',
    barracks: 'Казармы',
    workshop: 'Осадный двор',
    farm: 'Ферма',
    sawmill: 'Лесопилка',
    quarry: 'Каменоломня',
    tavern: 'Таверна'
  };
  const shortName = shortMap[slot.type] || BALANCE.buildings[slot.type].name.split(' ')[0];
  ctx.font = 'bold 9.5px system-ui, sans-serif';
  const label = isBuilding ? `🔨 ${shortName} → ур.${lvl + 1}` : `${shortName} ур.${lvl}`;
  const tw = ctx.measureText(label).width + 8;
  const badgeY = y + 14;
  ctx.fillStyle = 'rgba(10, 14, 21, 0.9)';
  ctx.fillRect(x - tw / 2, badgeY, tw, 14);
  ctx.strokeStyle = isSelected ? '#ffe69e' : 'rgba(245, 190, 72, 0.42)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - tw / 2, badgeY, tw, 14);
  ctx.fillStyle = isSelected ? '#ffe69e' : '#f8f5ec';
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

  // Внешний ров с водой и крепостной контур
  drawIsoDiamond(ctx, cx, cy + 4, 216, 104, 'rgba(24, 105, 152, 0.48)', '#68c8f5', 1.5);
  drawIsoDiamond(ctx, cx, cy + 2, 194, 93, 'rgba(255, 236, 185, 0.14)', '#f5be48', 1.5);

  const sorted = [...state.slots].sort((a, b) => a.gx + a.gy - (b.gx + b.gy));
  const hitBoxes = [];

  for (const slot of sorted) {
    const pos = isoToScreen(slot.gx, slot.gy, cx, cy);
    const isSelected = slot.id === state.selectedSlotId;
    const isBuilding = state.buildQueue?.slotId === slot.id;
    drawCastleFortressSprite(ctx, slot, pos, isSelected, isBuilding);
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
    : 'Казармы и осадный двор свободны';

  container.innerHTML = `
    <div class="canvas-wrap">
      <canvas id="castle-canvas" width="500" height="288"></canvas>
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
          ${shieldActive ? '🛡️ Щит активен' : '🛡️ Щит (20💎)'}
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
      <h3>Осадный двор — Орудия штурма</h3>
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
      let bestDist = 54;
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
      pushLog(state, `Осадный двор: заказано ${batchCount}x ${tCfg.name}`);
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
