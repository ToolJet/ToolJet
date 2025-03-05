import { updateCanvasBackground } from '@/_helpers/editorHelpers';
import { appsService, appVersionService } from '@/_services';
import { decimalToHex } from '@/Editor/editorConstants';
import toast from 'react-hot-toast';
import DependencyGraph from './DependencyClass';
import { getWorkspaceId } from '@/_helpers/utils';
import { navigate } from '@/AppBuilder/_utils/misc';
import queryString from 'query-string';
import { replaceEntityReferencesWithIds } from '../utils';

const initialState = {
  app: {},
  canvasHeight: null,
  isSaving: false,
  globalSettings: {},
  pageSwitchInProgress: false,
  isTJDarkMode: localStorage.getItem('darkMode') === 'true',
  isViewer: false,
  isComponentLayoutReady: false,
};

export const createAppSlice = (set, get) => ({
  ...initialState,
  setIsViewer: (isViewer) => set(() => ({ isViewer }), false, 'setIsViewer'),
  setApp: (app) => set(() => ({ app }), false, 'setApp'),
  setAppName: (name) => set((state) => ({ app: { ...state.app, appName: name } }), false, 'setAppName'),
  setAppHomePageId: (homePageId) => set((state) => ({ app: { ...state.app, homePageId } }), false, 'setAppHomePageId'),
  setIsComponentLayoutReady: (isReady) =>
    set(() => ({ isComponentLayoutReady: isReady }), false, 'setIsComponentLayoutReady'),
  setCanvasHeight: (canvasHeight) => set({ canvasHeight }, false, 'setCanvasHeight'),
  updateCanvasBottomHeight: (components) => {
    const { currentLayout, currentMode, setCanvasHeight } = get();
    const maxHeight = Object.values(components).reduce((max, component) => {
      const layout = component?.layouts?.[currentLayout];
      if (!layout) {
        return max;
      }
      const sum = layout.top + layout.height;
      return Math.max(max, sum);
    }, 0);
    const bottomPadding = currentMode === 'view' ? 100 : 300;
    const frameHeight = currentMode === 'view' ? 45 : 85;
    setCanvasHeight(`max(100vh - ${frameHeight}px, ${maxHeight + bottomPadding}px)`);
  },
  setIsAppSaving: (isSaving) => {
    set(
      (state) => {
        state.app.isSaving = isSaving;
      },
      false,
      'setIsAppSaving'
    );
  },
  setGlobalSettings: (globalSettings) => set(() => ({ globalSettings }), false, 'setGlobalSettings'),
  toggleAppMaintenance: () => {
    const { isMaintenanceOn, appId } = get().app;

    appsService.setMaintenance(appId, !isMaintenanceOn).then(() => {
      set((state) => ({ app: { ...state.app, isMaintenanceOn: !isMaintenanceOn } }));
      if (isMaintenanceOn) {
        toast.success('Application is on maintenance.');
      } else {
        toast.success('Application maintenance is completed');
      }
    });
  },
  globalSettingsChanged: async (options) => {
    const componentNameIdMapping = get().modules.canvas.componentNameIdMapping;
    const queryNameIdMapping = get().modules.canvas.queryNameIdMapping;
    for (const [key, value] of Object.entries(options)) {
      if (value?.[1]?.a == undefined) {
        options[key] = value;
      } else {
        const hexCode = `${value?.[0]}${decimalToHex(value?.[1]?.a)}`;
        options[key] = hexCode;
      }
    }
    // Replace entity references with ids if present
    const newOptions = replaceEntityReferencesWithIds(options, componentNameIdMapping, queryNameIdMapping);
    const { app, currentVersionId, currentPageId } = get();
    try {
      const res = await appVersionService.autoSaveApp(
        app.appId,
        currentVersionId,
        { globalSettings: newOptions },
        'global_settings',
        currentPageId,
        'update'
      );
      set((state) => ({ globalSettings: { ...state.globalSettings, ...newOptions } }));
    } catch (error) {
      toast.error('App could not be saved.');
      console.error('Error updating page:', error);
    }
  },
  switchPage: (pageId, handle, queryParams = []) => {
    get().debugger.resetUnreadErrorCount();
    // reset stores
    if (get().pageSwitchInProgress) {
      toast('Please wait, page switch in progress', {
        icon: '⚠️',
      });
      return;
    }
    const {
      setCurrentPageId,
      setComponentNameIdMapping,
      initDependencyGraph,
      setQueryMapping,
      cleanUpStore,
      setResolvedGlobals,
      setResolvedPageConstants,
      setPageSwitchInProgress,
      currentMode,
      license,
      modules: {
        canvas: { pages },
      },
    } = get();
    const isPreview = currentMode !== 'edit';
    //!TODO clear all queued tasks
    cleanUpStore(true);
    setCurrentPageId(pageId, 'canvas');
    setComponentNameIdMapping('canvas');
    setQueryMapping('canvas');

    const appId = get().app.appId;
    const filteredQueryParams = queryParams.filter(([key, value]) => {
      if (!value) return false;
      if (key === 'env' && !license.isLicenseValid()) return false;
      return true;
    });

    const queryParamsString = filteredQueryParams.map(([key, value]) => `${key}=${value}`).join('&');
    const slug = get().app.slug;

    navigate(
      `/${isPreview ? 'applications' : getWorkspaceId() + '/apps'}/${slug ?? appId}/${handle}?${queryParamsString}`,
      {
        state: {
          isSwitchingPage: true,
        },
      }
    );
    const newPage = pages.find((p) => p.id === pageId);
    setResolvedPageConstants({
      id: newPage?.id,
      handle: newPage?.handle,
      name: newPage?.name,
    });
    setResolvedGlobals('urlparams', JSON.parse(JSON.stringify(queryString.parse(queryParamsString))));
    initDependencyGraph('canvas');
    setPageSwitchInProgress(true);
  },
  setPageSwitchInProgress: (isInProgress) =>
    set(() => ({ pageSwitchInProgress: isInProgress }), false, 'setPageSwitchInProgress'),

  cleanUpStore: (isPageSwitch = false) => {
    get().resetUndoRedoStack();
    set((state) => {
      state.modules.canvas.componentNameIdMapping = {};
      state.selectedComponents = [];
      if (isPageSwitch) {
        state.pageSwitchInProgress = false;
      }
      state.containerChildrenMapping = {
        canvas: [],
      };
      // reset dependency graph
      state.dependencyGraph.modules.canvas.graph = new DependencyGraph();
      state.resolvedStore.modules.canvas.components = {};
      state.resolvedStore.modules.canvas.customResolvables = {};
      state.resolvedStore.modules.canvas.exposedValues.components = {};
      state.resolvedStore.modules.canvas.exposedValues.page.variables = {};
    });
  },

  setSlug: (slug) => {
    set(
      (state) => {
        state.app.slug = slug;
      },
      false,
      'setSlug'
    );
  },
  setIsPublic: (isPublic) => {
    set(
      (state) => {
        state.app.isPublic = isPublic;
      },
      false,
      'setIsPublic'
    );
  },
  updateIsTJDarkMode: (newMode) => set({ isTJDarkMode: newMode }, false, 'updateIsTJDarkMode'),
});
