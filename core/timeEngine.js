import { BALANCE } from '../config/balance.js';
import { getActiveCommander, getEconomyStats, stepEconomy } from './economy.js';
import { resolveFlankBattle } from './combat.js';
import { pushLog } from './state.js';
import { sound } from '../audio/sound.js';

export function getMarchDurationMs(state, distanceTiles) {
  const cmd = getActiveCommander(state);
  const speedMult = (cmd.marchSpeedMult || 1) * (state.quickMode ? BALANCE.quickModeMultiplier : 1);
  const baseSec = Math.max(3, distanceTiles * 3);
  return Math.max(2000, Math.round((baseSec / speedMult) * 1000));
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
      pushLog(state, `${bName} улучшен до ур. ${slot.level}`);
      if (isLiveTick) sound.success();
    }
    state.buildQueue = null;
  }

  if (state.trainQueue && now >= state.trainQueue.totalEndsAt) {
    const tq = state.trainQueue;
    state.troops[tq.unitType] = (state.troops[tq.unitType] || 0) + tq.count;
    const uName = BALANCE.units[tq.unitType]?.name || tq.unitType;
    pushLog(state, `Обучено ${tq.count}x ${uName}`);
    if (isLiveTick) sound.success();
    state.trainQueue = null;
  }

  const remainingMarches = [];
  const cmd = getActiveCommander(state);
  const spec = BALANCE.specializations[state.specialization] || BALANCE.specializations.balanced;
  const econ = getEconomyStats(state);

  for (const m of state.marches) {
    if (now < m.arrivesAt) {
      remainingMarches.push(m);
      continue;
    }

    const target = BALANCE.mapTargets.find((t) => t.id === m.targetId);
    if (m.kind === 'attack') {
      const report = resolveFlankBattle(m.flanks, target ? target.defense : {}, {
        mutate: true,
        wallBonus: econ.wallDefenseBonus,
        atkMult: (cmd.atkMult || 1) * (spec.atkMult || 1),
        siegeMult: cmd.siegeMult || 1,
        fatigue: state.fatigue || 0
      });

      state.fatigue = Math.min(BALANCE.maxFatigue, (state.fatigue || 0) + BALANCE.fatiguePerMarch);

      const survivors = {};
      let anySurvivor = false;
      for (const sec of ['left', 'center', 'right']) {
        for (const [uType, cnt] of Object.entries(report.remainingAttackers[sec] || {})) {
          survivors[uType] = (survivors[uType] || 0) + cnt;
          if (cnt > 0) anySurvivor = true;
        }
      }

      let loot = { wood: 0, stone: 0, food: 0, gold: 0 };
      if (report.victory && target) {
        loot = { ...target.loot };
      }

      state.lastReport = {
        targetName: target ? target.name : m.targetId,
        victory: report.victory,
        bottlenecks: report.bottlenecks,
        loot,
        at: now
      };

      pushLog(
        state,
        report.victory
          ? `Победа над "${target?.name}"! Трофеи в пути.`
          : `Поражение у "${target?.name}". Причина: ${report.bottlenecks[0] || 'недостаток сил'}.`
      );
      if (isLiveTick) {
        report.victory ? sound.success() : sound.alert();
      }

      if (anySurvivor) {
        const travelMs = getMarchDurationMs(state, target?.distanceTiles || 2);
        remainingMarches.push({
          id: `${m.id}_ret`,
          targetId: m.targetId,
          kind: 'return',
          troops: survivors,
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
      pushLog(state, `Отряд вернулся из "${target?.name || m.targetId}".`);
      if (isLiveTick) sound.click();
    }
  }
  state.marches = remainingMarches;
}

