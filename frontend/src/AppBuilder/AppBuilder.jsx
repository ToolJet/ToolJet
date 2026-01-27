import React, { Suspense, useEffect } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import useAppData from '@/AppBuilder/_hooks/useAppData';
import { TJLoader } from '@/_ui/TJLoader/TJLoader';
import ErrorBoundary from '@/_ui/ErrorBoundary';
import cx from 'classnames';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import AppCanvas from '@/AppBuilder/AppCanvas';
import RightSideBar from '@/AppBuilder/RightSideBar';
import QueryPanel from '@/AppBuilder/QueryPanel';
import RealtimeCursors from '@/AppBuilder/RealtimeCursors';
import EditorHeader from '@/AppBuilder/Header';
import LeftSidebar from '@/AppBuilder/LeftSidebar';
import Popups from './Popups';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import RightSidebarToggle from '@/AppBuilder/RightSideBar/RightSidebarToggle';
import { shallow } from 'zustand/shallow';
import { useNavigate } from 'react-router-dom';
import { WorkerBridge } from '@/AppBuilder/_workers/integration/WorkerBridge';
import { isWorkerArchitectureEnabled } from '@/AppBuilder/_helpers/featureFlags';

import ArtifactPreview from './ArtifactPreview';

// const EditorHeader = lazy(() => import('@/AppBuilder/Header'));
// const LeftSidebar = lazy(() => import('@/AppBuilder/LeftSidebar'));
// const AppCanvas = lazy(() => import('@/AppBuilder/AppCanvas'));
// const RightSideBar = lazy(() => import('@/AppBuilder/RightSideBar'));
// const QueryPanel = lazy(() => import('@/AppBuilder/QueryPanel'));

/**
 * WorkerBridgeWrapper - Conditionally wraps children with WorkerBridge
 * Only activates when worker architecture is enabled via feature flag
 */
const WorkerBridgeWrapper = ({ children, moduleId }) => {
  const workerEnabled = isWorkerArchitectureEnabled();

  // Get app definition for worker initialization
  const appDefinition = useStore((state) => {
    if (!workerEnabled) return null;

    const module = state.modules?.[moduleId];
    if (!module?.pages) return null;

    const currentPageId = module.currentPageId;
    const currentPageIndex = module.pages.findIndex((page) => page.id === currentPageId);
    const currentPage = module.pages[currentPageIndex];

    if (!currentPage) return null;

    return {
      pages: { [currentPageId]: currentPage },
      components: currentPage.components,
      queries: state.dataQuery?.queries?.modules?.[moduleId] || [],
      variables: state.resolvedStore?.modules?.[moduleId]?.exposedValues?.variables || {},
      globals: state.resolvedStore?.modules?.[moduleId]?.exposedValues?.globals || {},
      page: state.resolvedStore?.modules?.[moduleId]?.exposedValues?.page || {},
    };
  }, shallow);

  if (!workerEnabled) {
    return <>{children}</>;
  }

  return (
    <WorkerBridge appDefinition={appDefinition} moduleId={moduleId}>
      {children}
    </WorkerBridge>
  );
};

// TODO: split Loader into separate component and remove editor loading state from Editor
export const Editor = ({ id: appId, darkMode, moduleId = 'canvas', switchDarkMode, appType = 'front-end' }) => {
  useAppData(appId, moduleId, darkMode);
  const isEditorLoading = useStore((state) => state.loaderStore.modules[moduleId].isEditorLoading, shallow);
  const currentMode = useStore((state) => state.modeStore.modules[moduleId].currentMode, shallow);
  const hasModuleAccess = useStore((state) => state.license.featureAccess?.modulesEnabled);
  const isModuleEditor = appType === 'module';

  const updateIsTJDarkMode = useStore((state) => state.updateIsTJDarkMode, shallow);
  const appBuilderMode = useStore((state) => state.appStore.modules[moduleId]?.app?.appBuilderMode ?? 'visual');
  const navigate = useNavigate();

  const isUserInZeroToOneFlow = appBuilderMode === 'ai';

  const changeToDarkMode = (newMode) => {
    updateIsTJDarkMode(newMode);
    switchDarkMode(newMode);
  };

  useEffect(() => {
    if (hasModuleAccess === false && isModuleEditor) {
      navigate('/error/restricted');
    }
  }, [hasModuleAccess, isModuleEditor]);

  //TODO: This can be added to the mode slice and set based on the mode
  if (isEditorLoading) {
    return (
      <div className={cx('apploader', { 'dark-theme theme-dark': darkMode })}>
        <TJLoader />
      </div>
    );
  }
  return (
    <div className={cx('wrapper', { editor: currentMode === 'edit' })}>
      <ErrorBoundary>
        <ModuleProvider moduleId={moduleId} appType={appType} isModuleMode={false} isModuleEditor={isModuleEditor}>
          <WorkerBridgeWrapper moduleId={moduleId}>
            <Suspense fallback={<div>Loading...</div>}>
              <EditorHeader darkMode={darkMode} isUserInZeroToOneFlow={isUserInZeroToOneFlow} />

              <LeftSidebar
                switchDarkMode={changeToDarkMode}
                darkMode={darkMode}
                isUserInZeroToOneFlow={isUserInZeroToOneFlow}
              />
            </Suspense>
            {isUserInZeroToOneFlow ? (
              <ArtifactPreview darkMode={darkMode} isUserInZeroToOneFlow={isUserInZeroToOneFlow} />
            ) : (
              <>
                {window?.public_config?.ENABLE_MULTIPLAYER_EDITING === 'true' && <RealtimeCursors />}
                <DndProvider backend={HTML5Backend}>
                  <AppCanvas moduleId={moduleId} appId={appId} switchDarkMode={switchDarkMode} darkMode={darkMode} />
                  <QueryPanel darkMode={darkMode} />
                  <RightSidebarToggle darkMode={darkMode} />
                  <RightSideBar darkMode={darkMode} />
                </DndProvider>
                <Popups darkMode={darkMode} />
              </>
            )}
          </WorkerBridgeWrapper>
        </ModuleProvider>
      </ErrorBoundary>
    </div>
  );
};
