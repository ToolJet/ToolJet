import { appsService, appVersionService } from '@/_services';
import { decimalToHex, APP_HEADER_HEIGHT, QUERY_PANE_HEIGHT } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import toast from 'react-hot-toast';
import DependencyGraph from './DependencyClass';
import { getWorkspaceId } from '@/_helpers/utils';
import { navigate } from '@/AppBuilder/_utils/misc';
import queryString from 'query-string';
import { replaceEntityReferencesWithIds, baseTheme } from '../utils';
import _, { isEmpty, has } from 'lodash';
import { getSubpath } from '@/_helpers/routes';
import { v4 as uuidv4 } from 'uuid';
import { yieldToMain } from '../batchManager';

const initialState = {
  isSaving: false,
  globalSettings: {
    theme: baseTheme,
  },
  pageLoader: false,
  pageSwitchInProgress: false,
  isTJDarkMode: localStorage.getItem('darkMode') === 'true',
  isViewer: false,
  themeChanged: false,
  isComponentLayoutReady: false,
  pageKey: uuidv4(),
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
    const {
      currentLayout,
      getCurrentMode,
      setCanvasHeight,
      temporaryLayouts,
      getResolvedValue,
      pageSettings,
      getPagesSidebarVisibility,
      license,
      getCurrentAdditionalActionValue,
    } = get();
    const currentMode = getCurrentMode(moduleId);

    // Only keep canvas components (components with no parent) & show on layout true
    const currentMainCanvasComponents = Object.entries(components)
      .filter(
        ([key, component]) =>
          !component?.component?.parent &&
          getResolvedValue(
            component?.component?.definition?.others[currentLayout === 'mobile' ? 'showOnMobile' : 'showOnDesktop']
              .value
          )
      )
      .map(([key, component]) => {
        return {
          ...component,
          id: component.id || key,
        };
      });

    // Use the effective layout per component (temporary override if reflowed,
    // else authored) so collapsed widgets shrink the canvas bottom.
    const maxHeight = currentMainCanvasComponents.reduce((max, component) => {
      const layout = component?.layouts?.[currentLayout];
      if (!layout) {
        return max;
      }

      const visibility = getCurrentAdditionalActionValue(component.id, null, 'isVisible', 'visibility', moduleId);
      if (currentMode === 'view' && !visibility) {
        return max;
      }
      const temporaryLayout = temporaryLayouts?.[component.id];
      const top = temporaryLayout?.top ?? layout.top;
      const height = visibility ? temporaryLayout?.height ?? layout.height : 10;
      return Math.max(max, top + height);
    }, 0);

    const isLicensed =
      !_.get(license, 'featureAccess.licenseStatus.isExpired', true) &&
      _.get(license, 'featureAccess.licenseStatus.isLicenseValid', false);

    const { position, hideHeader, hideLogo } = pageSettings?.definition?.properties || {};
    const headerHidden = isLicensed ? hideHeader : false;
    const logoHidden = isLicensed ? hideLogo : false;
    const isPagesSidebarHidden = getPagesSidebarVisibility(moduleId);
    const pageMenuHeight = position === 'top' && (!headerHidden || !logoHidden || !isPagesSidebarHidden) ? 60 : 0;

    // Embedded module with dynamic height enabled on its ModuleViewer instance:
    // size the inner canvas to its content (no 100vh floor / bottom padding) so
    // the instance widget can be DOM-measured and reflow its outer siblings,
    // the same way other leaf dynamic-height widgets are measured.
    if (moduleId !== 'canvas' && get().checkIfComponentIsModule(moduleId, 'canvas')) {
      const isInstanceDynamicHeight =
        get().getResolvedComponent(moduleId, null, 'canvas')?.properties?.dynamicHeight === true;
      if (isInstanceDynamicHeight && get().getCurrentMode('canvas') === 'view') {
        // Size the inner canvas to its REFLOWED content. Use each root
        // component's effective layout (temp height when present, else
        // canonical) — never max(canonical, temp). Flooring at the authored
        // ModuleContainer height would keep the module tall after a
        // collapseWhenHidden child hides and the root's temp height shrinks.
        const dynamicContentHeight = currentMainCanvasComponents.reduce((max, component) => {
          const canonical = component?.layouts?.[currentLayout];
          if (!canonical) {
            return max;
          }
          const visibility = getCurrentAdditionalActionValue(component.id, null, 'isVisible', 'visibility', moduleId);
          if (!visibility) {
            return max;
          }
          const temp = temporaryLayouts?.[component.id];
          const top = temp?.top ?? canonical.top;
          const height = temp?.height ?? canonical.height;
          return Math.max(max, top + height);
        }, 0);
        setCanvasHeight(`${Math.max(dynamicContentHeight, 40)}px`, moduleId);
        return;
      }
    }

    const bottomPadding = currentMode === 'view' ? 100 : 300;
    const frameHeight =
      currentMode === 'view' ? pageMenuHeight : APP_HEADER_HEIGHT + QUERY_PANE_HEIGHT + pageMenuHeight + 8 * 2; // 8 is padding on each side in edit mode, multiplied by 2 for top & bottom padding
    const canvasHeight = `max(100vh - ${frameHeight}px, ${maxHeight + bottomPadding}px)`;
    setCanvasHeight(canvasHeight, moduleId);
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

    if (get().pageSwitchInProgress) {
      toast('Please wait, page switch in progress', {
        icon: '⚠️',
      });
      return;
    }

    // Set the flag synchronously before the first yieldToMain so rapid back-to-back
    // switchPage calls don't slip through the guard above while doSwitch is awaiting.
    get().setPageSwitchInProgress(true);

    const doSwitch = async () => {
      const {
        setCurrentPageId,
        setComponentNameIdMapping,
        initDependencyGraph,
        setQueryMapping,
        cleanUpStore,
        clearTemporaryLayouts,
        setResolvedGlobals,
        setResolvedPageConstants,
        setIsComponentLayoutReady,
        getCurrentPageId,
        startExposedValueBatch,
        license,
        modules: {
          canvas: { pages },
        },
        getCurrentMode,
        setPageLoader,
      } = get();
      const isPreview = getCurrentMode(moduleId) !== 'edit';

      setPageLoader(true);
      await yieldToMain(); // Paint the loader before doing heavy work

      // Capture the current page BEFORE updating so isSamePage is correct.
      // Reading getCurrentPageId after setCurrentPageId would always return pageId
      // (same-page), making the check always true.
      const previousPageId = getCurrentPageId(moduleId);
      const isSamePage = previousPageId === pageId;

      cleanUpStore(true);
      clearTemporaryLayouts();
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

      if (isSamePage) {
        set((state) => {
          state.pageKey = uuidv4();
        });
      }

      const queryParamsString = filteredQueryParams.map(([key, value]) => `${key}=${value}`).join('&');
      const slug = get().appStore.modules[moduleId].app.slug;
      const subpath = getSubpath();

      if (!isBackOrForward) {
        const toNavigate = `${subpath ? `${subpath}` : ''}/${
          isPreview ? 'applications' : `${getWorkspaceId() + '/apps'}`
        }/${slug ?? appId}/${handle}?${queryParamsString}`;
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
      setIsComponentLayoutReady(false, moduleId);
      await yieldToMain(); // Let React commit all state changes before showing the Container

      startExposedValueBatch();
      setPageLoader(false);
    };

    doSwitch().catch((error) => {
      console.error('Page switch failed:', error);
      get().setPageLoader(false);
      get().setPageSwitchInProgress(false);
      get().flushExposedValueBatch();
    });
  },
  setPageSwitchInProgress: (isInProgress) =>
    set(() => ({ pageSwitchInProgress: isInProgress }), false, 'setPageSwitchInProgress'),
  setPageLoader: (isInProgress) => set(() => ({ pageLoader: isInProgress }), false, 'setPageLoader'),

  cleanUpStore: (isPageSwitch = false, moduleId) => {
    const { resetUndoRedoStack, initModules, clearSelectedComponents } = get();
    resetUndoRedoStack();
    clearSelectedComponents();
    set((state) => {
      state.modules.canvas.componentNameIdMapping = {};
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
  getAppType: (moduleId = 'canvas') => {
    return get().appStore.modules[moduleId].app.appType || 'front-end';
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

  checkIfLicenseNotValid: () => {
    const { featureAccess } = get().license;
    const licenseStatus = featureAccess?.licenseStatus;
    // When purchased, then isExpired key is also avialale else its not available
    if (licenseStatus) {
      if (has(licenseStatus, 'isExpired')) {
        return licenseStatus?.isExpired;
      }
      return !licenseStatus?.isLicenseValid;
    }
  },
});
