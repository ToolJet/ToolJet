// Pure helpers for plan limits (apps, workflows, workspaces, tables, users). Read the payload the
// limit endpoints already return: { current, total, percentage, canAddUnlimited }.
// Display only: the backend still blocks creation at the limit (HTTP 451).

/**
 * @returns {{ limited: boolean, reached: boolean, current: number, total: number | null }}
 */
export function getLimitState(limit) {
  const total = Number(limit?.total);
  const current = Number(limit?.current ?? 0);
  if (!limit || limit.canAddUnlimited || limit.total === undefined || limit.total === null || Number.isNaN(total)) {
    return { limited: false, reached: false, current, total: null };
  }
  return { limited: true, reached: current >= total, current, total };
}

// Of several limits on the same action (e.g. workflows per instance and per workspace), the one
// to show: a reached limit first, otherwise the one closest to full. Unlimited ones are ignored.
export function pickTighterLimit(...limits) {
  return limits
    .filter((limit) => getLimitState(limit).limited)
    .sort((a, b) => {
      const stateA = getLimitState(a);
      const stateB = getLimitState(b);
      if (stateA.reached !== stateB.reached) return stateA.reached ? -1 : 1;
      const usageA = stateA.total ? stateA.current / stateA.total : 1;
      const usageB = stateB.total ? stateB.current / stateB.total : 1;
      return usageB - usageA;
    })[0];
}
