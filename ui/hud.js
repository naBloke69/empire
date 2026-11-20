import { getEconomyStats } from '../core/economy.js';

export function renderHud(el, state) {
  const stats = getEconomyStats(state);
  const r = state.resources;
  const fmtRate = (v) => `${v >= 0 ? '+' : ''}${v.toFixed(0)}/м`;
  const totalTroops = Object.values(state.troops).reduce((a, b) => a + b, 0);

  el.innerHTML = `
    <div class="res-item">
      <span class="res-label">🪵 Дерево (${fmtRate(stats.ratesPerMin.wood)})</span>
      <span class="res-val">${Math.floor(r.wood)} / ${stats.caps.wood}</span>
    </div>
    <div class="res-item">
      <span class="res-label">🪨 Камень (${fmtRate(stats.ratesPerMin.stone)})</span>
      <span class="res-val">${Math.floor(r.stone)} / ${stats.caps.stone}</span>
    </div>
    <div class="res-item">
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

export function renderLogs(listEl, state) {
  listEl.innerHTML = state.logs
    .slice(0, 12)
    .map((item) => `<li>${item.text}</li>`)
    .join('');
}
