import { useCallback, useEffect, useRef, useState } from 'react';
import {
  appEnvironmentService,
  appService,
  appsService,
  appVersionService,
  dataqueryService,
  dataQueryFolderService,
  orgEnvironmentConstantService,
  authenticationService,
  customStylesService,
} from '@/_services';
import useStore from '@/AppBuilder/_stores/store';
import { camelCase, isEmpty, mapKeys, noop } from 'lodash';
import { usePrevious } from '@dnd-kit/utilities';
import { deepCamelCase } from '@/_helpers/appUtils';
import { useEventActions } from '../_stores/slices/eventsSlice';
import { setSuppressQueryRerun } from '@/AppBuilder/_stores/slices/componentsSlice';
import useRouter from '@/_hooks/use-router';
import { extractEnvironmentConstantsFromConstantsList } from '../_utils/misc';
import { shallow } from 'zustand/shallow';
import { fetchAndSetWindowTitle, pageTitles, retrieveWhiteLabelText } from '@white-label/whiteLabelling';
import queryString from 'query-string';
import { distinctUntilChanged } from 'rxjs';
import { baseTheme, convertAllKeysToSnakeCase } from '../_stores/utils';
import { getPreviewQueryParams, redirectToErrorPage, getSubpath, replaceEditorURL } from '@/_helpers/routes';
import { ERROR_TYPES } from '@/_helpers/constants';
import { useLocation, useParams } from 'react-router-dom';
import { useMounted } from '@/_hooks/use-mount';
import useThemeAccess from './useThemeAccess';
import toast from 'react-hot-toast';
import { initializeLibraries, executePreloadedJS } from '@/AppBuilder/_helpers/libraryLoader';

/* 
Whitelist of cross-cutting query option keys that need snake→camel normalization.
Editor (data-queries API) returns these as camelCase, but public/released/preview-for-version
paths return them as snake_case. We only normalize keys here — REST/TooljetDB/gRPC editors
rely on snake_case for their own option keys (query_timeout, retry_network_errors,
where_filters, proto_files, etc.) and must NOT be touched.
*/

const QUERY_OPTION_KEYS_TO_NORMALIZE = [
  'enableTransformation',
  'transformationLanguage',
  'runOnPageLoad',
  'runOnDependencyChange',
  'requestConfirmation',
  'requestConfirmationFx',
  'confirmationMessage',
  'showSuccessNotification',
  'successMessage',
  'notificationDuration',
  'disableQuery',
  'disabledMessage',
];

const snakeCase = (camel) => camel.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);

export const normalizeQueryTransformationOptions = (query) => {
  if (!query?.options) return query;
  QUERY_OPTION_KEYS_TO_NORMALIZE.forEach((camelKey) => {
    const snakeKey = snakeCase(camelKey);
    if (query.options[snakeKey] !== undefined) {
      const value = query.options[snakeKey];
      delete query.options[snakeKey];
      if (query.options[camelKey] === undefined) {
        query.options[camelKey] = value;
      }
    }
  });
  return query;
};

