import { createEditorStore } from './editorStore';
import { create } from './utils';

export const useSuperStore = create((set, get) => ({
  modules: {
    '#main': {
      useEditorStore: createEditorStore(),
    },
  },
}));
