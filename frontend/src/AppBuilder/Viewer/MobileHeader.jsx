import React, { useMemo } from 'react';
import _, { isEmpty } from 'lodash';
import LogoIcon from '@assets/images/rocket.svg';
import { Link } from 'react-router-dom';
import { DarkModeToggle } from '@/_components/DarkModeToggle';
import Header from './Header';
import { shallow } from 'zustand/shallow';
import { redirectToDashboard } from '@/_helpers/routes';
import classNames from 'classnames';
import PreviewSettings from './PreviewSettings';
import MobileNavigationMenu from './MobileNavigationMenu';
import useStore from '@/AppBuilder/_stores/store';
import AppLogo from '@/_components/AppLogo';
import { resolveReferences } from '@/_helpers/utils';

const MobileHeader = ({
  showHeader,
  appName,
  changeToDarkMode,
  darkMode,
  currentPageId,
  switchPage,
  setAppDefinitionFromVersion,
  showViewerNavigation,
  pages,
  viewerWrapperRef,
}) => {
  const { isReleasedVersionId } = useStore(
    (state) => ({
      isReleasedVersionId: state?.releasedVersionId == state.currentVersionId || state.isVersionReleased,
    }),
    shallow
  );
  const editingVersion = useStore((state) => state.editingVersion);
  const showDarkModeToggle = useStore((state) => state.globalSettings.appMode === 'auto');
  const pageSettings = useStore((state) => state.pageSettings);
  const { definition: { properties = {} } = {} } = pageSettings ?? {};
  const isPagesSidebarHidden = useStore((state) => state.getPagesSidebarVisibility('canvas'), shallow);
  const { showOnMobile } = properties ?? {};

  // Fetch the version parameter from the query string
  const searchParams = new URLSearchParams(window.location.search);
  const version = searchParams.get('version');

  const _renderAppNameAndLogo = () => (
    <div
      className={classNames('d-flex', 'align-items-center', 'justify-content-center')}
      style={{ visibility: showHeader || isReleasedVersionId ? 'visible' : 'hidden' }}
    >
      <h1 className="navbar-brand d-none-navbar-horizontal p-0">
        <Link
          data-cy="viewer-page-logo"
          onClick={() => {
            redirectToDashboard();
          }}
        >
          <AppLogo isLoadingFromHeader={false} viewer={true} />
        </Link>
      </h1>
    </div>
  );

  const _renderMobileNavigationMenu = () => (
    <MobileNavigationMenu
      currentPageId={currentPageId}
      switchPage={switchPage}
      darkMode={darkMode}
      changeToDarkMode={changeToDarkMode}
      showHeader={showHeader}
      showDarkModeToggle={showDarkModeToggle}
      appName={appName}
      pages={pages}
      viewerWrapperRef={viewerWrapperRef}
    />
  );

  const _renderPreviewSettings = () =>
    !isReleasedVersionId && (
      <PreviewSettings
        isMobileLayout
        showHeader={showHeader}
        setAppDefinitionFromVersion={setAppDefinitionFromVersion}
        darkMode={darkMode}
      />
    );

  const _renderDarkModeBtn = (args) => {
    if (!showDarkModeToggle) return null;
    const styles = args?.styles ?? {};
    return (
      <span
        className="released-version-no-header-dark-mode-icon"
        style={{ position: 'absolute', top: '7px', ...styles }}
      >
        <DarkModeToggle switchDarkMode={changeToDarkMode} darkMode={darkMode} />
      </span>
    );
  };

  if (!showHeader && isReleasedVersionId) {
    return <>{showViewerNavigation && showOnMobile ? _renderMobileNavigationMenu() : _renderDarkModeBtn()}</>;
  }

  if (!showHeader && !isReleasedVersionId) {
    return (
      <>
        <Header
          styles={{
            height: '46px',
            position: 'fixed',
            width: version ? '450px' : '100%',
            zIndex: '100',
          }}
          showNavbarClass={false}
        >
          {showViewerNavigation && _renderMobileNavigationMenu()}
          {/* {!isEmpty(editingVersion) && _renderPreviewSettings()} */}
          {!showViewerNavigation && _renderDarkModeBtn()}
        </Header>
      </>
    );
  }

  return (
    <div>
      {!isEmpty(editingVersion) && !isReleasedVersionId && (
        <Header className={'preview-settings-mobile'} styles={{ height: '44px' }}>
          {_renderPreviewSettings()}
        </Header>
      )}
      <Header
        styles={{
          height: '46px',
        }}
        className={'mobile-nav-container'}
      >
        <div className="d-flex w-100">
          {!isPagesSidebarHidden && showOnMobile && _renderMobileNavigationMenu()}
          <span style={{ flexGrow: 1, width: '100%' }}>{_renderAppNameAndLogo()}</span>
        </div>
      </Header>
    </div>
  );
};

export default MobileHeader;
