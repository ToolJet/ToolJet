export interface TabsState {
  /** Table ids, in tab order. */
  ids: string[];
  /** The tab that is showing, or null when none is open. */
  activeId: string | null;
}

export const NO_TABS: TabsState = { ids: [], activeId: null };

// The tab to show after `id` leaves `ids`: the one that took its place (right neighbour), else the one before it.
function neighbourOf(ids: string[], id: string): string | null {
  const index = ids.indexOf(id);
  const remaining = ids.filter((tabId) => tabId !== id);
  if (remaining.length === 0) return null;
  return remaining[Math.min(index, remaining.length - 1)];
}

export function openTab(state: TabsState, id: string): TabsState {
  return { ids: state.ids.includes(id) ? state.ids : [...state.ids, id], activeId: id };
}

export function closeTab(state: TabsState, id: string): TabsState {
  if (!state.ids.includes(id)) return state;
  const ids = state.ids.filter((tabId) => tabId !== id);
  return { ids, activeId: state.activeId === id ? neighbourOf(state.ids, id) : state.activeId };
}

export function closeOtherTabs(state: TabsState, id: string): TabsState {
  return state.ids.includes(id) ? { ids: [id], activeId: id } : state;
}

export function closeAllTabs(): TabsState {
  return NO_TABS;
}

// Drops tabs whose table is gone (deleted elsewhere, or a stale restore) and repairs the active tab.
export function reconcileTabs(state: TabsState, existingIds: string[]): TabsState {
  const exists = new Set(existingIds);
  const ids = state.ids.filter((id, index) => exists.has(id) && state.ids.indexOf(id) === index);
  if (state.activeId !== null && ids.includes(state.activeId)) return { ids, activeId: state.activeId };
  const at = state.activeId === null ? -1 : state.ids.indexOf(state.activeId);
  if (at === -1) return { ids, activeId: ids[0] ?? null };
  // The active table is gone: take the surviving tab that sat next to it, right side first.
  const next = state.ids.slice(at + 1).find((id) => ids.includes(id));
  const previous = state.ids
    .slice(0, at)
    .reverse()
    .find((id) => ids.includes(id));
  return { ids, activeId: next ?? previous ?? null };
}

// Reads persisted tabs. Anything unexpected means "nothing open"; storage is never trusted.
export function parseStoredTabs(raw: string | null): TabsState {
  if (!raw) return NO_TABS;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return NO_TABS;
    const { ids, activeId } = parsed as { ids?: unknown; activeId?: unknown };
    if (!Array.isArray(ids) || !ids.every((id) => typeof id === 'string')) return NO_TABS;
    return { ids, activeId: typeof activeId === 'string' && ids.includes(activeId) ? activeId : (ids[0] ?? null) };
  } catch {
    return NO_TABS;
  }
}
