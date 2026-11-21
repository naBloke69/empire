import { getEconomyStats } from '../core/economy.js';
import { BALANCE } from '../config/balance.js';

export function renderHud(el, state) {
  const stats = getEconomyStats(state);
  const r = state.resources;
  const fmtRate = (v) => `${v >= 0 ? '+' : ''}${v.toFixed(0)}/м`;
  const totalTroops = Object.values(state.troops).reduce((a, b) => a + b, 0);

  const isFull = (res) => (r[res] || 0) >= stats.caps[res] - 1;

  el.innerHTML = `
    <div class="res-item ${isFull('wood') ? 'cap-full' : ''}">
      <span class="res-label">🪵 Дерево (${fmtRate(stats.ratesPerMin.wood)})</span>
      <span class="res-val">${Math.floor(r.wood)} / ${stats.caps.wood}</span>
    </div>
    <div class="res-item ${isFull('stone') ? 'cap-full' : ''}">
      <span class="res-label">🪨 Камень (${fmtRate(stats.ratesPerMin.stone)})</span>
      <span class="res-val">${Math.floor(r.stone)} / ${stats.caps.stone}</span>
    </div>
    <div class="res-item ${isFull('food') ? 'cap-full' : ''}">
      <span class="res-label">🌾 Еда (${fmtRate(stats.ratesPerMin.food)})</span>
      <span class="res-val">${Math.floor(r.food)} / ${stats.caps.food}</span>
    </div>
    <div class="res-item">
      <span class="res-label">🪙 Монеты (${fmtRate(stats.ratesPerMin.gold)})</span>
      <span class="res-val">${Math.floor(r.gold)}</span>
    </div>
    <div class="res-item">
      <span class="res-label">💎 Рубины</span>
      <span class="res-val">${Math.floor(r.rubies)}</span>
    </div>
    <div class="res-item">
      <span class="res-label">😊 Порядок / Войска</span>
      <span class="res-val">${stats.publicOrder} (${stats.orderEfficiencyPct}%) • ⚔️${totalTroops}</span>
    </div>
  `;
}

export function renderTimerStrip(stripEl, state) {
  if (!stripEl) return;
  const now = Date.now();
  const chips = [];

  if ((state.shieldUntil || 0) > now) {
    const left = Math.max(0, Math.ceil((state.shieldUntil - now) / 1000));
    chips.push(`<span class="timer-chip">🛡️ Щит: ${left}с</span>`);
  }
  if (state.buildQueue) {
    const left = Math.max(0, Math.ceil((state.buildQueue.endsAt - now) / 1000));
    const bName = BALANCE.buildings[state.buildQueue.type]?.name || 'Стройка';
    chips.push(`<span class="timer-chip">🔨 ${bName}: ${left}с</span>`);
  }
  if (state.trainQueue) {
    const left = Math.max(0, Math.ceil((state.trainQueue.totalEndsAt - now) / 1000));
    const itemName =
      state.trainQueue.category === 'unit'
        ? BALANCE.units[state.trainQueue.itemKey]?.name
        : BALANCE.tools[state.trainQueue.itemKey]?.name;
    chips.push(`<span class="timer-chip">⚔️ ${itemName} x${state.trainQueue.count}: ${left}с</span>`);
  }
  for (const m of state.marches) {
    const left = Math.max(0, Math.ceil((m.arrivesAt - now) / 1000));
    const t = BALANCE.mapTargets.find((x) => x.id === m.targetId);
    const icon = m.kind === 'spy' ? '🕵️' : m.kind === 'return' ? '🔙' : '🚩';
    chips.push(`<span class="timer-chip">${icon} ${t?.name?.split(' ')[0] || 'Поход'}: ${left}с</span>`);
  }

  stripEl.innerHTML = chips.length
    ? chips.join('')
    : `<span class="muted" style="margin:0;">${state.accountName || 'Лорд'} • БП: ${state.bpXp || 0} XP • ${BALANCE.realms[state.activeRealm]?.perkDesc || ''}</span>`;
}

export function renderLogs(listEl, state) {
  listEl.innerHTML = state.logs
    .slice(0, 14)
    .map((item) => `<li>${item.text}</li>`)
    .join('');
}
