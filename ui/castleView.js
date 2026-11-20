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

function isoToScreen(gx, gy, cx, cy) {
  const tileW = 68;
  const tileH = 34;
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
  const h = 14 + Math.min(24, lvl * 4);

  drawIsoDiamond(ctx, x, y + 6, 34, 17, 'rgba(0,0,0,0.32)');

  const palette = {
    keep: { top: '#e5b55c', left: '#9e7430', right: '#78551f', roof: '#b33939' },
    wall: { top: '#b2bec3', left: '#7f8fa6', right: '#636e72', roof: '#4b5563' },
    barracks: { top: '#d980fa', left: '#833471', right: '#6f1e51', roof: '#a3293d' },
    workshop: { top: '#f3a683', left: '#cf6a87', right: '#9b435c', roof: '#774936' },
    farm: { top: '#badc58', left: '#6ab04c', right: '#4b8a34', roof: '#e1b12c' },
    sawmill: { top: '#d19c66', left: '#8c5a2b', right: '#663f1c', roof: '#4e342e' },
    quarry: { top: '#95afc0', left: '#535c68', right: '#3b424c', roof: '#576574' },
    tavern: { top: '#7ed6df', left: '#22a6b3', right: '#167c87', roof: '#c23616' }
  }[slot.type] || { top: '#ccc', left: '#888', right: '#666', roof: '#933' };

  // Left wall
  ctx.beginPath();
  ctx.moveTo(x - 26, y);
  ctx.lineTo(x, y + 13);
  ctx.lineTo(x, y + 13 - h);
  ctx.lineTo(x - 26, y - h);
  ctx.closePath();
  ctx.fillStyle = palette.left;
  ctx.fill();

  // Right wall
  ctx.beginPath();
  ctx.moveTo(x + 26, y);
  ctx.lineTo(x, y + 13);
  ctx.lineTo(x, y + 13 - h);
  ctx.lineTo(x + 26, y - h);
  ctx.closePath();
  ctx.fillStyle = palette.right;
  ctx.fill();

  // Roof
  drawIsoDiamond(ctx, x, y - h, 26, 13, palette.top, '#1e272e');

  // Keep spire
  if (slot.type === 'keep') {
    ctx.beginPath();
    ctx.moveTo(x, y - h - 18);
    ctx.lineTo(x + 12, y - h - 2);
    ctx.lineTo(x - 12, y - h - 2);
    ctx.closePath();
    ctx.fillStyle = palette.roof;
    ctx.fill();
  }

  if (isSelected) {
    drawIsoDiamond(ctx, x, y + 4, 38, 19, 'rgba(255, 215, 100, 0.14)', '#ffd166');
  }

  // Badge label
  const shortName = BALANCE.buildings[slot.type].name.split(' ')[0];
  ctx.font = 'bold 10px system-ui, sans-serif';
  const label = isBuilding ? `🔨 ${shortName}` : `${shortName} ур.${lvl}`;
  const tw = ctx.measureText(label).width + 10;
  ctx.fillStyle = 'rgba(13, 18, 25, 0.85)';
  ctx.fillRect(x - tw / 2, y + 14, tw, 15);
  ctx.fillStyle = isSelected ? '#ffd166' : '#f1f2f6';
  ctx.textAlign = 'center';
  ctx.fillText(label, x, y + 25);
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
  const cy = h / 2 + 12;

  // Moat & outer fortress courtyard
  drawIsoDiamond(ctx, cx, cy + 4, 196, 98, 'rgba(32, 118, 168, 0.45)', '#4ea8de');
  drawIsoDiamond(ctx, cx, cy + 2, 174, 87, 'rgba(255, 240, 200, 0.12)', '#95a5a6');

  // Sort slots back-to-front by (gx + gy)
  const sorted = [...state.slots].sort((a, b) => a.gx + a.gy - (b.gx + b.gy));
  const hitBoxes = [];

  for (const slot of sorted) {
    const pos = isoToScreen(slot.gx, slot.gy, cx, cy);
    const isSelected = slot.id === state.selectedSlotId;
    const isBuilding = state.buildQueue?.slotId === slot.id;
    drawBuildingSprite(ctx, slot, pos, isSelected, isBuilding);
    hitBoxes.push({ id: slot.id, x: pos.x, y: pos.y });
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
      <canvas id="castle-canvas" width="480" height="270"></canvas>
      <div class="canvas-overlay-top">
        <span class="pill">🏰 ${BALANCE.realms[state.activeRealm]?.name}</span>
        <span class="pill">🌊 Волн атаки: ${wavesCount} • 🛡️ Стены: +${Math.round(econ.wallDefenseBonus * 100)}%</span>
      </div>
    </div>

    <div class="card">
      <h3>${cfg.name} (Ур. ${slot.level} → ${nextLevel})</h3>
      <p class="muted">${cfg.desc}</p>
      <p class="muted">Цена: 🪵${cost.wood || 0} 🪨${cost.stone || 0} 🪙${cost.gold || 0} • Время: ${timeSec}с • ${buildStatusText}</p>
      <div class="row">
        <button id="btn-upgrade" class="action-btn" ${!affordable || busyBuild ? 'disabled' : ''} type="button">
          Улучшить до ур. ${nextLevel}
        </button>
      </div>
    </div>

    <div class="card">
      <h3>Казармы — Найм армии</h3>
      <p class="muted">${trainStatusText}</p>
      <div class="row">
        ${Object.entries(BALANCE.units)
          .map(([uKey, uCfg]) => {
            const cnt = 5;
            const uCost = {
              gold: (uCfg.cost.gold || 0) * cnt,
              food: (uCfg.cost.food || 0) * cnt
            };
            const canTrain = !state.trainQueue && canAfford(state.resources, uCost);
            return `
              <button class="action-btn secondary" data-train-unit="${uKey}" ${canTrain ? '' : 'disabled'} type="button">
                +5 ${uCfg.name} (🪙${uCost.gold})
              </button>
            `;
          })
          .join('')}
      </div>
    </div>

    <div class="card">
      <h3>Осадная мастерская — Орудия штурма</h3>
      <p class="muted">В наличии: Лестницы ${state.tools.ladder || 0} • Тараны ${state.tools.ram || 0} • Щиты ${state.tools.mantlet || 0}</p>
      <div class="row">
        ${Object.entries(BALANCE.tools)
          .map(([tKey, tCfg]) => {
            const cnt = 4;
            const tCost = {
              wood: (tCfg.cost.wood || 0) * cnt,
              stone: (tCfg.cost.stone || 0) * cnt,
              gold: (tCfg.cost.gold || 0) * cnt
            };
            const canCraft = !state.trainQueue && canAfford(state.resources, tCost);
            return `
              <button class="action-btn secondary" data-craft-tool="${tKey}" ${canCraft ? '' : 'disabled'} type="button">
                +4 ${tCfg.name}
              </button>
            `;
          })
          .join('')}
      </div>
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
      let bestDist = 42;
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
      const count = 5;
      const uCost = { gold: (uCfg.cost.gold || 0) * count, food: (uCfg.cost.food || 0) * count };
      if (state.trainQueue || !canAfford(state.resources, uCost)) return;
      for (const [k, v] of Object.entries(uCost)) state.resources[k] -= v;
      const speedDiv = 1 + Math.max(0, econ.trainSpeedBonus);
      const quickDiv = state.quickMode ? BALANCE.quickModeMultiplier : 1;
      const totalSec = Math.max(2, Math.round((uCfg.trainSec * count) / speedDiv / quickDiv));
      state.trainQueue = {
        category: 'unit',
        itemKey: uKey,
        count,
        totalEndsAt: Date.now() + totalSec * 1000
      };
      pushLog(state, `Казармы: начат найм ${count}x ${uCfg.name}`);
      sound.click();
      onMutate();
    });
  });

  container.querySelectorAll('[data-craft-tool]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tKey = btn.dataset.craftTool;
      const tCfg = BALANCE.tools[tKey];
      const count = 4;
      const tCost = {
        wood: (tCfg.cost.wood || 0) * count,
        stone: (tCfg.cost.stone || 0) * count,
        gold: (tCfg.cost.gold || 0) * count
      };
      if (state.trainQueue || !canAfford(state.resources, tCost)) return;
      for (const [k, v] of Object.entries(tCost)) state.resources[k] -= v;
      const quickDiv = state.quickMode ? BALANCE.quickModeMultiplier : 1;
      const totalSec = Math.max(2, Math.round(8 / quickDiv));
      state.trainQueue = {
        category: 'tool',
        itemKey: tKey,
        count,
        totalEndsAt: Date.now() + totalSec * 1000
      };
      pushLog(state, `Мастерская: заказано ${count}x ${tCfg.name}`);
      sound.click();
      onMutate();
    });
  });
}
