import { createDataQueriesStore } from './dataQueriesStore';
import { createEditorStore } from './editorStore';
import { createQueryPanelStore } from './queryPanelStore';
import { createDataSourcesStore } from './dataSourcesStore';
import { createCurrentStateStore } from './currentStateStore';
import { create } from './utils';
import { createAppVersionStore } from './appVersionStore';
import { createAppDataStore } from './appDataStore';

export const useSuperStore = create((set, get) => ({
  modules: {
    '#main': {
      useEditorStore: createEditorStore('#main'),
      useQueryPanelStore: createQueryPanelStore('#main'),
      useDataQueriesStore: createDataQueriesStore('#main'),
      useDataSourcesStore: createDataSourcesStore('#main'),
      useCurrentStateStore: createCurrentStateStore('#main'),
      useAppVersionStore: createAppVersionStore('#main'),
      useAppDataStore: createAppDataStore('#main'),
    },
  },
}));
