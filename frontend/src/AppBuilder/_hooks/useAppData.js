import { useEffect, useRef, useState } from 'react';
import {
  appEnvironmentService,
  appService,
  appVersionService,
  dataqueryService,
  datasourceService,
  orgEnvironmentConstantService,
  authenticationService,
  orgEnvironmentVariableService,
  customStylesService,
} from '@/_services';
import useStore from '@/AppBuilder/_stores/store';
import { useEnvironmentsAndVersionsStore } from '@/_stores/environmentsAndVersionsStore';
import { camelCase, cloneDeep, isEmpty, kebabCase, mapKeys, rest } from 'lodash';
import { usePrevious } from '@dnd-kit/utilities';
import { deepCamelCase } from '@/_helpers/appUtils';
import { useEventActions } from '../_stores/slices/eventsSlice';
import useRouter from '@/_hooks/use-router';
import { extractEnvironmentConstantsFromConstantsList, navigate } from '../_utils/misc';
import { getWorkspaceId } from '@/_helpers/utils';
import { shallow } from 'zustand/shallow';
import { fetchAndSetWindowTitle, pageTitles, defaultWhiteLabellingSettings } from '@white-label/whiteLabelling';
import { initEditorWalkThrough } from '@/AppBuilder/_helpers/createWalkThrough';
import queryString from 'query-string';
import { distinctUntilChanged } from 'rxjs';
import { baseTheme, convertAllKeysToSnakeCase } from '../_stores/utils';
import { getPreviewQueryParams } from '@/_helpers/routes';
import { useLocation, useMatch, useParams } from 'react-router-dom';
import useThemeAccess from './useThemeAccess';

/**
 * this is to normalize the query transformation options to match the expected schema. Takes care of corrupted data.
 * This will get redundanted once api response for appdata is made uniform across all the endpoints.
 **/
const normalizeQueryTransformationOptions = (query) => {
  if (query?.options) {
    if (query.options.enable_transformation) {
      const enableTransformation = query.options.enable_transformation;
      delete query.options.enable_transformation;
      if (!query.options.enableTransformation) {
        query.options.enableTransformation = enableTransformation;
      }
    }

    if (query.options.transformation_language) {
      const transformationLanguage = query.options.transformation_language;
      delete query.options.transformation_language;
      if (!query.options.transformationLanguage) {
        query.options.transformationLanguage = transformationLanguage;
      }
    }
  }
  return query;
};

