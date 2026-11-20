import { BALANCE } from '../config/balance.js';
import { getMarchDurationMs } from '../core/timeEngine.js';
import { pushLog } from '../core/state.js';
import { sound } from '../audio/sound.js';

function drawWorldCanvas(canvas, state, targets) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const now = Date.now();
  const realm = BALANCE.realms[state.activeRealm] || BALANCE.realms.great_empire;

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, realm.groundTop);
  grad.addColorStop(1, realm.groundBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  for (let gx = 40; gx < w; gx += 48) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, h);
    ctx.stroke();
  }
  for (let gy = 30; gy < h; gy += 48) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(w, gy);
    ctx.stroke();
  }

  const homeX = w * 0.5;
  const homeY = h * 0.52;
  const hitBoxes = [];

  // Draw targets
  for (const t of targets) {
    const tx = w * t.x;
    const ty = h * t.y;
    const isSel = t.id === state.selectedTargetId;

    // Road line
    ctx.strokeStyle = isSel ? 'rgba(255, 209, 102, 0.5)' : 'rgba(255,255,255,0.14)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(homeX, homeY);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.setLineDash([]);

    // Marker circle
    ctx.beginPath();
    ctx.arc(tx, ty, isSel ? 17 : 14, 0, Math.PI * 2);
    ctx.fillStyle =
      t.kind === 'OUTPOST' ? '#2ecc71' : t.kind === 'EVENT' ? '#f39c12' : '#e74c3c';
    ctx.fill();
    ctx.lineWidth = isSel ? 3 : 1.5;
    ctx.strokeStyle = isSel ? '#ffd166' : '#111';
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    const icon = t.kind === 'OUTPOST' ? '🚩' : t.kind === 'VILLAGE' ? '🌾' : t.kind === 'EVENT' ? '⛺' : '🗼';
    ctx.fillText(icon, tx, ty + 4);

    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(12, 17, 24, 0.82)';
    const label = t.name.slice(0, 18);
    const tw = ctx.measureText(label).width + 8;
    ctx.fillRect(tx - tw / 2, ty + 16, tw, 14);
    ctx.fillStyle = isSel ? '#ffd166' : '#f1f2f6';
    ctx.fillText(label, tx, ty + 26);

    hitBoxes.push({ id: t.id, x: tx, y: ty });
  }

  // Player castle in center
  ctx.beginPath();
  ctx.arc(homeX, homeY, 18, 0, Math.PI * 2);
  ctx.fillStyle = '#3498db';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#ffd166';
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = '14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🏰', homeX, homeY + 5);

  // Active marches animation
  for (const m of state.marches) {
    const t = BALANCE.mapTargets.find((x) => x.id === m.targetId);
    if (!t || t.realm !== state.activeRealm) continue;
    const tx = w * t.x;
    const ty = h * t.y;
    const total = Math.max(1, m.arrivesAt - m.startedAt);
    const p = Math.max(0, Math.min(1, (now - m.startedAt) / total));

    const sx = m.kind === 'return' ? tx : homeX;
    const sy = m.kind === 'return' ? ty : homeY;
    const ex = m.kind === 'return' ? homeX : tx;
    const ey = m.kind === 'return' ? homeY : ty;

    const mx = sx + (ex - sx) * p;
    const my = sy + (ey - sy) * p;

    ctx.beginPath();
    ctx.arc(mx, my, 7, 0, Math.PI * 2);
    ctx.fillStyle = m.kind === 'spy' ? '#a29bfe' : m.kind === 'return' ? '#55efc4' : '#ff7675';
    ctx.fill();
    ctx.strokeStyle = '#111';
    ctx.stroke();
  }

  canvas._hitBoxes = hitBoxes;
}

