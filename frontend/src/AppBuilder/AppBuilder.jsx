import React, { Suspense, useEffect, useRef } from 'react';
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
import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

import ArtifactPreview from './ArtifactPreview';

// const EditorHeader = lazy(() => import('@/AppBuilder/Header'));
// const LeftSidebar = lazy(() => import('@/AppBuilder/LeftSidebar'));
// const AppCanvas = lazy(() => import('@/AppBuilder/AppCanvas'));
// const RightSideBar = lazy(() => import('@/AppBuilder/RightSideBar'));
// const QueryPanel = lazy(() => import('@/AppBuilder/QueryPanel'));

// Function to track app load time
const trackAppLoadTime = async (appId, appName, loadTime) => {
  try {
    const requestOptions = {
      method: 'POST',
      headers: authHeader(),
      credentials: 'include',
      body: JSON.stringify({
        appId: appId,
        appName: appName,
        loadTime: loadTime,
        environment: 'production'
      })
    };
    const response = await fetch(`${config.apiUrl}/apps/metrics/app-load-time`, requestOptions).then(handleResponse);
    console.log('[ToolJet Frontend] App load time tracked:', { appId, loadTime });
  } catch (error) {
    console.error('[ToolJet Frontend] Failed to track app load time:', error);
  }
};

// TODO: split Loader into separate component and remove editor loading state from Editor
export const Editor = ({ id: appId, darkMode, moduleId = 'canvas', switchDarkMode, appType = 'front-end' }) => {
  const loadStartTime = useRef(performance.now());
  const hasTrackedLoadTime = useRef(false);
  
  useAppData(appId, moduleId, darkMode);
  const isEditorLoading = useStore((state) => state.loaderStore.modules[moduleId].isEditorLoading, shallow);
  const currentMode = useStore((state) => state.modeStore.modules[moduleId].currentMode, shallow);
  const isModuleEditor = appType === 'module';
  const app = useStore((state) => state.appStore.modules[moduleId]?.app, shallow);
  const appName = useStore((state) => state.appStore.modules[moduleId]?.app?.appName, shallow);

  const updateIsTJDarkMode = useStore((state) => state.updateIsTJDarkMode, shallow);
  const appBuilderMode = useStore((state) => state.appStore.modules[moduleId]?.app?.appBuilderMode ?? 'visual');

  const isUserInZeroToOneFlow = appBuilderMode === 'ai';

  const changeToDarkMode = (newMode) => {
    updateIsTJDarkMode(newMode);
    switchDarkMode(newMode);
  };

  // Track app load time when loading completes
  useEffect(() => {
    console.log('[ToolJet Debug] Editor useEffect:', { 
      isEditorLoading, 
      hasTrackedLoadTime: hasTrackedLoadTime.current, 
      appExists: !!app,
      appName: appName,
      appId 
    });
    
    if (!isEditorLoading && !hasTrackedLoadTime.current && app && appName) {
      const loadTime = (performance.now() - loadStartTime.current) / 1000;
      hasTrackedLoadTime.current = true;
      
      console.log('[ToolJet Debug] Tracking app load time:', { appId, appName: appName, loadTime });
      trackAppLoadTime(appId, appName || 'Unnamed App', loadTime);
    }
  }, [isEditorLoading, app, appId, appName]);

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
        </ModuleProvider>
      </ErrorBoundary>
    </div>
  );
};
