import React from 'react';
import _, { isEmpty } from 'lodash';
// eslint-disable-next-line import/no-unresolved
import LogoIcon from '@assets/images/rocket.svg';
import { Link } from 'react-router-dom';
import { DarkModeToggle } from '@/_components/DarkModeToggle';
import Header from './Header';
import { shallow } from 'zustand/shallow';
import { redirectToDashboard } from '@/_helpers/routes';
import classNames from 'classnames';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import PreviewSettings from './PreviewSettings';
import MobileNavigationMenu from './MobileNavigationMenu';

const MobileHeader = ({
  showHeader,
  appName,
  changeDarkMode,
  darkMode,
  pages,
  currentPageId,
  switchPage,
  setAppDefinitionFromVersion,
  showViewerNavigation,
}) => {
  const { isVersionReleased, editingVersion } = useAppVersionStore(
    (state) => ({
      isVersionReleased: state.isVersionReleased,
      editingVersion: state?.editingVersion,
    }),
    shallow
  );

  // Fetch the version parameter from the query string
  const searchParams = new URLSearchParams(window.location.search);
  const version = searchParams.get('version');

  const _renderAppNameAndLogo = () => (
    <div
      className={classNames('d-flex', 'align-items-center')}
      style={{ visibility: showHeader || isVersionReleased ? 'visible' : 'hidden' }}
    >
      <h1 className="navbar-brand d-none-navbar-horizontal pe-0">
        <Link
          data-cy="viewer-page-logo"
          onClick={() => {
            redirectToDashboard();
          }}
        >
          <LogoIcon />
        </Link>
      </h1>
      <div className="navbar-seperator" style={{ margin: '0px 1.375rem' }}></div>
      {appName && (
        <div className="d-flex align-items-center app-title">
          <span>{appName}</span>
        </div>
      )}
    </div>
  );

  const _renderMobileNavigationMenu = () => (
    <MobileNavigationMenu
      pages={pages}
      currentPageId={currentPageId}
      switchPage={switchPage}
      darkMode={darkMode}
      changeDarkMode={changeDarkMode}
      showHeader={showHeader}
    />
  );

  const _renderPreviewSettings = () => (
    <PreviewSettings
      isMobileLayout
      showHeader={showHeader}
      setAppDefinitionFromVersion={setAppDefinitionFromVersion}
      darkMode={darkMode}
    />
  );

  const _renderDarkModeBtn = (args) => {
    const styles = args?.styles ?? {};
    return (
      <span
        className="released-version-no-header-dark-mode-icon"
        style={{ position: 'absolute', top: '7px', ...styles }}
      >
        <DarkModeToggle switchDarkMode={changeDarkMode} darkMode={darkMode} />
      </span>
    );
  };

  if (!showHeader && isVersionReleased) {
    return <>{showViewerNavigation ? _renderMobileNavigationMenu() : _renderDarkModeBtn()}</>;
  }

  if (!showHeader && !isVersionReleased) {
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
          {!isEmpty(editingVersion) && _renderPreviewSettings()}
          {!showViewerNavigation && _renderDarkModeBtn()}
        </Header>
      </>
    );
  }

  return (
    <Header
      styles={{
        height: '46px',
      }}
    >
      <div className="d-flex">
        <span style={{}}>{_renderAppNameAndLogo()}</span>
        {showViewerNavigation && _renderMobileNavigationMenu()}
      </div>
      {!isVersionReleased && !isEmpty(editingVersion) && _renderPreviewSettings()}
      {!showViewerNavigation && _renderDarkModeBtn({ styles: { top: '2px' } })}
    </Header>
  );
};

export default MobileHeader;
