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
const trackAppLoadTime = async (appId, appName, loadTime, mode = 'direct') => {
  try {
    // Get current environment from ToolJet's environment store
    const store = useStore.getState();
    const selectedEnvironment = store.environmentsAndVersionsStore?.selectedEnvironment;
    const environmentName = selectedEnvironment?.name || 'development';
    
    const requestOptions = {
      method: 'POST',
      headers: authHeader(),
      credentials: 'include',
      body: JSON.stringify({
        appId: appId,
        appName: appName,
        loadTime: loadTime,
        mode: mode,
        environment: environmentName
      })
    };
    const response = await fetch(`${config.apiUrl}/apps/metrics/app-load-time`, requestOptions).then(handleResponse);
    console.log('[ToolJet Frontend] App load time tracked:', { appId, loadTime, mode, environment: environmentName });
  } catch (error) {
    console.error('[ToolJet Frontend] Failed to track app load time:', error);
  }
};

// TODO: split Loader into separate component and remove editor loading state from Editor
export const Editor = ({ id: appId, darkMode, moduleId = 'canvas', switchDarkMode, appType = 'front-end' }) => {
  // Check if we have a stored start time from Edit button click, Launch button click, or Create app
  const editStartTime = localStorage.getItem(`app_edit_load_start_${appId}`);
  const launchStartTime = localStorage.getItem(`app_launch_load_start_${appId}`);
  const createStartTime = localStorage.getItem(`app_create_load_start_${appId}`);
  
  const editMode = localStorage.getItem(`app_edit_mode_${appId}`);
  const launchMode = localStorage.getItem(`app_launch_mode_${appId}`);
  const createMode = localStorage.getItem(`app_create_mode_${appId}`);
  
  // Determine which start time and mode to use
  const storedStartTime = editStartTime || launchStartTime || createStartTime;
  const storedMode = editMode || launchMode || createMode || 'direct';
  
  
  const loadStartTime = useRef(storedStartTime ? parseFloat(storedStartTime) : null);
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
      // Only track if we have a valid start time from localStorage
      if (loadStartTime.current) {
        const loadTime = (performance.now() - loadStartTime.current) / 1000;
        hasTrackedLoadTime.current = true;
        
        const mode = storedMode || 'direct';
        
        trackAppLoadTime(appId, appName || 'Unnamed App', loadTime, mode);
        
        // Clean up localStorage
        localStorage.removeItem(`app_edit_load_start_${appId}`);
        localStorage.removeItem(`app_edit_mode_${appId}`);
        localStorage.removeItem(`app_launch_load_start_${appId}`);
        localStorage.removeItem(`app_launch_mode_${appId}`);
        localStorage.removeItem(`app_create_load_start_${appId}`);
        localStorage.removeItem(`app_create_mode_${appId}`);
      }
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
