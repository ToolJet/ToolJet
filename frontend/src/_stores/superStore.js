import { createDataQueriesStore } from './dataQueriesStore';
import { createEditorStore } from './editorStore';
import { createQueryPanelStore } from './queryPanelStore';
import { create } from './utils';

export const useSuperStore = create((set, get) => ({
  modules: {
    '#main': {
      useEditorStore: createEditorStore('#main'),
      useQueryPanelStore: createQueryPanelStore('#main'),
      useDataQueriesStore: createDataQueriesStore('#main'),
    },
  },
}));