const useAppData = (appId, moduleId, darkMode, mode = 'edit', { environmentId, versionId } = {}) => {
  const { state } = useLocation();
  const [currentSession, setCurrentSession] = useState();
  const setEditorLoading = useStore((state) => state.setEditorLoading);
  const setApp = useStore((state) => state.setApp);
  const app = useStore((state) => state.app);
  const user = useStore((state) => state.user);
  const setCurrentVersionId = useStore((state) => state.setCurrentVersionId);
  const currentVersionId = useStore((state) => state.currentVersionId);
  const setPages = useStore((state) => state.setPages);
  const setPageSettings = useStore((state) => state.setPageSettings);
  const setQueries = useStore((state) => state.dataQuery.setQueries);
  const setSelectedQuery = useStore((state) => state.queryPanel.setSelectedQuery);
  const setComponentNameIdMapping = useStore((state) => state.setComponentNameIdMapping);
  const initDependencyGraph = useStore((state) => state.initDependencyGraph);
  const setCurrentPageId = useStore((state) => state.setCurrentPageId);
  const updateEventsField = useEventActions().updateEventsField;
  const setCurrentMode = useStore((state) => state.setCurrentMode);
  const setAppHomePageId = useStore((state) => state.setAppHomePageId);
  const setPreviewData = useStore((state) => state.queryPanel.setPreviewData);
  // const fetchDataSources = useStore((state) => state.fetchDataSources);
  const fetchGlobalDataSources = useStore((state) => state.fetchGlobalDataSources);
  const previousVersion = usePrevious(currentVersionId);
  const events = useStore((state) => state.eventsSlice.module[moduleId].events);
  const pages = useStore((state) => state.modules[moduleId].pages);
  const currentPageId = useStore((state) => state.currentPageId);
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
  const checkAndSetTrueBuildSuggestionsFlag = useStore((state) => state.checkAndSetTrueBuildSuggestionsFlag);
  const cleanUpStore = useStore((state) => state.cleanUpStore);
  const selectedEnvironment = useStore((state) => state.selectedEnvironment);
  const setIsEditorFreezed = useStore((state) => state.setIsEditorFreezed);
  const appMode = useStore((state) => state.globalSettings.appMode);
  const selectedTheme = useStore((state) => state.globalSettings.theme);
  const previousEnvironmentId = usePrevious(selectedEnvironment?.id);
  const isComponentLayoutReady = useStore((state) => state.isComponentLayoutReady, shallow);
  const pageSwitchInProgress = useStore((state) => state.pageSwitchInProgress);
  const setPageSwitchInProgress = useStore((state) => state.setPageSwitchInProgress);
  const selectedVersion = useStore((state) => state.selectedVersion);
  const setIsPublicAccess = useStore((state) => state.setIsPublicAccess);
  const themeAccess = useThemeAccess();

  const setConversation = useStore((state) => state.ai?.setConversation);
  const setDocsConversation = useStore((state) => state.ai?.setDocsConversation);
  const setConversationZeroState = useStore((state) => state.ai?.setConversationZeroState);
  const sendMessage = useStore((state) => state.ai?.sendMessage);
  const getCreditBalance = useStore((state) => state.ai?.getCreditBalance);
  const setSelectedSidebarItem = useStore((state) => state.setSelectedSidebarItem);
  const toggleLeftSidebar = useStore((state) => state.toggleLeftSidebar);
  const pathParams = useParams();
  const slug = pathParams?.slug;

  const match = useMatch('/applications/:slug/:pageHandle');

  const location = useRouter().location;

  const initialLoadRef = useRef(true);

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
      console.log('Failed to fetch custom styles:', error);
    }
  };

  useEffect(() => {
    if (pageSwitchInProgress) {
      const currentPageEvents = events.filter((event) => event.target === 'page' && event.sourceId === currentPageId);
      setPageSwitchInProgress(false);
      setTimeout(() => {
        handleEvent('onPageLoad', currentPageEvents, {});
      }, 0);
    }
  }, [pageSwitchInProgress, currentPageId]);

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
            ? ['all_users', ...currentSession.group_permissions.map((group) => group.name)]
            : ['all_users'],
        });
      });

    return () => {
      subscription && subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const exposedTheme =
      appMode && appMode !== 'auto' ? appMode : localStorage.getItem('darkMode') === 'true' ? 'dark' : 'light';
    setResolvedGlobals('theme', { name: exposedTheme });
  }, [appMode, darkMode]);

  useEffect(() => {
    if (!currentSession) {
      return;
    }
    const queryParams = getPreviewQueryParams();
    const isPublicAccess =
      (currentSession?.load_app && currentSession?.authentication_failed) || (!queryParams.version && mode !== 'edit');
    const isPreviewForVersion = (mode !== 'edit' && queryParams.version) || isPublicAccess;
    let appDataPromise;
    if (isPublicAccess) {
      appDataPromise = appService.fetchAppBySlug(slug);
    } else {
      appDataPromise = isPreviewForVersion
        ? appVersionService.getAppVersionData(appId, versionId)
        : appService.fetchApp(appId);
    }

    // const appDataPromise = appService.fetchApp(appId);
    appDataPromise.then(async (result) => {
      let appData = { ...result };
      let editorEnvironment = result.editorEnvironment;
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
              ? await orgEnvironmentConstantService.getConstantsFromPublicApp(slug, viewerEnvironment?.environment?.id)
              : await orgEnvironmentConstantService.getConstantsFromApp(slug, viewerEnvironment?.environment?.id);
        } catch (error) {
          console.error('Error fetching viewer environment:', error);
        }
      }

      if (mode === 'edit') {
        constantsResp = await orgEnvironmentConstantService.getConstantsFromEnvironment(editorEnvironment?.id);
      }
      // get the constants for specific environment
      constantsResp.constants = extractEnvironmentConstantsFromConstantsList(
        constantsResp?.constants,
        editorEnvironment?.name
      );

      setIsPublicAccess(isPublicAccess && mode !== 'edit' && appData.is_public);

      fetchAndInjectCustomStyles(isPublicAccess && mode !== 'edit' && appData.is_public);

      const pages = appData.pages.map((page) => {
        return page;
      });
      const conversation = appData.ai_conversation;
      const docsConversation = appData.ai_conversation_learn;
      if (setConversation && setDocsConversation) {
        setConversation(conversation);
        setDocsConversation(docsConversation);
        // important to control ai inputs
        getCreditBalance();
      }

      let showWalkthrough = true;
      // if app was created from propmt, and no earlier messages are present in the conversation, send the prompt message

      // handles the getappdataby slug api call. Gets the homePageId from the appData.
      const homePageId =
        appData.editing_version?.homePageId || appData.editing_version?.home_page_id || appData.home_page_id;

      setApp({
        appName: appData.name,
        appId: appData.id,
        slug: appData.slug,
        currentAppEnvironmentId: editorEnvironment.id,
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
      });
      setIsEditorFreezed(appData.should_freeze_editor);
      const global_settings = mapKeys(
        appData.editing_version?.global_settings || appData.global_settings,
        (value, key) => camelCase(key)
      );
      if (!global_settings?.theme) {
        global_settings.theme = baseTheme;
      }
      setGlobalSettings(global_settings);
      setPages(pages, moduleId);
      setPageSettings(
        computePageSettings(deepCamelCase(appData?.editing_version?.page_settings ?? appData?.page_settings))
      );

      // set starting page as homepage initially
      let startingPage = appData.pages.find((page) => page.id === homePageId);

      if (initialLoadRef.current) {
        // if initial load, check if the path has a page handle and set that as the starting page
        const initialLoadPath = location.pathname.split('/').pop();
        const page = appData.pages.find((page) => page.handle === initialLoadPath && !page.isPageGroup);
        if (page) {
          // if page is disabled, and not editing redirect to home page
          if (mode !== 'edit' && page?.disabled) {
            const currentUrl = window.location.href;
            const replacedUrl = currentUrl.replace(initialLoadPath, startingPage.handle);
            window.history.replaceState(null, null, replacedUrl);
          } else {
            startingPage = page;
          }
        }

        // navigate(`/${getWorkspaceId()}/apps/${slug ?? appId}/${startingPage.handle}`);
      }
      setCurrentPageHandle(startingPage.handle);
      updateFeatureAccess();
      setCurrentPageId(startingPage.id, moduleId);
      setResolvedPageConstants({
        id: startingPage?.id,
        handle: startingPage?.handle,
        name: startingPage?.name,
      });
      setComponentNameIdMapping(moduleId);
      updateEventsField('events', appData.events);
      setCurrentVersionId(appData.editing_version?.id || appData.current_version_id);
      setAppHomePageId(homePageId);

      const queryData =
        isPublicAccess || (mode !== 'edit' && appData.is_public)
          ? appData
          : await dataqueryService.getAll(appData.editing_version?.id || appData.current_version_id);
      const dataQueries = queryData.data_queries || queryData?.editing_version?.data_queries;
      dataQueries.forEach((query) => normalizeQueryTransformationOptions(query));
      setQueries(dataQueries);
      if (dataQueries?.length > 0) {
        setSelectedQuery(dataQueries[0]?.id);
        initialiseResolvedQuery(dataQueries.map((query) => query.id));
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
        setResolvedConstants(orgConstants);
        setSecrets(orgSecrets);
      }
      setQueryMapping(moduleId);

      setResolvedGlobals('environment', editorEnvironment);
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
      setResolvedGlobals('urlparams', JSON.parse(JSON.stringify(queryString.parse(location?.search))));
      initDependencyGraph(moduleId);
      setCurrentMode(mode); // TODO: set mode based on the slug/appDef
      if (
        state.ai &&
        state?.prompt &&
        initialLoadRef.current &&
        (conversation?.aiConversationMessages || []).length === 0
      ) {
        setSelectedSidebarItem('tooljetai');
        toggleLeftSidebar('true');
        sendMessage(state.prompt);
        setConversationZeroState(true);
        showWalkthrough = false;
      }
      // fetchDataSources(appData.editing_version.id, editorEnvironment.id);
      if (!isPublicAccess) {
        const envFromQueryParams = mode === 'view' && new URLSearchParams(location?.search)?.get('env');
        useStore.getState().init(appData.editing_version?.id || appData.current_version_id, envFromQueryParams);
        fetchGlobalDataSources(
          appData.organization_id,
          appData.editing_version?.id || appData.current_version_id,
          editorEnvironment.id
        );
      }
      useStore.getState().updateEditingVersion(appData.editing_version?.id || appData.current_version_id); //check if this is needed
      updateReleasedVersionId(appData.current_version_id);

      setEditorLoading(false);
      initialLoadRef.current = false;
      // only show if app is not created from prompt
      if (showWalkthrough) initEditorWalkThrough();
      checkAndSetTrueBuildSuggestionsFlag();
      return () => {
        document.title = defaultWhiteLabellingSettings.WHITE_LABEL_TEXT;
      };
    });
  }, [setApp, setEditorLoading, currentSession]);

  useEffect(() => {
    if (isComponentLayoutReady) {
      runOnLoadQueries().then(() => {
        let startingPage = pages.find((page) => page.id === currentPageId);
        const currentPageEvents = events.filter(
          (event) => event.target === 'page' && event.sourceId === startingPage.id
        );
        handleEvent('onPageLoad', currentPageEvents, {});
      });
    }
  }, [isComponentLayoutReady]);

  useEffect(() => {
    fetchAndSetWindowTitle({ page: pageTitles.EDITOR, appName: app.appName });
  }, [app.appName]);

  useEffect(() => {
    if (!themeAccess) return;
    const root = document.documentElement;
    const brandColors = selectedTheme?.definition?.brand?.colors || {};
    Object.keys(brandColors).forEach((colorType) => {
      const color = brandColors[colorType][darkMode ? 'dark' : 'light'];
      root.style.setProperty(`--${colorType}-brand`, `${color}`);
    });
  }, [darkMode, selectedTheme, themeAccess]);

  useEffect(() => {
    const exposedTheme =
      appMode && appMode !== 'auto' ? appMode : localStorage.getItem('darkMode') === 'true' ? 'dark' : 'light';
    const isEnvChanged =
      selectedEnvironment?.id && previousEnvironmentId && previousEnvironmentId != selectedEnvironment?.id;
    const isVersionChanged = currentVersionId && previousVersion && currentVersionId != previousVersion;

    if (isEnvChanged || isVersionChanged) {
      setEditorLoading(true);
      clearSelectedComponents();
      if (isEnvChanged) {
        setEnvironmentLoadingState('loading');
      }
      appVersionService.getAppVersionData(appId, selectedVersion?.id).then(async (appData) => {
        cleanUpStore();
        const { should_freeze_editor } = appData;
        setIsEditorFreezed(should_freeze_editor);

        resetExposedValues(moduleId, { resetConstants: isEnvChanged });
        resetUndoRedoStack();
        const pages = appData.pages.map((page) => page);
        setSelectedQuery(null);
        setPreviewData(null);
        setApp({
          appName: appData.name,
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
        });

        setGlobalSettings(
          mapKeys(appData.editing_version?.globalSettings || appData.globalSettings, (value, key) => camelCase(key))
        );

        setPages(pages, moduleId);
        let startingPage = appData.pages.find(
          (page) => page.id === appData.editing_version.home_page_id || appData.editing_version.homePageId
        );
        setCurrentPageId(startingPage.id, moduleId);
        setComponentNameIdMapping(moduleId);
        updateEventsField('events', appData.events);
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
          fetchGlobalDataSources(app.organizationId, currentVersionId, selectedEnvironment.id);
          setResolvedConstants(orgConstants);
          setSecrets(orgSecrets);
        }

        const queryData = await dataqueryService.getAll(currentVersionId);
        const dataQueries = queryData.data_queries;
        dataQueries.forEach((query) => normalizeQueryTransformationOptions(query));
        setQueries(dataQueries);
        if (dataQueries?.length > 0) {
          setSelectedQuery(dataQueries[0]?.id);
          initialiseResolvedQuery(dataQueries.map((query) => query.id));
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
        setEditorLoading(false);
      });
    }
  }, [selectedEnvironment?.id, currentVersionId]);
};

export default useAppData;
