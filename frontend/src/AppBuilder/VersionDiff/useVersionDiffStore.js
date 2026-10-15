import { create } from 'zustand';

// Opens the compare view from anywhere in the editor: the header button, the
// release dialog, or the AI chat after a turn. `source` only changes copy.
export const useVersionDiffStore = create((set) => ({
  isOpen: false,
  baseVersionId: null,
  targetVersionId: null,
  source: 'header',
  reviewId: null,
  // A stored snapshot (the state before an AI turn) instead of a version.
  baseSnapshotId: null,
  openCompare: ({
    baseVersionId = null,
    targetVersionId = null,
    source = 'header',
    reviewId = null,
    baseSnapshotId = null,
  } = {}) => set({ isOpen: true, baseVersionId, targetVersionId, source, reviewId, baseSnapshotId }),
  closeCompare: () => set({ isOpen: false }),
}));
