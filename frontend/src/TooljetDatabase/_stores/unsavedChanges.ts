import { useCallback, useEffect } from 'react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// Where unsaved input can live on the database page, and how the discard dialog names it.
export const UNSAVED_SOURCES = {
  inlineAddRow: 'the new row',
  cellEditor: 'the cell edit',
  createRow: 'the new row',
  editRow: 'the row edit',
  createColumn: 'the new column',
  editColumn: 'the column edit',
} as const;

export type UnsavedSourceId = keyof typeof UNSAVED_SOURCES;

interface UnsavedChangesState {
  /** Sources holding unsaved input. A source is present only while it is dirty. */
  sources: Partial<Record<UnsavedSourceId, true>>;
  /** What the discard dialog says will be lost; null while it is closed. */
  askingAbout: string[] | null;
}

const initialState: UnsavedChangesState = { sources: {}, askingAbout: null };

export const useUnsavedChanges = create<UnsavedChangesState>()(immer(() => initialState));

const dirtyIds = (sourceId?: UnsavedSourceId): UnsavedSourceId[] => {
  const dirty = Object.keys(useUnsavedChanges.getState().sources) as UnsavedSourceId[];
  return sourceId ? dirty.filter((id) => id === sourceId) : dirty;
};

/** Is anything dirty (or, with `sourceId`, is that source)? */
export const hasUnsavedChanges = (sourceId?: UnsavedSourceId): boolean => dirtyIds(sourceId).length > 0;

/** Marks a source dirty or clean. Prefer `useReportUnsaved`, which also clears it on unmount. */
export const setUnsaved = (sourceId: UnsavedSourceId, dirty: boolean): void => {
  if (hasUnsavedChanges(sourceId) === dirty) return;
  useUnsavedChanges.setState((state) => {
    if (dirty) state.sources[sourceId] = true;
    else delete state.sources[sourceId];
  });
};

let pending: { promise: Promise<boolean>; settle: (discard: boolean) => void } | null = null;

/** Resolves the open discard dialog. Called by `UnsavedChangesGuard`. */
export const settleDiscard = (discard: boolean): void => {
  const asking = pending;
  pending = null;
  useUnsavedChanges.setState((state) => {
    state.askingAbout = null;
  });
  asking?.settle(discard);
};

/**
 * Resolves true at once when nothing is dirty, else asks through the page's discard dialog and resolves with the
 * answer. With `sourceId` only that source counts (a drawer asks about its own form, not the whole page). A second
 * ask while the dialog is open gets the same answer (Escape reaches a drawer's close twice).
 */
export const confirmDiscard = (sourceId?: UnsavedSourceId): Promise<boolean> => {
  if (!hasUnsavedChanges(sourceId)) return Promise.resolve(true);
  if (pending) return pending.promise;
  let settle: (discard: boolean) => void = () => {};
  const promise = new Promise<boolean>((resolve) => {
    settle = resolve;
  });
  pending = { promise, settle };
  const labels = [...new Set(dirtyIds(sourceId).map((id) => UNSAVED_SOURCES[id]))];
  useUnsavedChanges.setState((state) => {
    state.askingAbout = labels;
  });
  return promise;
};

/**
 * Runs `action` now when nothing is dirty, else after the user chooses Discard. The clean path stays synchronous so a
 * click that changes nothing unsaved behaves exactly as before the guard.
 */
export const runUnlessDirty = (action: () => void, sourceId?: UnsavedSourceId): void => {
  if (!hasUnsavedChanges(sourceId)) {
    action();
    return;
  }
  void confirmDiscard(sourceId).then((discard) => {
    if (discard) action();
  });
};

/** Reports whether this source has unsaved input. Clears it when it unmounts, which is what a discard does. */
export const useReportUnsaved = (sourceId: UnsavedSourceId, dirty: boolean): void => {
  useEffect(() => {
    setUnsaved(sourceId, dirty);
  }, [sourceId, dirty]);
  useEffect(() => () => setUnsaved(sourceId, false), [sourceId]);
};

/** A close handler for a drawer: asks about the drawer's own source first. Saving must call the plain close. */
export const useGuardedClose = (sourceId: UnsavedSourceId, close: () => void): (() => void) =>
  useCallback(() => runUnlessDirty(close, sourceId), [sourceId, close]);
