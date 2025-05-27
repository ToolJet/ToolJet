import React, { Suspense, useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '@/AppBuilder/_stores/store';
import useAppData from '@/AppBuilder/_hooks/useAppData';
import { TJLoader } from '@/_ui/TJLoader/TJLoader';
import './viewer.scss';
import ErrorBoundary from '@/_ui/ErrorBoundary';
import cx from 'classnames';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import AppCanvas from '@/AppBuilder/AppCanvas';
import DesktopHeader from './DesktopHeader';
import MobileHeader from './MobileHeader';
import ViewerSidebarNavigation from './ViewerSidebarNavigation';
import { shallow } from 'zustand/shallow';
import Popups from '../Popups';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import Spinner from '@/_ui/Spinner';

export const Viewer = ({
  id: appId,
  darkMode,
  moduleId = 'canvas',
  switchDarkMode,
  environmentId,
  versionId,
  moduleMode = false,
} = {}) => {
  const DEFAULT_CANVAS_WIDTH = 1292;
  const { t } = useTranslation();
  const [isSidebarPinned, setIsSidebarPinned] = useState(localStorage.getItem('isPagesSidebarPinned') !== 'false');
  const appType = useAppData(appId, moduleId, darkMode, 'view', { environmentId, versionId }, moduleMode);

  const {
    isEditorLoading,
    currentMode,
    currentLayout,
    editingVersion,
    selectedVersion,
    currentCanvasWidth,
    currentPageId,
    globalSettings,
    pages,
    pageSettings,
    updateCanvasHeight,
    appName,
    homePageId,
    isMaintenanceOn,
    setIsViewer,
    toggleCurrentLayout,
  } = useStore(
    (state) => ({
      isEditorLoading: state.loaderStore.modules[moduleId].isEditorLoading,
      currentMode: state.modeStore.modules[moduleId].currentMode,
      currentLayout: state.currentLayout,
      editingVersion: state.editingVersion,
      selectedVersion: state.selectedVersion,
      currentCanvasWidth: state.currentCanvasWidth,
      appName: state.appStore.modules[moduleId].app.appName,
      homePageId: state.appStore.modules[moduleId].app.homepageId,
      currentPageId: state.modules[moduleId].currentPageId,
      globalSettings: state.globalSettings,
      pages: state.modules[moduleId].pages,
      modules: state.modules,
      globalSettingsChanged: state.globalSettingsChanged,
      pageSettings: state.pageSettings,
      updateCanvasHeight: state.updateCanvasBottomHeight,
      isMaintenanceOn: state.appStore.modules[moduleId].app.isMaintenanceOn,
      setIsViewer: state.setIsViewer,
      toggleCurrentLayout: state.toggleCurrentLayout,
    }),
    shallow
  );

  const getCurrentPageComponents = useStore((state) => state.getCurrentPageComponents(moduleId), shallow);
  const currentPageComponents = useMemo(() => getCurrentPageComponents, [getCurrentPageComponents]);
  const changeDarkMode = useStore((state) => state.changeDarkMode);
  const isPagesSidebarHidden = useStore((state) => state.getPagesSidebarVisibility('canvas'), shallow);
  const canvasBgColor = useStore((state) => state.getCanvasBackgroundColor('canvas', darkMode), shallow);
  const deviceWindowWidth = window.screen.width - 5;

  const hideSidebar = moduleMode || isPagesSidebarHidden || appType === 'module';

  const computeCanvasMaxWidth = useCallback(() => {
    if (globalSettings?.maxCanvasWidth) {
      return globalSettings.maxCanvasWidth;
    }
    if (globalSettings?.canvasMaxWidthType === 'px') {
      return (+globalSettings?.canvasMaxWidth || DEFAULT_CANVAS_WIDTH) - (!hideSidebar ? 200 : 0);
    }
    if (globalSettings?.canvasMaxWidthType === '%') {
      return +globalSettings?.canvasMaxWidth + '%';
    }
    return DEFAULT_CANVAS_WIDTH;
  }, [globalSettings, hideSidebar]);

  const toggleSidebarPinned = useCallback(() => {
    const newValue = !isSidebarPinned;
    setIsSidebarPinned(newValue);
    localStorage.setItem('isPagesSidebarPinned', JSON.stringify(newValue));
  }, [isSidebarPinned]);

  const canvasRef = useRef(null);
  const isLoading = false;
  const isMobilePreviewMode = selectedVersion?.id && currentLayout === 'mobile';
  const isAppLoaded = !!editingVersion;
  const isMobileDevice = deviceWindowWidth < 600;
  const switchPage = useStore((state) => state.switchPage);

  const showHeader = !globalSettings?.hideHeader && isAppLoaded;
  const isLicenseValid = useStore((state) => state.isLicenseValid);
  const licenseValid = isLicenseValid();
  // ---remove
  const handleAppEnvironmentChanged = useCallback((environment) => {
    console.log('setAppVersionCurrentEnvironment', environment);
  }, []);

  useEffect(() => {
    updateCanvasHeight(currentPageComponents, moduleId);
  }, [currentPageComponents, moduleId, updateCanvasHeight]);

  const changeToDarkMode = (newMode) => {
    switchDarkMode(newMode);
  };
  useEffect(() => {
    const isMobileDevice = deviceWindowWidth < 600;
    toggleCurrentLayout(isMobileDevice ? 'mobile' : 'desktop');
    setIsViewer(true, moduleId);
    return () => {
      setIsViewer(false, moduleId);
    };
  }, []);

  const renderHeader = () => {
    if (moduleMode) {
      return null;
    }

    if (currentLayout !== 'mobile') {
      return (
        <DesktopHeader
          showHeader={showHeader}
          isAppLoaded={isAppLoaded}
          appName={appName}
          darkMode={darkMode}
          pages={pages}
          currentPageId={currentPageId ?? homePageId}
          showViewerNavigation={!hideSidebar}
          handleAppEnvironmentChanged={handleAppEnvironmentChanged}
          changeToDarkMode={changeToDarkMode}
        />
      );
    }

    return (
      <>
        {currentLayout === 'mobile' && !isMobilePreviewMode && (
          <MobileHeader
            showHeader={showHeader}
            appName={appName}
            darkMode={darkMode}
            pages={pages}
            currentPageId={currentPageId ?? homePageId}
            showViewerNavigation={!hideSidebar}
            handleAppEnvironmentChanged={handleAppEnvironmentChanged}
            changeToDarkMode={changeToDarkMode}
          />
        )}
      </>
    );
  };

  if (isEditorLoading) {
    return (
      <div className={cx('apploader', { 'dark-theme theme-dark': darkMode, 'module-mode': moduleMode })}>
        {moduleMode ? <Spinner /> : <TJLoader />}
      </div>
    );
  } else if (isMaintenanceOn) {
    return (
      <div className="maintenance_container">
        <div className="card">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <h3>{t('viewer', 'Sorry!. This app is under maintenance')}</h3>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className={cx('wrapper', { editor: currentMode === 'edit' })}>
        <ErrorBoundary>
          <Suspense fallback={<div>Loading...</div>}>
            <div
              className={cx('viewer wrapper', { 'mobile-layout': currentLayout, 'theme-dark dark-theme': darkMode })}
            >
              <DndProvider backend={HTML5Backend}>
                <ModuleProvider moduleId={moduleId} isModuleMode={moduleMode} appType={appType} isModuleEditor={false}>
                  {renderHeader()}
                  <div className="sub-section">
                    <div className="main">
                      <div
                        className="canvas-container align-items-center"
                        style={{
                          backgroundColor: moduleMode ? 'inherit' : canvasBgColor,
                        }}
                      >
                        <div className={`areas d-flex flex-rows app-${appId}`}>
                          {currentLayout !== 'mobile' && !hideSidebar && !moduleMode && (
                            <ViewerSidebarNavigation
                              showHeader={showHeader}
                              isMobileDevice={currentLayout === 'mobile'}
                              pages={pages}
                              currentPageId={currentPageId ?? homePageId}
                              darkMode={darkMode}
                              isSidebarPinned={isSidebarPinned}
                              toggleSidebarPinned={toggleSidebarPinned}
                              switchPage={switchPage}
                            />
                          )}

                          <div
                            className={cx('flex-grow-1 d-flex justify-content-center canvas-box', {
                              close: !isSidebarPinned,
                              'w-100': moduleMode || appType === 'module',
                            })}
                            style={{
                              backgroundColor: isMobilePreviewMode ? '#ACB2B9' : 'unset',
                              marginLeft: hideSidebar || currentLayout === 'mobile' ? 'auto' : '210px',
                            }}
                          >
                            <div
                              className="canvas-area"
                              ref={canvasRef}
                              style={{
                                width: isMobilePreviewMode ? '450px' : currentCanvasWidth,
                                maxWidth: isMobilePreviewMode ? '450px' : computeCanvasMaxWidth(),
                                margin: 0,
                                padding: 0,
                                position: 'relative',
                              }}
                            >
                              {currentLayout === 'mobile' && isMobilePreviewMode && !moduleMode && (
                                <MobileHeader
                                  showHeader={showHeader && isAppLoaded}
                                  appName={appName}
                                  darkMode={darkMode}
                                  pages={pages}
                                  currentPageId={currentPageId ?? homePageId}
                                  showViewerNavigation={!hideSidebar}
                                  handleAppEnvironmentChanged={handleAppEnvironmentChanged}
                                  switchPage={switchPage}
                                  changeToDarkMode={changeToDarkMode}
                                />
                              )}
                              <AppCanvas
                                isViewerSidebarPinned={isSidebarPinned}
                                isViewer={true}
                                appId={appId}
                                appType={appType}
                              />
                            </div>
                            {isMobilePreviewMode && <div className="hide-drawer-transition" style={{ right: 0 }}></div>}
                            {isMobilePreviewMode && <div className="hide-drawer-transition" style={{ left: 0 }}></div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ModuleProvider>
              </DndProvider>
            </div>
          </Suspense>
          <Popups darkMode={darkMode} />
        </ErrorBoundary>
      </div>
    );
  }
};
