import { BALANCE } from '../config/balance.js';
import { getActiveCommander, stepEconomy } from './economy.js';
import { resolveSiegeBattle } from './combat.js';
import { pushLog } from './state.js';
import { sound } from '../audio/sound.js';

export function getMarchDurationMs(state, distanceTiles) {
  const cmd = getActiveCommander(state);
  const speedMult = (cmd.marchSpeedMult || 1) * (state.quickMode ? BALANCE.quickModeMultiplier : 1);
  const baseSec = Math.max(4, distanceTiles * 3.5);
  return Math.max(2500, Math.round((baseSec / speedMult) * 1000));
}

export function advanceSimulation(state, now = Date.now(), isLiveTick = false) {
  const rawDt = Math.max(0, (now - (state.lastTickAt || now)) / 1000);
  const dtSec = Math.min(BALANCE.maxOfflineSeconds, rawDt) * (state.quickMode ? BALANCE.quickModeMultiplier : 1);

  if (dtSec > 0) {
    stepEconomy(state, dtSec);
    state.lastTickAt = now;
  }

  if (state.buildQueue && now >= state.buildQueue.endsAt) {
    const q = state.buildQueue;
    const slot = state.slots.find((s) => s.id === q.slotId);
    if (slot) {
      slot.level = q.targetLevel;
      const bName = BALANCE.buildings[slot.type]?.name || slot.type;
      pushLog(state, `${bName} улучшен до ур. ${slot.level}!`);
      if (isLiveTick) sound.success();
    }
    state.buildQueue = null;
  }

  if (state.trainQueue && now >= state.trainQueue.totalEndsAt) {
    const tq = state.trainQueue;
    if (tq.category === 'unit') {
      state.troops[tq.itemKey] = (state.troops[tq.itemKey] || 0) + tq.count;
      pushLog(state, `Завершён найм: ${tq.count}x ${BALANCE.units[tq.itemKey]?.name}`);
    } else if (tq.category === 'tool') {
      state.tools[tq.itemKey] = (state.tools[tq.itemKey] || 0) + tq.count;
      pushLog(state, `Изготовлено орудий: ${tq.count}x ${BALANCE.tools[tq.itemKey]?.name}`);
    }
    if (isLiveTick) sound.success();
    state.trainQueue = null;
  }

  const remainingMarches = [];
  const cmd = getActiveCommander(state);

  for (const m of state.marches) {
    if (now < m.arrivesAt) {
      remainingMarches.push(m);
      continue;
    }

    const target = BALANCE.mapTargets.find((t) => t.id === m.targetId);

    if (m.kind === 'spy') {
      if (target && !state.scoutedIds.includes(target.id)) {
        state.scoutedIds.push(target.id);
      }
      pushLog(state, `Шпион вернулся с донесением о "${target?.name || m.targetId}".`);
      if (isLiveTick) sound.success();
    } else if (m.kind === 'attack') {
      const report = resolveSiegeBattle(m.waves, target, {
        mutate: true,
        commander: cmd
      });

      const loot = report.victory && target ? { ...target.loot } : { wood: 0, stone: 0, food: 0, gold: 0, rubies: 0 };

      if (report.victory && target?.kind === 'OUTPOST' && !state.capturedOutposts.includes(target.id)) {
        state.capturedOutposts.push(target.id);
        pushLog(state, `Аванпост "${target.name}" захвачен (+12% к добыче всей империи)!`);
      }

      state.lastReport = {
        targetName: target ? target.name : m.targetId,
        victory: report.victory,
        notes: report.notes,
        loot,
        at: now
      };

      pushLog(
        state,
        report.victory
          ? `Штурм "${target?.name}" успешен! Трофеи в пути домой.`
          : `Штурм "${target?.name}" отбит: ${report.notes[0] || 'недостаточно сил'}.`
      );

      if (isLiveTick) {
        report.victory ? sound.success() : sound.alert();
      }

      const anySurvivor = Object.values(report.survivors).some((v) => v > 0);
      if (anySurvivor) {
        const travelMs = getMarchDurationMs(state, target?.distanceTiles || 2);
        remainingMarches.push({
          id: `${m.id}_ret`,
          targetId: m.targetId,
          realm: m.realm,
          kind: 'return',
          troops: report.survivors,
          loot,
          startedAt: now,
          arrivesAt: now + travelMs
        });
      }
    } else if (m.kind === 'return') {
      for (const [uType, cnt] of Object.entries(m.troops || {})) {
        state.troops[uType] = (state.troops[uType] || 0) + cnt;
      }
      for (const [res, amt] of Object.entries(m.loot || {})) {
        state.resources[res] = (state.resources[res] || 0) + amt;
      }
      pushLog(state, `Армия вернулась из похода на "${target?.name || m.targetId}".`);
      if (isLiveTick) sound.click();
    }
  }

  state.marches = remainingMarches;
}
