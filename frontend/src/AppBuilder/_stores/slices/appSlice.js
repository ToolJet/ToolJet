import { appsService, appVersionService } from '@/_services';
import { decimalToHex } from '@/Editor/editorConstants';
import toast from 'react-hot-toast';
import DependencyGraph from './DependencyClass';
import { getWorkspaceId } from '@/_helpers/utils';
import { navigate } from '@/AppBuilder/_utils/misc';
import queryString from 'query-string';
import { convertKeysToCamelCase, replaceEntityReferencesWithIds, baseTheme } from '../utils';
import _, { isEmpty } from 'lodash';
import { getSubpath } from '@/_helpers/routes';

const initialState = {
  isSaving: false,
  globalSettings: {
    theme: baseTheme,
  },
  pageSwitchInProgress: false,
  isTJDarkMode: localStorage.getItem('darkMode') === 'true',
  isViewer: false,
  themeChanged: false,
  isComponentLayoutReady: false,
  appPermission: {
    selectedUsers: [],
    selectedUserGroups: [],
  },
  appStore: {
    modules: {
      canvas: {
        canvasHeight: null,
        app: {},
        isViewer: false,
        isComponentLayoutReady: false,
      },
    },
  },
};

export const createAppSlice = (set, get) => ({
  ...initialState,
  initializeAppSlice: (moduleId) => {
    set(
      (state) => {
        state.appStore.modules[moduleId] = { ...initialState.appStore.modules.canvas };
      },
      false,
      'initializeAppSlice'
    );
  },
  detectThemeChange: () => set((state) => ({ themeChanged: !state.themeChanged })),
  setIsViewer: (isViewer, moduleId = 'canvas') =>
    set(
      (state) => {
        state.appStore.modules[moduleId].isViewer = isViewer;
      },
      false,
      'setIsViewer'
    ),
  setApp: (app, moduleId = 'canvas') =>
    set(
      (state) => {
        state.appStore.modules[moduleId].app = app;
      },
      false,
      'setApp'
    ),
  setAppName: (name, moduleId = 'canvas') =>
    set(
      (state) => {
        state.appStore.modules[moduleId].app.appName = name;
      },
      false,
      'setAppName'
    ),
  setAppHomePageId: (homePageId, moduleId = 'canvas') =>
    set(
      (state) => {
        state.appStore.modules[moduleId].app.homePageId = homePageId;
      },
      false,
      'setAppHomePageId'
    ),
  setIsComponentLayoutReady: (isReady, moduleId = 'canvas') =>
    set(
      (state) => {
        state.appStore.modules[moduleId].isComponentLayoutReady = isReady;
      },
      false,
      'setIsComponentLayoutReady'
    ),
  setCanvasHeight: (canvasHeight, moduleId = 'canvas') =>
    set(
      (state) => {
        state.appStore.modules[moduleId].canvasHeight = canvasHeight;
      },
      false,
      'setCanvasHeight'
    ),

  updateCanvasBottomHeight: (components, moduleId = 'canvas') => {
    const { currentLayout, getCurrentMode, setCanvasHeight, temporaryLayouts } = get();
    const currentMode = getCurrentMode(moduleId);

    const maxPermanentHeight = Object.values(components).reduce((max, component) => {
      const layout = component?.layouts?.[currentLayout];
      if (!layout) {
        return max;
      }
      const sum = layout.top + layout.height;
      return Math.max(max, sum);
    }, 0);

    const temporaryLayoutsMaxHeight = Object.values(temporaryLayouts).reduce((max, layout) => {
      const sum = layout.top + layout.height;
      return Math.max(max, sum);
    }, 0);

    const maxHeight = Math.max(maxPermanentHeight, temporaryLayoutsMaxHeight);

    const bottomPadding = currentMode === 'view' ? 100 : 300;
    const frameHeight = currentMode === 'view' ? 45 : 85;
    setCanvasHeight(`max(100vh - ${frameHeight}px, ${maxHeight + bottomPadding}px)`, moduleId);
  },
  setIsAppSaving: (isSaving, moduleId = 'canvas') => {
    set(
      (state) => {
        state.appStore.modules[moduleId].app.isSaving = isSaving;
      },
      false,
      'setIsAppSaving'
    );
  },
  setGlobalSettings: (globalSettings) => set(() => ({ globalSettings }), false, 'setGlobalSettings'),
  toggleAppMaintenance: (moduleId = 'canvas') => {
    const { isMaintenanceOn, appId } = get().appStore.modules[moduleId].app;
    const newState = !isMaintenanceOn;

    appsService.setMaintenance(appId, newState).then(() => {
      set((state) => {
        state.appStore.modules[moduleId].app.isMaintenanceOn = newState;
      });
      if (newState) {
        toast.success('Application is on maintenance.');
      } else {
        toast.success('Application maintenance is completed');
      }
    });
  },
  globalSettingsChanged: async (options, moduleId = 'canvas') => {
    const componentNameIdMapping = get().modules[moduleId].componentNameIdMapping;
    const queryNameIdMapping = get().modules[moduleId].queryNameIdMapping;
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
    const { appStore, currentVersionId, currentPageId } = get();
    try {
      const res = await appVersionService.autoSaveApp(
        appStore.modules[moduleId].app.appId,
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
  switchPage: (pageId, handle, queryParams = [], moduleId = 'canvas', isBackOrForward = false) => {
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
      license,
      modules: {
        canvas: { pages },
      },
      getCurrentMode,
    } = get();
    const isPreview = getCurrentMode(moduleId) !== 'edit';
    //!TODO clear all queued tasks
    cleanUpStore(true);
    setCurrentPageId(pageId, moduleId);
    setComponentNameIdMapping(moduleId);
    setQueryMapping(moduleId);

    const isLicenseValid =
      !_.get(license, 'featureAccess.licenseStatus.isExpired', true) &&
      _.get(license, 'featureAccess.licenseStatus.isLicenseValid', false);

    const appId = get().appStore.modules[moduleId].app.appId;
    const filteredQueryParams = queryParams.filter(([key, value]) => {
      if (!value) return false;
      if (key === 'env' && !isLicenseValid) return false;
      return true;
    });

    const queryParamsString = filteredQueryParams.map(([key, value]) => `${key}=${value}`).join('&');
    const slug = get().appStore.modules[moduleId].app.slug;
    const subpath = getSubpath();
    let toNavigate = '';

    if (!isBackOrForward) {
      toNavigate = `${subpath ? `${subpath}` : ''}/${isPreview ? 'applications' : `${getWorkspaceId() + '/apps'}`}/${
        slug ?? appId
      }/${handle}?${queryParamsString}`;
      navigate(toNavigate, {
        state: {
          isSwitchingPage: true,
          id: pageId,
          handle: handle,
        },
      });
    }

    const newPage = pages.find((p) => p.id === pageId);
    setResolvedPageConstants(
      {
        id: newPage?.id,
        handle: newPage?.handle,
        name: newPage?.name,
      },
      moduleId
    );
    setResolvedGlobals('urlparams', JSON.parse(JSON.stringify(queryString.parse(queryParamsString))));
    initDependencyGraph('canvas');
    setPageSwitchInProgress(true);
  },
  setPageSwitchInProgress: (isInProgress) =>
    set(() => ({ pageSwitchInProgress: isInProgress }), false, 'setPageSwitchInProgress'),

  cleanUpStore: (isPageSwitch = false, moduleId) => {
    const { resetUndoRedoStack, initModules } = get();
    resetUndoRedoStack();
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
      // initModules(moduleId);
    });
  },

  setSlug: (slug, moduleId = 'canvas') => {
    set(
      (state) => {
        state.appStore.modules[moduleId].app.slug = slug;
      },
      false,
      'setSlug'
    );
  },
  setIsPublic: (isPublic, moduleId = 'canvas') => {
    set(
      (state) => {
        state.appStore.modules[moduleId].app.isPublic = isPublic;
      },
      false,
      'setIsPublic'
    );
  },
  getAppId: (moduleId = 'canvas') => {
    return get().appStore.modules[moduleId].app.appId;
  },
  getHomePageId: (moduleId = 'canvas') => {
    return get().appStore.modules[moduleId].app.homePageId;
  },
  updateIsTJDarkMode: (newMode) => set({ isTJDarkMode: newMode }, false, 'updateIsTJDarkMode'),
  setSelectedUserGroups: (groups) =>
    set((state) => {
      state.appPermission.selectedUserGroups = groups;
    }),
  setSelectedUsers: (users) =>
    set((state) => {
      state.appPermission.selectedUsers = users;
    }),

  updateAppGenerationMetadata: (dataToUpdate, moduleId = 'canvas') => {
    set((state) => {
      if (isEmpty(dataToUpdate) || !state.appStore.modules[moduleId].app?.aiGenerationMetadata) return;

      // Any value at the top level of aiGenerationMetadata can be updated using this, for nested keys either send complete data or need to add separate logic to handle it
      Object.keys(dataToUpdate).forEach((key) => {
        if (dataToUpdate[key] !== undefined) {
          state.appStore.modules[moduleId].app.aiGenerationMetadata[key] = dataToUpdate[key];
        }
      });
    });
  },

  updateAppData: (dataToUpdate, moduleId = 'canvas') => {
    set((state) => {
      state.appStore.modules[moduleId].app = { ...state.appStore.modules[moduleId].app, ...dataToUpdate };
    });
  },

  updateAppInfoInDB: async (payload, moduleId = 'canvas') => {
    const { appId } = get().appStore.modules[moduleId].app;

    if (!appId || isEmpty(payload)) return;

    try {
      await appsService.saveApp(appId, payload);
      get().updateAppData(convertKeysToCamelCase(payload), moduleId);
    } catch (error) {
      console.log(error);
    }
  },
});
