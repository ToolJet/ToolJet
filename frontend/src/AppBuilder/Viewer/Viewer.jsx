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
import { shallow } from 'zustand/shallow';
import Popups from '../Popups';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import { getPatToken, setPatToken } from '@/AppBuilder/EmbedApp';
import Spinner from '@/_ui/Spinner';
import { checkIfLicenseNotValid } from '@/_helpers/appUtils';
import TooljetBanner from './TooljetBanner';

export const Viewer = ({
  id: appId,
  darkMode,
  moduleId = 'canvas',
  switchDarkMode,
  environmentId,
  versionId,
  moduleMode = false,
  slug: appSlug,
} = {}) => {
  const DEFAULT_CANVAS_WIDTH = 1292;
  const { t } = useTranslation();
  const [isSidebarPinned, setIsSidebarPinned] = useState(localStorage.getItem('isPagesSidebarPinned') !== 'false');
  const appType = useAppData(appId, moduleId, darkMode, 'view', { environmentId, versionId }, moduleMode, appSlug);
  const temporaryLayouts = useStore((state) => state.temporaryLayouts, shallow);

  const {
    isEditorLoading,
    currentMode,
    currentLayout,
    editingVersion,
    selectedVersion,
    currentCanvasWidth,
    currentPageId,
    globalSettings,
    pageSettings,
    updateCanvasHeight,
    appName,
    homePageId,
    isMaintenanceOn,
    setIsViewer,
    toggleCurrentLayout,
    isReleasedVersionId,
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
      pageSettings: state.pageSettings,
      updateCanvasHeight: state.updateCanvasBottomHeight,
      isMaintenanceOn: state.appStore.modules[moduleId].app.isMaintenanceOn,
      setIsViewer: state.setIsViewer,
      toggleCurrentLayout: state.toggleCurrentLayout,
      isReleasedVersionId: state?.releasedVersionId == state.currentVersionId || state.isVersionReleased,
    }),
    shallow
  );

  const getCurrentPageComponents = useStore((state) => state.getCurrentPageComponents(moduleId), shallow);
  const currentPageComponents = useMemo(() => getCurrentPageComponents, [getCurrentPageComponents]);
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

  const { definition: { properties = {} } = {} } = pageSettings ?? {};
  const { position } = properties ?? {};

  const canvasRef = useRef(null);
  const viewerWrapperRef = useRef(null);
  const isMobilePreviewMode = selectedVersion?.id && currentLayout === 'mobile';
  const isAppLoaded = !!editingVersion;
  const switchPage = useStore((state) => state.switchPage);

  const showHeader = !globalSettings?.hideHeader && isAppLoaded;
  const isLicenseNotValid = checkIfLicenseNotValid();
  const pages = useStore((state) => state.modules[moduleId].pages);

  // ---remove
  const handleAppEnvironmentChanged = useCallback((environment) => {
    console.log('setAppVersionCurrentEnvironment', environment);
  }, []);

  useEffect(() => {
    if (window.name && !getPatToken()) {
      try {
        const patToken = window.name;
        setPatToken(patToken); // restore it in memory
      } catch (e) {
        console.error('Invalid PAT in window.name');
      }
    }
  }, []);

  useEffect(() => {
    updateCanvasHeight(currentPageComponents, moduleId);
  }, [currentPageComponents, moduleId, updateCanvasHeight, temporaryLayouts]);

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
            currentPageId={currentPageId ?? homePageId}
            showViewerNavigation={!hideSidebar}
            handleAppEnvironmentChanged={handleAppEnvironmentChanged}
            changeToDarkMode={changeToDarkMode}
            switchPage={switchPage}
            pages={pages}
            viewerWrapperRef={viewerWrapperRef}
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
              ref={viewerWrapperRef}
              className={cx('viewer wrapper', {
                'mobile-layout': currentLayout,
                'offset-top-bar-navigation': !isReleasedVersionId,
                'mobile-view': currentLayout === 'mobile',
              })}
            >
              <DndProvider backend={HTML5Backend}>
                <ModuleProvider moduleId={moduleId} isModuleMode={moduleMode} appType={appType} isModuleEditor={false}>
                  {renderHeader()}
                  <div className="sub-section">
                    <div className="main">
                      <div
                        className="canvas-container align-items-center"
                        style={{
                          backgroundColor: 'inherit',
                        }}
                      >
                        <div className={`areas d-flex flex-rows app-${appId}`}>
                          <div
                            className={cx('flex-grow-1 d-flex justify-content-center canvas-box', {
                              close: !isSidebarPinned,
                              'w-100': moduleMode || appType === 'module',
                            })}
                            style={{
                              backgroundColor: isMobilePreviewMode ? '#ACB2B9' : 'unset',
                              marginLeft:
                                isPagesSidebarHidden || currentLayout === 'mobile'
                                  ? 'auto'
                                  : position === 'top'
                                  ? '0px'
                                  : '226px',
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
                                  currentPageId={currentPageId ?? homePageId}
                                  showViewerNavigation={!hideSidebar}
                                  handleAppEnvironmentChanged={handleAppEnvironmentChanged}
                                  switchPage={switchPage}
                                  changeToDarkMode={changeToDarkMode}
                                  pages={pages}
                                  viewerWrapperRef={viewerWrapperRef}
                                />
                              )}
                              <AppCanvas
                                moduleId={moduleId}
                                isViewerSidebarPinned={isSidebarPinned}
                                toggleSidebarPinned={toggleSidebarPinned}
                                appId={appId}
                                appType={appType}
                                isViewer={true}
                                switchDarkMode={changeToDarkMode}
                                darkMode={darkMode}
                              />
                            </div>
                            {isLicenseNotValid && isAppLoaded && <TooljetBanner isDarkMode={darkMode} />}
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
