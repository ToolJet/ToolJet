import { createDataQueriesStore } from './dataQueriesStore';
import { createEditorStore } from './editorStore';
import { createQueryPanelStore } from './queryPanelStore';
import { createDataSourcesStore } from './dataSourcesStore';
import { createCurrentStateStore } from './currentStateStore';
import { create } from './utils';
import { createAppVersionStore } from './appVersionStore';
import { createAppDataStore } from './appDataStore';
import { omit } from 'lodash';

const generateModule = (moduleName) => ({
  useEditorStore: createEditorStore(moduleName),
  useQueryPanelStore: createQueryPanelStore(moduleName),
  useDataQueriesStore: createDataQueriesStore(moduleName),
  useDataSourcesStore: createDataSourcesStore(moduleName),
  useCurrentStateStore: createCurrentStateStore(moduleName),
  useAppVersionStore: createAppVersionStore(moduleName),
  useAppDataStore: createAppDataStore(moduleName),
});

const mainModule = generateModule('#main');

export const useSuperStore = create((set, get) => ({
  modules: {
    '#main': mainModule,
  },

  createModule: (moduleName) => {
    const modules = get().modules;
    const newModules = {
      ...modules,
      [moduleName]: generateModule(moduleName),
    };

    set(() => ({ modules: newModules }));
    return true;
  },

  destroyModule: (moduleName) => {
    const modules = get().modules;
    const newModules = omit(modules, moduleName);
    set(() => ({ modules: newModules }));
  },
}));
