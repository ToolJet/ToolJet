import { create } from 'zustand';

// Opens the compare view from anywhere in the editor: the header button, the
// release dialog, or the AI chat after a turn. `source` only changes copy.
export const useVersionDiffStore = create((set) => ({
  isOpen: false,
  baseVersionId: null,
  targetVersionId: null,
  source: 'header',
  openCompare: ({ baseVersionId = null, targetVersionId = null, source = 'header' } = {}) =>
    set({ isOpen: true, baseVersionId, targetVersionId, source }),
  closeCompare: () => set({ isOpen: false }),
}));