const useAppData = (
  appId,
  moduleId,
  darkMode,
  mode = 'edit',
  { environmentId, versionId, componentName } = {},
  moduleMode = false,
  appSlug
) => {
  const mounted = useMounted();
  const initModules = useStore((state) => state.initModules);
  moduleMode && !mounted && initModules(moduleId);
  // Reset per-module slices on in-session pin change — stale graph references old-version IDs.
  const lastModuleVersionRef = useRef(versionId);
  const { state } = useLocation();
  const [currentSession, setCurrentSession] = useState();

  const setEditorLoading = useStore((state) => state.setEditorLoading);
  const setApp = useStore((state) => state.setApp);
  const user = useStore((state) => state.user);
  const setCurrentVersionId = useStore((state) => state.setCurrentVersionId);
  const currentVersionId = useStore((state) => state.currentVersionId);
  const setPages = useStore((state) => state.setPages);
  const setPageSettings = useStore((state) => state.setPageSettings);
  const setQueries = useStore((state) => state.dataQuery.setQueries);
  const setFolders = useStore((state) => state.queryFolders?.setFolders);
  const setFolderMappings = useStore((state) => state.queryFolders?.setFolderMappings);
  const setSelectedQuery = useStore((state) => state.queryPanel.setSelectedQuery);
  const setComponentNameIdMapping = useStore((state) => state.setComponentNameIdMapping);
  const initDependencyGraph = useStore((state) => state.initDependencyGraph);
  const setCurrentPageId = useStore((state) => state.setCurrentPageId);
  const updateEventsField = useEventActions().updateEventsField;
  const setCurrentMode = useStore((state) => state.setCurrentMode);
  const setAppHomePageId = useStore((state) => state.setAppHomePageId);
  const setPreviewData = useStore((state) => state.queryPanel.setPreviewData);
  const setIsQueryPaneExpanded = useStore((state) => state.queryPanel.setIsQueryPaneExpanded);
  // const fetchDataSources = useStore((state) => state.fetchDataSources);
  const fetchGlobalDataSources = useStore((state) => state.fetchGlobalDataSources);
  const getAllGlobalDataSourceList = useStore((state) => state.getAllGlobalDataSourceList);
  const setResolvedConstants = useStore((state) => state.setResolvedConstants);
  const setSecrets = useStore((state) => state.setSecrets);
  const setQueryMapping = useStore((state) => state.setQueryMapping);
  const setResolvedGlobals = useStore((state) => state.setResolvedGlobals);
  const setResolvedPageConstants = useStore((state) => state.setResolvedPageConstants);
  const updateFeatureAccess = useStore((state) => state.updateFeatureAccess);
  const computePageSettings = useStore((state) => state.computePageSettings);
  const setGlobalSettings = useStore((state) => state.setGlobalSettings);
  const runOnLoadQueries = useStore((state) => state.dataQuery.runOnLoadQueries);
  const handleEvent = useStore((state) => state.eventsSlice.handleEvent);
  const clearSelectedComponents = useStore((state) => state.clearSelectedComponents);
  const setCurrentPageHandle = useStore((state) => state.setCurrentPageHandle);
  const initialiseResolvedQuery = useStore((state) => state.initialiseResolvedQuery);
  const resetExposedValues = useStore((state) => state.resetExposedValues);
  const setEnvironmentLoadingState = useStore((state) => state.setEnvironmentLoadingState);
  const updateReleasedVersionId = useStore((state) => state.updateReleasedVersionId);
  const resetUndoRedoStack = useStore((state) => state.resetUndoRedoStack);
  const initSuggestions = useStore((state) => state.initSuggestions);
  const cleanUpStore = useStore((state) => state.cleanUpStore);
  const selectedEnvironment = useStore((state) => state.selectedEnvironment);
  const setIsEditorFreezed = useStore((state) => state.setIsEditorFreezed);
  const setPageSwitchInProgress = useStore((state) => state.setPageSwitchInProgress);
  const selectedVersion = useStore((state) => state.selectedVersion);
  const setIsPublicAccess = useStore((state) => state.setIsPublicAccess);
  const setJsLibraryRegistry = useStore((state) => state.setJsLibraryRegistry);
  const setJsLibraryLoading = useStore((state) => state.setJsLibraryLoading);
  const isLicenseFetched = useStore((state) => state.isLicenseFetched);
  const startExposedValueBatch = useStore((state) => state.startExposedValueBatch);
  const flushExposedValueBatch = useStore((state) => state.flushExposedValueBatch);

  const setModulesIsLoading = useStore((state) => state?.setModulesIsLoading ?? noop);
  const setModulesList = useStore((state) => state?.setModulesList ?? noop);
  const setModuleDefinition = useStore((state) => state?.setModuleDefinition ?? noop);
  const getModuleDefinition = useStore((state) => state?.getModuleDefinition ?? noop);
  const deleteModuleDefinition = useStore((state) => state?.deleteModuleDefinition ?? noop);
  // Subscribe to THIS module's cached definition so the child useAppData effect
  // re-fires when the parent's pull/version-switch refreshes the cache. Without
  // this, the effect's deps don't change on pull (versionId stays '' for unpinned)
  // and the ModuleViewer keeps showing pre-pull content.
  const cachedModuleDefinitionForApp = useStore((state) =>
    moduleMode ? state?.modulesStore?.moduleDefinition?.[appId] : null
  );

  const fetchAllModules = useCallback(async () => {
    const allModules = [];
    let currentPage = 1;
    let totalPages = 1;

    while (currentPage <= totalPages) {
      const data = await appsService.getAll(currentPage, '', '', 'module');
      const pageModules = data?.apps || [];

      allModules.push(...pageModules);

      const pageCount = Number(data?.meta?.total_pages);
      totalPages = Number.isFinite(pageCount) && pageCount > 0 ? pageCount : currentPage;
      currentPage += 1;
    }

    return allModules;
  }, []);

  const themeAccess = useThemeAccess();
  const detectThemeChange = useStore((state) => state.detectThemeChange);
  const setConversation = useStore((state) => state.ai?.setConversation);
  const setDocsConversation = useStore((state) => state.ai?.setDocsConversation);
  const sendMessage = useStore((state) => state.ai?.sendMessage);
  const getCreditBalance = useStore((state) => state.ai?.getCreditBalance);
  const setSelectedSidebarItem = useStore((state) => state.setSelectedSidebarItem);
  const toggleLeftSidebar = useStore((state) => state.toggleLeftSidebar);
  const pathParams = useParams();
  let slug = pathParams?.slug;

  const previousVersion = usePrevious(currentVersionId);
  const events = useStore((state) => state.eventsSlice.module[moduleId]?.events || []);
  const currentPageId = useStore((state) => state.modules[moduleId].currentPageId);
  const appMode = useStore((state) => state.globalSettings.appMode);
  const selectedTheme = useStore((state) => state.globalSettings.theme);
  const previousEnvironmentId = usePrevious(selectedEnvironment?.id);
  const isComponentLayoutReady = useStore((state) => state.appStore.modules[moduleId].isComponentLayoutReady);
  const pageSwitchInProgress = useStore((state) => state.pageSwitchInProgress);
  const licenseStatus = useStore((state) => state.isLicenseValid());
  const organizationId = useStore((state) => state.appStore.modules[moduleId].app.organizationId);
  const appName = useStore((state) => state.appStore.modules[moduleId].app.appName);
  const moduleAppNameFromList = useStore((state) => {
    if (!moduleMode) return null;
    const list = state.modulesStore?.modulesList ?? [];
    return list.find((m) => (m.co_relation_id ?? m.id) === appId)?.name ?? null;
  });

  // Used to trigger app refresh flow after restoring app history
  const restoreTimestamp = useStore((state) => state.restoreTimestamp);
  const previousRestoreTimestamp = usePrevious(restoreTimestamp);

  const location = useRouter().location;

  const initialLoadRef = useRef(true);
  const promptSentRef = useRef(false);
  const isPageSwitchRef = useRef(false);

  const appTypeRef = useRef(null);
  const { isReleasedVersionId } = useStore(
    (state) => ({
      isReleasedVersionId: state?.releasedVersionId == state.currentVersionId || state.isVersionReleased,
    }),
    shallow
  );

  const fetchAndInjectCustomStyles = async (isPublicAccess = false) => {
    try {
      const head = document.head || document.getElementsByTagName('head')[0];
      let styleTag = document.getElementById('workspace-custom-css');
      if (!styleTag) {
        // If it doesn't exist, create a new style tag and append it to the head
        styleTag = document.createElement('style');
        styleTag.type = 'text/css';
        styleTag.id = 'workspace-custom-css';
        head.appendChild(styleTag);
      }
      let data;
      if (!isPublicAccess) {
        data = await customStylesService.getForAppViewerEditor(false);
      } else {
        data = await customStylesService.getForPublicApp(slug);
      }
      styleTag.innerHTML = data?.css || null;
    } catch (error) {
      // Silently handle error - custom styles are optional
    }
  };

  useEffect(() => {
    if (pageSwitchInProgress && !moduleMode) {
      isPageSwitchRef.current = true;
      setPageSwitchInProgress(false);
    }
  }, [pageSwitchInProgress, moduleMode]);

  useEffect(() => {
    const subscription = authenticationService.currentSession
      .pipe(
        distinctUntilChanged((prev, curr) => {
          // Instance id is updated after page load, this custom comparison avoids instance_id in the comparison and prevent loadApplication from being called multiple times
          const clonedPrevState = { ...prev };
          const clonedCurrState = { ...curr };
          delete clonedPrevState.instance_id;
          delete clonedCurrState.instance_id;
          return JSON.stringify(clonedCurrState) === JSON.stringify(clonedPrevState);
        })
      )
      .subscribe(async (currentSession) => {
        setCurrentSession({
          authentication_failed: currentSession.authentication_failed,
          load_app: currentSession.load_app,
          currentUser: currentSession.current_user,
          role: currentSession.role,
          ssoUserInfo: currentSession?.current_user?.sso_user_info,
          groups: currentSession?.group_permissions
            ? ['all_users', ...currentSession.group_permissions.map((group) => group.name), currentSession?.role?.name]
            : ['all_users', currentSession?.role?.name],
        });
      });

    return () => {
      subscription && subscription.unsubscribe();
    };
  }, [moduleMode]);

  useEffect(() => {
    const exposedTheme =
      appMode && appMode !== 'auto' ? appMode : localStorage.getItem('darkMode') === 'true' ? 'dark' : 'light';
    setResolvedGlobals('theme', { name: exposedTheme }, moduleId);
  }, [appMode, darkMode, moduleId]);

  useEffect(() => {
    if (!currentSession) {
      return;
    }
    let cancelled = false;
    if (moduleMode && mounted && lastModuleVersionRef.current !== versionId) {
      initModules(moduleId);
    }
    lastModuleVersionRef.current = versionId;
    let appDataPromise;
    const queryParams = moduleMode ? {} : getPreviewQueryParams();
    const hasPreviewParams = !!(queryParams.version || queryParams.env);

    // Unauthenticated users must not access preview URLs even when the app is public.
    // load_app=true + authentication_failed=true is the session signal for "public app, no valid JWT".
    // Without this guard, isPublicAccess below evaluates to true (via the load_app && auth_failed branch)
    // and fetchAppBySlug is called, serving the released version to unauthenticated preview viewers.
    if (!moduleMode && hasPreviewParams && currentSession?.load_app && currentSession?.authentication_failed) {
      const subpath = getSubpath() ?? '';
      const redirectTo = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `${subpath}/applications/${slug}/login?redirectTo=${redirectTo}`;
      return;
    }

    const isPublicAccess =
      (currentSession?.load_app && currentSession?.authentication_failed) || (!queryParams.version && mode !== 'edit');
    const isPreviewForVersion = (mode !== 'edit' && queryParams.version) || isPublicAccess;

    if (moduleMode) {
      // The moduleDefinition cached by the parent app reflects the module from the parent's current
      // branch — not the specific version pinned on this ModuleViewer. Authenticated viewers call the
      // version API directly to get the correct pinned version. Public (unauthenticated) viewers
      // can't call that auth-gated API, so they fall back to the cached definition.
      const isUnauthenticated = currentSession?.load_app && currentSession?.authentication_failed;
      if (isUnauthenticated) {
        const moduleDefinition = getModuleDefinition(appId);
        if (moduleDefinition) {
          // Deep-clone: Zustand/Immer returns frozen objects, but normalizeQueryTransformationOptions mutates in-place
          appDataPromise = Promise.resolve(JSON.parse(JSON.stringify(moduleDefinition)));
        } else {
          // versionId is a versionName string (cross-workspace stable, git-tag-backed) when the
          // bridge field is populated, a UUID module_reference_id for legacy same-workspace-only
          // pins, or '' when unpinned. The server resolver handles all three cases.
          appDataPromise = appVersionService.getModuleVersionData(appId, versionId, mode);
        }
      } else if (versionId) {
        // Pinned: call the by-correlation endpoint with the module_reference_id ref.
        appDataPromise = appVersionService.getModuleVersionData(appId, versionId, mode);
      } else {
        // Unpinned: always hit the backend — cached definition may be from the default branch,
        // not the consumer's feature branch. Server resolver correctly returns the current
        // branch's draft (or 404 if nothing is available there).
        appDataPromise = appVersionService.getModuleVersionData(appId, versionId, mode);
      }
    } else {
      if (isPublicAccess) {
        appDataPromise = appService.fetchAppBySlug(slug);
      } else {
        appDataPromise = isPreviewForVersion
          ? appVersionService.getAppVersionData(appId, versionId, mode)
          : appService.fetchApp(appId);
      }
    }

    // const appDataPromise = appService.fetchApp(appId);
    appDataPromise
      .then(async (result) => {
        if (cancelled) return;
        // Reset the AppBuilder store before populating the new app. The dependency graph and
        // resolvedStore are module-level singletons that are NOT reset between apps; on clone -> open
        // the graph still holds the previous app's edges, so setResolvedGlobals below fires a
        // dependency cascade over them before initDependencyGraph rebuilds — dereferencing resolved
        // entries that don't exist in the new app and throwing (caught + swallowed -> blank editor).
        // cleanUpStore installs a fresh graph + clears resolved values so the cascade starts clean.
        // Canvas-only (mirrors the version-change effect's own cleanUpStore); modules manage their own.
        if (!moduleMode) cleanUpStore(false);
        let appData = { ...result };
        // The module-by-name endpoint returns the module alone, without `editorEnvironment`
        // (that field is only populated by the parent app's fetchApp response). Fall back to
        // the environmentId prop so downstream `.id` access doesn't throw and surface a
        // misleading "Error fetching module data" toast.
        let editorEnvironment = result.editorEnvironment ?? (moduleMode ? { id: environmentId } : undefined);
        let editingVersion = result.editing_version;
        if (isPreviewForVersion) {
          const rawDataQueries = appData?.data_queries;
          const rawEditingVersionDataQueries = appData?.editing_version?.data_queries;
          appData = convertAllKeysToSnakeCase(appData);

          appData.data_queries = rawDataQueries;
          if (appData.editing_version && rawEditingVersionDataQueries) {
            appData.editing_version.data_queries = rawEditingVersionDataQueries;
          }

          editorEnvironment = {
            id: environmentId,
            name: queryParams.env,
          };
        }

        let constantsResp;
        if (mode !== 'edit') {
          try {
            const queryParams = { slug: slug };

            const viewerEnvironment = await appEnvironmentService.getEnvironment(environmentId, queryParams);

            editorEnvironment = {
              id: viewerEnvironment?.environment?.id,
              name: viewerEnvironment?.environment?.name,
            };
            constantsResp =
              isPublicAccess && appData.is_public
                ? await orgEnvironmentConstantService.getConstantsFromPublicApp(
                    slug,
                    viewerEnvironment?.environment?.id
                  )
                : await orgEnvironmentConstantService.getConstantsFromEnvironment(viewerEnvironment?.environment?.id);
          } catch (error) {
            console.error('Error fetching viewer environment:', error);
          }
        }

        if (mode === 'edit' && editorEnvironment?.id) {
          constantsResp = await orgEnvironmentConstantService.getConstantsFromEnvironment(editorEnvironment?.id);
        }
        // get the constants for specific environment
        if (!constantsResp) {
          constantsResp = { constants: [] };
        }
        constantsResp.constants = extractEnvironmentConstantsFromConstantsList(
          constantsResp?.constants,
          editorEnvironment?.name
        );

        !moduleMode && setIsPublicAccess(isPublicAccess && mode !== 'edit' && appData.is_public);

        fetchAndInjectCustomStyles(isPublicAccess && mode !== 'edit' && appData.is_public);

        const pages = appData.pages.map((page) => {
          return page;
        });
        const conversation = appData.ai_conversation;
        const docsConversation = appData.ai_conversation_learn;
        if (!moduleMode && setConversation && setDocsConversation) {
          setConversation(conversation);
          setDocsConversation(docsConversation);
          // important to control ai inputs
          getCreditBalance();
        }

        // if app was created from propmt, and no earlier messages are present in the conversation, send the prompt message

        // handles the getappdataby slug api call. Gets the homePageId from the appData.
        const homePageId =
          appData.editing_version?.homePageId ||
          appData.editing_version?.home_page_id ||
          appData.home_page_id ||
          appData.homePageId;

        appTypeRef.current = appData.type;

        // appId prop is undefined for public app viewers (AppsRoute skips onValidSession → extraProps never set).
        // Fall back to appData response so isReleasedApp evaluates correctly and the title omits "Preview -".
        const effectiveAppId = appId || appData?.id || appData?.appId || appData?.app_id;
        const isReleasedApp = effectiveAppId && appSlug && !environmentId && !versionId ? true : false; //Condition based on response from validate-private-app-access and validate-released-app-access apis

        setApp(
          {
            appName: appData.branch_app_name || appData.name,
            appId: appId || appData?.appId || appData?.app_id,
            slug: appData.slug,
            currentAppEnvironmentId: editorEnvironment?.id,
            isMaintenanceOn:
              'is_maintenance_on' in result
                ? result.is_maintenance_on
                : 'isMaintenanceOn' in result
                ? result.isMaintenanceOn
                : false,
            organizationId: appData.organizationId || appData.organization_id,
            homePageId: homePageId,
            isPublic: appData.is_public,
            creationMode: appData.creation_mode,
            appGeneratedFromPrompt: appData.app_generated_from_prompt,
            aiGenerationMetadata: appData.ai_generation_metadata || {},
            appBuilderMode: appData.app_builder_mode || 'visual',
            isReleasedApp: isReleasedApp,
            appType: appData.type,
            currentVersionId: appData.editing_version?.id || appData.current_version_id,
            co_relation_id: appData.co_relation_id,
          },
          moduleId
        );

        const liveMessages = useStore.getState().ai?.conversation?.aiConversationMessages;
        if (
          state?.prompt &&
          !promptSentRef.current &&
          (conversation?.aiConversationMessages || []).length === 0 &&
          (liveMessages || []).length === 0
        ) {
          promptSentRef.current = true;
          setSelectedSidebarItem('tooljetai');
          toggleLeftSidebar(true);
          sendMessage(state.prompt, {}, {}, moduleId);
          setIsQueryPaneExpanded(false);
          // Clear prompt from navigation state so it doesn't re-trigger on page refresh
          const { prompt: _prompt, ...restUsrState } = window.history.state?.usr || {};
          window.history.replaceState({ ...window.history.state, usr: restUsrState }, '', window.location.href);
        }

        if (initialLoadRef.current && !isPublicAccess && mode === 'edit') {
          getAllGlobalDataSourceList(appData.organizationId || appData.organization_id);
        }

        if (appData.app_builder_mode === 'ai') {
          setSelectedSidebarItem('tooljetai');
          toggleLeftSidebar(true);
          setIsQueryPaneExpanded(false);
        }

        if (!moduleMode) {
          setIsEditorFreezed(appData.should_freeze_editor);
          const global_settings = mapKeys(
            appData.editing_version?.global_settings || appData.global_settings,
            (value, key) => camelCase(key)
          );
          if (!global_settings?.theme) {
            global_settings.theme = baseTheme;
          }
          setGlobalSettings(global_settings);
        }
        setPages(pages, moduleId);
        if (!moduleMode) {
          setPageSettings(
            computePageSettings(deepCamelCase(appData?.editing_version?.page_settings ?? appData?.page_settings))
          );
        }

        // set starting page as homepage initially
        let startingPage = appData.pages.find((page) => page.id === homePageId);

        //no access to homepage, set to the next available page
        if (startingPage?.restricted && mode === 'view') {
          startingPage = appData.pages.find((page) => !page?.restricted && !page?.isPageGroup && !page?.disabled);
        }

        if (initialLoadRef.current && !moduleMode) {
          // if initial load, check if the path has a page handle and set that as the starting page
          const initialLoadPath = location.pathname.split('/').pop();

          const page = appData.pages.find((page) => page.handle === initialLoadPath && !page.isPageGroup);
          if (page) {
            // if page is disabled, and not editing redirect to home page
            const shouldRedirect = mode !== 'edit' && (page?.restricted || page?.disabled);

            if (shouldRedirect) {
              const newUrl = window.location.href.replace(initialLoadPath, startingPage.handle);
              window.history.replaceState(null, null, newUrl);

              if (page?.restricted) {
                toast.error('Access to this page is restricted. Contact admin to know more.', {
                  className: 'text-nowrap w-auto mw-100',
                });
              }
            } else {
              startingPage = page;
            }
          }

          // navigate(`/${getWorkspaceId()}/apps/${slug ?? appId}/${startingPage.handle}`);
        }

        // Add page id and handle to the state on initial load
        const currentState = window.history.state || {};
        const pageInfo = {
          id: startingPage.id,
          handle: startingPage.handle,
        };
        const newState = { ...currentState, ...pageInfo };
        window.history.replaceState(newState, '', window.location.href);

        // Sync the browser URL if it was opened with the app UUID but the app has a proper slug
        if (appData.slug && mode === 'edit' && !moduleMode) {
          const currentUrlSlug = window.location.pathname.split('/apps/')[1]?.split('/')[0];
          if (currentUrlSlug && currentUrlSlug !== appData.slug) {
            replaceEditorURL(appData.slug, startingPage.handle);
          }
        }

        setCurrentPageHandle(startingPage.handle, moduleId);
        setCurrentPageId(startingPage.id, moduleId);
        setResolvedPageConstants(
          {
            id: startingPage?.id,
            handle: startingPage?.handle,
            name: startingPage?.name,
          },
          moduleId
        );
        setComponentNameIdMapping(moduleId);
        updateEventsField('events', appData.events, moduleId);
        if (!moduleMode) {
          updateFeatureAccess();
          setCurrentVersionId(appData.editing_version?.id || appData.current_version_id);
        }
        setAppHomePageId(homePageId, moduleId);
        if (!moduleMode && appData.modules) {
          setModuleDefinition(appData.modules);
        }

        const queryData =
          isPublicAccess || (mode !== 'edit' && appData.is_public)
            ? appData
            : await dataqueryService.getAll(appData.editing_version?.id || appData.current_version_id, mode);
        const dataQueries = queryData.data_queries || queryData?.editing_version?.data_queries;
        dataQueries.forEach((query) => normalizeQueryTransformationOptions(query));
        setQueries(dataQueries, moduleId);
        if (dataQueries?.length > 0) {
          !moduleMode && setSelectedQuery(dataQueries[0]?.id);
          initialiseResolvedQuery(
            dataQueries.map((query) => query.id),
            moduleId
          );
        }

        if (mode === 'edit' && !moduleMode && setFolders) {
          const versionId = appData.editing_version?.id || appData.current_version_id;
          dataQueryFolderService
            .getAll(versionId)
            .then((folderData) => {
              setFolders(folderData.folders ?? []);
              setFolderMappings(folderData.folderMappings ?? []);
            })
            .catch(() => {});
        }

        const constants = constantsResp?.constants;

        if (constants) {
          const orgConstants = {};
          const orgSecrets = {};
          constants.map((constant) => {
            if (constant.type !== 'Secret') {
              orgConstants[constant.name] = constant.value;
            } else {
              orgSecrets[constant.name] = constant.value;
            }
          });
          setResolvedConstants(orgConstants, moduleId);
          setSecrets(orgSecrets, moduleId);
        }
        setQueryMapping(moduleId);

        setResolvedGlobals(
          'environment',
          selectedEnvironment ? { id: selectedEnvironment.id, name: selectedEnvironment.name } : editorEnvironment,
          moduleId
        );
        setResolvedGlobals(
          'appVersion',
          { name: editingVersion?.display_name || editingVersion?.displayName || editingVersion?.name },
          moduleId
        );
        setResolvedGlobals('mode', { value: mode }, moduleId);
        setResolvedGlobals(
          'currentUser',
          {
            ...user,
            groups: currentSession?.groups,
            role: currentSession?.role?.name,
            ssoUserInfo: currentSession?.ssoUserInfo,
            ...(currentSession?.currentUser?.metadata && !isEmpty(currentSession?.currentUser?.metadata)
              ? { metadata: currentSession?.currentUser?.metadata }
              : {}),
          },
          moduleId
        );
        setResolvedGlobals('urlparams', JSON.parse(JSON.stringify(queryString.parse(location?.search))), moduleId);
        initDependencyGraph(moduleId);
        setCurrentMode(mode, moduleId); // TODO: set mode based on the slug/appDef

        // fetchDataSources(appData.editing_version.id, editorEnvironment.id);
        if (!isPublicAccess && !moduleMode) {
          const envFromQueryParams = mode === 'view' && new URLSearchParams(location?.search)?.get('env');
          // Use versionId from URL if available (preview mode), otherwise use editing version
          const versionIdToInit = versionId || appData.editing_version?.id || appData.current_version_id;
          useStore.getState().init(versionIdToInit, envFromQueryParams);
          fetchGlobalDataSources(appData.organization_id, versionIdToInit, editorEnvironment.id);
        }
        if (!moduleMode) {
          useStore.getState().updateEditingVersion(appData.editing_version?.id || appData.current_version_id); //check if this is needed
          // On workspace feature branches, set releasedVersionId to null so that
          // selectedVersionId === releasedVersionId doesn't falsely trigger freeze
          updateReleasedVersionId(appData.current_version_id);
        }

        startExposedValueBatch();
        setEditorLoading(false, moduleId);
        initialLoadRef.current = false;
      })
      .catch((_error) => {
        if (cancelled) return;
        // Surface load failures — this catch otherwise swallows the error and silently blanks the
        // editor, which makes load-path regressions (e.g. a throw during dependency resolution)
        // invisible in the console.
        // eslint-disable-next-line no-console
        console.error('Error loading app data', _error);
        setEditorLoading(false, moduleId);
        if (moduleMode) {
          const versionLabel = versionId || 'unpinned';
          const widgetName = componentName ?? moduleId;
          useStore.getState().debugger.log({
            logLevel: 'error',
            type: 'module',
            kind: 'module',
            key: widgetName,
            message: 'Module version not found, re-select the version to load it',
            errorTarget: 'Modules',
            error: {
              description: _error?.data?.message || 'Module version not found',
              module: appName || moduleAppNameFromList || widgetName,
              version: versionLabel,
            },
            timestamp: new Date().toISOString(),
          });
          toast.error('Error fetching module data');
          return;
        }
        if (isPublicAccess && _error?.data?.statusCode === 501) {
          redirectToErrorPage(ERROR_TYPES.URL_UNAVAILABLE, {});
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setApp, setEditorLoading, currentSession, mode, versionId, cachedModuleDefinitionForApp]);

  useEffect(() => {
    if (isComponentLayoutReady && isLicenseFetched) {
      setSuppressQueryRerun(moduleId, true);

      // The flush runs the initial-settle dependency cascade synchronously.
      // Suppress dependency-triggered query re-runs for THIS module during that window,
      // so queries don't run on load when components publish their initial exposed values.
      // Only Genuine post-load changes cascade outside this window and rerun as expected.
      try {
        flushExposedValueBatch();
      } finally {
        setSuppressQueryRerun(moduleId, false);
      }

      mode === 'edit' && initSuggestions(moduleId);

      const loadLibrariesAndRun = async () => {
        // Load JS libraries and preloaded JS from globalSettings before running queries.
        // The BE strips libraries from globalSettings when the org is not licensed, so
        // no feature-access check is needed here.
        const globalSettings = useStore.getState().globalSettings;
        const jsLibraries = globalSettings?.libraries?.javascript || [];
        const preloadedJS = globalSettings?.preloadedScript?.javascript || '';

        if (jsLibraries.length > 0 || preloadedJS) {
          setJsLibraryLoading(true);
          try {
            const registry = jsLibraries.length > 0 ? await initializeLibraries(jsLibraries) : {};

            // Execute preloaded JS — its returned exports merge into the registry
            const preloadedExports = await executePreloadedJS(preloadedJS, registry);
            const fullRegistry = { ...registry, ...preloadedExports };

            setJsLibraryRegistry(fullRegistry);
          } catch (error) {
            toast.error(`Failed to load JS libraries: ${error?.message ?? String(error)}`);
          } finally {
            setJsLibraryLoading(false);
          }
        }

        const currentPageEvents = events.filter((event) => event.target === 'page' && event.sourceId === currentPageId);
        if (isPageSwitchRef.current) {
          // Page switch: skip runOnLoadQueries and only fire onPageLoad.
          // Running runOnLoadQueries here would create an infinite loop if any
          // runOnPageLoad query has a success/failure event that navigates to another
          // page — each navigation would re-trigger queries which re-trigger navigation.
          // Apps that need data refresh on navigation should trigger queries from the
          // onPageLoad event instead of relying on runOnPageLoad.
          isPageSwitchRef.current = false;
          handleEvent('onPageLoad', currentPageEvents, {});
        } else {
          runOnLoadQueries(moduleId).then(() => {
            handleEvent('onPageLoad', currentPageEvents, {});
          });
        }
      };

      loadLibrariesAndRun();
    }
  }, [isComponentLayoutReady, isLicenseFetched, moduleId, mode]);

  useEffect(() => {
    if (moduleId !== 'canvas') return;
    fetchAndSetWindowTitle({
      page: mode === 'edit' ? pageTitles.EDITOR : pageTitles.VIEWER,
      appName: appName,
      mode: mode,
      isReleased: isReleasedVersionId,
      licenseStatus: licenseStatus,
    });
  }, [appName, isReleasedVersionId, licenseStatus, mode, moduleId]);

  useEffect(() => {
    const root = document.documentElement;
    const mode = appMode && appMode !== 'auto' ? appMode : darkMode ? 'dark' : 'light';
    const themeObj = !themeAccess ? baseTheme?.definition : selectedTheme?.definition || {};
    Object.keys(themeObj).forEach((category) => {
      const categoryObj = themeObj[category];
      Object.keys(categoryObj).forEach((property) => {
        const propertyObj = categoryObj[property];
        Object.keys(propertyObj).forEach((type) => {
          const color = propertyObj[type][mode];
          root.style.setProperty(`--cc-${camelCase(type)}-${camelCase(category)}`, `${color}`);
          if (type === 'placeholder' && category === 'text') {
            root.style.setProperty(`--cc-default-icon`, `${color}`);
          }
          if (category === 'text' && type === 'placeholder') {
            root.style.setProperty(`--cc-default-icon-light`, `${propertyObj[type]['light']}`);
            root.style.setProperty(`--cc-default-icon-dark`, `${propertyObj[type]['dark']}`);
            root.style.setProperty(`--cc-placeholder-text-light`, `${propertyObj[type]['light']}`);
            root.style.setProperty(`--cc-placeholder-text-dark`, `${propertyObj[type]['dark']}`);
          }
        });
      });
    });
    detectThemeChange();
  }, [darkMode, appMode, selectedTheme, !!themeAccess]);

  useEffect(() => {
    if (moduleMode) return;
    const exposedTheme =
      appMode && appMode !== 'auto' ? appMode : localStorage.getItem('darkMode') === 'true' ? 'dark' : 'light';
    const isEnvChanged =
      selectedEnvironment?.id && previousEnvironmentId && previousEnvironmentId != selectedEnvironment?.id;
    const isVersionChanged = currentVersionId && previousVersion && currentVersionId != previousVersion;
    const isAppHistoryChanged = restoreTimestamp != previousRestoreTimestamp;

    // currentVersionId (set by fetchApp -> setApp) and selectedVersion (set by the
    // env-dropdown init) are written by two independent async flows. On clone -> editor
    // open, currentVersionId flips to the new app's version before selectedVersion does,
    // so firing here would call getAppVersionData(newAppId, previousAppVersionId) -> 404.
    // Genuine version switches always move both together, so requiring agreement skips
    // only the stale cross-app window.
    const isVersionConsistent = selectedVersion?.id && selectedVersion.id === currentVersionId;

    if (isEnvChanged || (isVersionChanged && isVersionConsistent) || isAppHistoryChanged) {
      setEditorLoading(true, moduleId);
      clearSelectedComponents();
      if (isEnvChanged) {
        setEnvironmentLoadingState('loading');
      }
      appVersionService.getAppVersionData(appId, selectedVersion?.id, mode).then(async (appData) => {
        cleanUpStore(false);
        const { should_freeze_editor } = appData;
        setIsEditorFreezed(should_freeze_editor);

        resetExposedValues(moduleId, { resetConstants: isEnvChanged });
        resetUndoRedoStack();
        const pages = appData.pages.map((page) => page);
        setSelectedQuery(null);
        setPreviewData(null);
        // See comment at first effectiveAppId usage above
        const effectiveAppId = appId || appData?.id || appData?.appId || appData?.app_id;
        const isReleasedApp = effectiveAppId && appSlug && !environmentId && !versionId ? true : false; //Condition based on response from validate-private-app-access and validate-released-app-access apis
        setApp({
          appName: appData.branch_app_name || appData.name,
          appId: appData.id,
          slug: appData.slug,
          creationMode: appData.creationMode,
          isMaintenanceOn:
            'is_maintenance_on' in appData
              ? appData.is_maintenance_on
              : 'isMaintenanceOn' in appData
              ? appData.isMaintenanceOn
              : false,
          organizationId: appData.organizationId || appData.organization_id,
          homePageId: appData.editing_version.homePageId,
          isPublic: appData.isPublic,
          isReleasedApp: isReleasedApp,
          appType: appData.type,
          appGeneratedFromPrompt: appData.appGeneratedFromPrompt,
          aiGenerationMetadata: appData.ai_generation_metadata || {},
          appBuilderMode: appData.appBuilderMode || 'visual',
          co_relation_id: appData.co_relation_id,
        });

        setGlobalSettings(
          mapKeys(appData.editing_version?.globalSettings || appData.globalSettings, (value, key) => camelCase(key))
        );

        setPages(pages, moduleId);
        setPageSettings(
          computePageSettings(deepCamelCase(appData?.editing_version?.pageSettings ?? appData?.pageSettings))
        );
        let startingPage = appData.pages.find(
          (page) => page.id === appData.editing_version.home_page_id || appData.editing_version.homePageId
        );
        setCurrentPageId(startingPage.id, moduleId);
        setComponentNameIdMapping(moduleId);
        updateEventsField('events', appData.events, moduleId);

        // Refresh the module-definition cache so unpinned ModuleViewers pick up
        // post-pull / post-version-switch content without a full page refresh.
        // Mirrors the initial-load population at the !moduleMode branch above.
        if (!moduleMode && appData.modules) {
          setModuleDefinition(appData.modules);
        }
        // const queryData = await dataqueryService.getAll(currentVersionId);

        if (isEnvChanged) {
          setEnvironmentLoadingState('completed');

          const envConstResp = await orgEnvironmentConstantService.getConstantsFromEnvironment(selectedEnvironment.id);
          const { constants } = envConstResp;
          const orgConstants = {};
          const orgSecrets = {};
          constants.map((constant) => {
            if (constant.type !== 'Secret') {
              orgConstants[constant.name] = constant.value;
            } else {
              orgSecrets[constant.name] = constant.value;
            }
          });
          // fetchDataSources(currentVersionId, selectedEnvironment.id);
          fetchGlobalDataSources(organizationId, currentVersionId, selectedEnvironment.id);
          setResolvedConstants(orgConstants);
          setSecrets(orgSecrets);
        } else if (isVersionChanged) {
          // Re-fetch datasources on version/branch switch (branch may have different active datasources)
          fetchGlobalDataSources(organizationId, currentVersionId, selectedEnvironment.id);
        } else if (isAppHistoryChanged) {
          // Re-fetch datasources after app-editor git pull (dummy → real DS swap, or freshly
          // pulled DSes). Without this, queries point to new DS ids but the cached dataSources
          // slice still has stale rows, so the query setup panel shows an empty Source.
          fetchGlobalDataSources(organizationId, currentVersionId, selectedEnvironment.id);
        }

        const queryData = await dataqueryService.getAll(currentVersionId, mode);
        const dataQueries = queryData.data_queries;
        dataQueries.forEach((query) => normalizeQueryTransformationOptions(query));
        setQueries(dataQueries, moduleId);
        if (dataQueries?.length > 0) {
          setSelectedQuery(dataQueries[0]?.id);
          initialiseResolvedQuery(dataQueries.map((query) => query.id));
        }

        if (setFolders) {
          setFolders([]);
          setFolderMappings([]);
          if (mode === 'edit') {
            dataQueryFolderService
              .getAll(currentVersionId)
              .then((folderData) => {
                setFolders(folderData.folders ?? []);
                setFolderMappings(folderData.folderMappings ?? []);
              })
              .catch(() => {});
          }
        }

        try {
          const exposedTheme =
            appMode && appMode !== 'auto' ? appMode : localStorage.getItem('darkMode') === 'true' ? 'dark' : 'light';
          setResolvedGlobals('theme', { name: exposedTheme });
        } catch (error) {
          console.log('error', error);
        }

        setResolvedGlobals('urlparams', JSON.parse(JSON.stringify(queryString.parse(location?.search))));

        setResolvedGlobals('environment', { id: selectedEnvironment?.id, name: selectedEnvironment?.name });
        setResolvedGlobals(
          'appVersion',
          { name: selectedVersion?.display_name || selectedVersion?.displayName || selectedVersion?.name },
          moduleId
        );
        setResolvedGlobals('mode', { value: mode });
        setResolvedGlobals('currentUser', {
          ...user,
          groups: currentSession?.groups,
          role: currentSession?.role?.name,
          ssoUserInfo: currentSession?.ssoUserInfo,
          ...(currentSession?.currentUser?.metadata && !isEmpty(currentSession?.currentUser?.metadata)
            ? { metadata: currentSession?.currentUser?.metadata }
            : {}),
        });

        setQueryMapping(moduleId);
        initDependencyGraph(moduleId);
        setEditorLoading(false, moduleId);
      });
    }
  }, [selectedEnvironment?.id, currentVersionId, moduleMode, moduleId, restoreTimestamp]);

  useEffect(() => {
    if (moduleMode) return;
    if (mode === 'edit') {
      requestIdleCallback(
        () => {
          fetchAllModules()
            .then((modules) => {
              setModulesList(modules);
            })
            .catch((error) => {
              console.error('Failed to preload modules', error);
            })
            .finally(() => {
              setModulesIsLoading(false);
            });
        },
        { timeout: 2000 }
      ); // Adding a timeout of 2 seconds as fallback
    }
  }, [fetchAllModules, setModulesIsLoading, setModulesList, mode, moduleMode, restoreTimestamp]);

  return appTypeRef.current;
};

export default useAppData;