export function renderWorldMapView(container, state, onMutate, onGoBattle) {
  const now = Date.now();
  const realmTargets = BALANCE.mapTargets.filter((t) => t.realm === state.activeRealm);
  const selectedTarget =
    realmTargets.find((t) => t.id === state.selectedTargetId) || realmTargets[0] || BALANCE.mapTargets[0];
  if (selectedTarget && state.selectedTargetId !== selectedTarget.id) {
    state.selectedTargetId = selectedTarget.id;
  }

  const isScouted = selectedTarget && state.scoutedIds.includes(selectedTarget.id);
  const marchSec = selectedTarget ? Math.round(getMarchDurationMs(state, selectedTarget.distanceTiles) / 1000) : 5;

  container.innerHTML = `
    <div class="canvas-wrap">
      <canvas id="world-canvas" width="480" height="250"></canvas>
      <div class="canvas-overlay-top">
        <span class="pill">🗺️ ${BALANCE.realms[state.activeRealm]?.name}</span>
        <span class="pill">🚩 Аванпостов: ${state.capturedOutposts.length}</span>
      </div>
    </div>

    ${
      selectedTarget
        ? `
      <div class="card">
        <h3>${selectedTarget.name}</h3>
        <p class="muted">
          Дистанция: ${selectedTarget.distanceTiles} (~${marchSec}с) • Стены: +${Math.round(selectedTarget.wallBonus * 100)}% • Ворота: +${Math.round(selectedTarget.gateBonus * 100)}%
        </p>
        ${
          isScouted
            ? `<p class="muted">
                <strong>Шпионаж:</strong>
                Л(${selectedTarget.defense.left.maceman}б/${selectedTarget.defense.left.crossbow}а/${selectedTarget.defense.left.knight}р) •
                Ц(${selectedTarget.defense.center.maceman}б/${selectedTarget.defense.center.crossbow}а/${selectedTarget.defense.center.knight}р) •
                П(${selectedTarget.defense.right.maceman}б/${selectedTarget.defense.right.crossbow}а/${selectedTarget.defense.right.knight}р)
              </p>`
            : `<p class="muted">Гарнизон скрыт. Отправьте шпиона (🪙40) или атакуйте.</p>`
        }
        <p class="muted">Добыча: 🪵${selectedTarget.loot.wood} 🪨${selectedTarget.loot.stone} 🌾${selectedTarget.loot.food} 🪙${selectedTarget.loot.gold} 💎${selectedTarget.loot.rubies}</p>
        <div class="row">
          <button id="btn-spy" class="action-btn secondary" type="button">🕵️ Шпионаж (🪙40)</button>
          <button id="btn-go-attack" class="action-btn" type="button">⚔️ Подготовить штурм</button>
        </div>
      </div>
    `
        : ''
    }

    <div class="card">
      <h3>Походы в пути (${state.marches.length})</h3>
      ${
        state.marches.length === 0
          ? '<p class="muted">Все отряды и шпионы находятся в замке.</p>'
          : state.marches
              .map((m) => {
                const t = BALANCE.mapTargets.find((x) => x.id === m.targetId);
                const leftSec = Math.max(0, Math.ceil((m.arrivesAt - now) / 1000));
                const label = m.kind === 'spy' ? '🕵️ Разведка' : m.kind === 'attack' ? '⚔️ Штурм' : '🔙 Возврат';
                return `<p class="muted">${label} → ${t?.name || m.targetId}: <strong>${leftSec}с</strong></p>`;
              })
              .join('')
      }
    </div>
  `;

  const canvas = container.querySelector('#world-canvas');
  if (canvas) {
    drawWorldCanvas(canvas, state, realmTargets);
    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) * canvas.width) / rect.width;
      const clickY = ((e.clientY - rect.top) * canvas.height) / rect.height;
      for (const box of canvas._hitBoxes || []) {
        if (Math.hypot(clickX - box.x, clickY - box.y) < 28) {
          state.selectedTargetId = box.id;
          sound.click();
          onMutate();
          break;
        }
      }
    });
  }

  container.querySelector('#btn-spy')?.addEventListener('click', () => {
    if (!selectedTarget) return;
    if ((state.resources.gold || 0) < 40) {
      pushLog(state, 'Недостаточно монет для отправки шпиона (нужно 40).');
      sound.alert();
      onMutate();
      return;
    }
    state.resources.gold -= 40;
    const travelMs = Math.max(2000, Math.round(getMarchDurationMs(state, selectedTarget.distanceTiles) * 0.65));
    state.marches.push({
      id: `spy_${Date.now()}`,
      targetId: selectedTarget.id,
      realm: selectedTarget.realm,
      kind: 'spy',
      startedAt: Date.now(),
      arrivesAt: Date.now() + travelMs
    });
    pushLog(state, `Шпион выехал к "${selectedTarget.name}" (${Math.round(travelMs / 1000)}с).`);
    sound.march();
    onMutate();
  });

  container.querySelector('#btn-go-attack')?.addEventListener('click', () => {
    sound.click();
    if (onGoBattle) onGoBattle();
  });
}
