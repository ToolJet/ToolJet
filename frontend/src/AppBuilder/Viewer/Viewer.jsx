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
import TooljetBanner from './TooljetBanner';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';

export const Viewer = ({ id: appId, darkMode, moduleId = 'canvas', switchDarkMode, environmentId, versionId } = {}) => {
  const DEFAULT_CANVAS_WIDTH = 1292;
  const { t } = useTranslation();
  const [isSidebarPinned, setIsSidebarPinned] = useState(localStorage.getItem('isPagesSidebarPinned') !== 'false');
  useAppData(appId, moduleId, 'view', { environmentId, versionId });

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
      isEditorLoading: state.isEditorLoading,
      currentMode: state.currentMode,
      currentLayout: state.currentLayout,
      editingVersion: state.editingVersion,
      selectedVersion: state.selectedVersion,
      currentCanvasWidth: state.currentCanvasWidth,
      appName: state.app.appName,
      homePageId: state?.app.homepageId,
      currentPageId: state.currentPageId,
      globalSettings: state.globalSettings,
      pages: state.modules.canvas.pages,
      modules: state.modules,
      globalSettingsChanged: state.globalSettingsChanged,
      pageSettings: state.pageSettings,
      updateCanvasHeight: state.updateCanvasBottomHeight,
      isMaintenanceOn: state.app.isMaintenanceOn,
      setIsViewer: state.setIsViewer,
      toggleCurrentLayout: state.toggleCurrentLayout,
    }),
    shallow
  );
  const getCurrentPageComponents = useStore((state) => state.getCurrentPageComponents(), shallow);
  const currentPageComponents = useMemo(() => getCurrentPageComponents, [getCurrentPageComponents]);
  const isPagesSidebarHidden = useStore((state) => state.getPagesSidebarVisibility('canvas'), shallow);
  const canvasBgColor = useStore((state) => state.getCanvasBackgroundColor('canvas', darkMode), shallow);
  const deviceWindowWidth = window.screen.width - 5;

  const computeCanvasMaxWidth = useCallback(() => {
    if (globalSettings?.maxCanvasWidth) {
      return globalSettings.maxCanvasWidth;
    }
    if (globalSettings?.canvasMaxWidthType === 'px') {
      return (+globalSettings?.canvasMaxWidth || DEFAULT_CANVAS_WIDTH) - (!isPagesSidebarHidden ? 200 : 0);
    }
    if (globalSettings?.canvasMaxWidthType === '%') {
      return +globalSettings?.canvasMaxWidth + '%';
    }
    return DEFAULT_CANVAS_WIDTH;
  }, [globalSettings, isPagesSidebarHidden]);

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

  useEffect(() => {
    updateCanvasHeight(currentPageComponents);
  }, [currentPageComponents, updateCanvasHeight]);

  const changeToDarkMode = (newMode) => {
    switchDarkMode(newMode);
  };
  useEffect(() => {
    const isMobileDevice = deviceWindowWidth < 600;
    toggleCurrentLayout(isMobileDevice ? 'mobile' : 'desktop');
    setIsViewer(true);
    return () => {
      setIsViewer(false);
    };
  }, []);

  if (isEditorLoading) {
    return (
      <div className={cx('apploader', { 'dark-theme theme-dark': darkMode })}>
        <TJLoader />
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
                <ModuleProvider moduleId={moduleId}>
                  {currentLayout !== 'mobile' && (
                    <DesktopHeader
                      showHeader={showHeader}
                      isAppLoaded={isAppLoaded}
                      appName={appName}
                      darkMode={darkMode}
                      pages={pages}
                      currentPageId={currentPageId ?? homePageId}
                      showViewerNavigation={!isPagesSidebarHidden}
                      changeToDarkMode={changeToDarkMode}
                    />
                  )}
                  {currentLayout === 'mobile' && !isMobilePreviewMode && (
                    <MobileHeader
                      showHeader={showHeader}
                      appName={appName}
                      darkMode={darkMode}
                      pages={pages}
                      currentPageId={currentPageId ?? homePageId}
                      showViewerNavigation={!isPagesSidebarHidden}
                      changeToDarkMode={changeToDarkMode}
                    />
                  )}
                  <div className="sub-section">
                    <div className="main">
                      <div
                        className="canvas-container align-items-center"
                        style={{
                          backgroundColor: canvasBgColor,
                        }}
                      >
                        <div className={`areas d-flex flex-rows app-${appId}`}>
                          {currentLayout !== 'mobile' && !isPagesSidebarHidden && (
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
                            })}
                            style={{
                              backgroundColor: isMobilePreviewMode ? '#ACB2B9' : 'unset',
                              marginLeft: isPagesSidebarHidden || currentLayout === 'mobile' ? 'auto' : '210px',
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
                              {currentLayout === 'mobile' && isMobilePreviewMode && (
                                <MobileHeader
                                  showHeader={showHeader && isAppLoaded}
                                  appName={appName}
                                  darkMode={darkMode}
                                  pages={pages}
                                  currentPageId={currentPageId ?? homePageId}
                                  showViewerNavigation={!isPagesSidebarHidden}
                                  switchPage={switchPage}
                                  changeToDarkMode={changeToDarkMode}
                                />
                              )}
                              <AppCanvas moduleId={moduleId} isViewerSidebarPinned={isSidebarPinned} />
                            </div>
                            <TooljetBanner isDarkMode={darkMode} />
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
