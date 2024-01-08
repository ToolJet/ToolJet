import React from 'react';
import _ from 'lodash';
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
  const isVersionReleased = useAppVersionStore((state) => state.isVersionReleased, shallow);

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
        <div className="d-flex align-items-center">
          <span>{appName}</span>
        </div>
      )}
    </div>
  );

  // Mobile layout
  if (!showHeader && isVersionReleased) {
    return (
      <Header
        styles={{
          height: '46px',
          backgroundColor: '#f2f2f5',
          position: 'fixed',
          width: '450px',
          zIndex: '100',
        }}
        showNavbarClass={false}
      >
        {showViewerNavigation ? (
          <MobileNavigationMenu
            pages={pages}
            currentPageId={currentPageId}
            switchPage={switchPage}
            darkMode={darkMode}
            changeDarkMode={changeDarkMode}
            showHeader={showHeader}
          />
        ) : (
          <span className="released-version-no-header-dark-mode-icon" style={{ position: 'absolute', top: '7px' }}>
            <DarkModeToggle switchDarkMode={changeDarkMode} darkMode={darkMode} />
          </span>
        )}
      </Header>
    );
  }

  if (!showHeader && !isVersionReleased) {
    return (
      <>
        <Header
          styles={{
            height: '46px',
            backgroundColor: '#f2f2f5',
            position: 'fixed',
            width: '450px',
            zIndex: '100',
          }}
          showNavbarClass={false}
        >
          {showViewerNavigation && (
            <MobileNavigationMenu
              pages={pages}
              currentPageId={currentPageId}
              switchPage={switchPage}
              darkMode={darkMode}
              changeDarkMode={changeDarkMode}
              showHeader={showHeader}
            />
          )}
          <PreviewSettings
            isMobileLayout
            showHeader={showHeader}
            setAppDefinitionFromVersion={setAppDefinitionFromVersion}
          />
          {!showViewerNavigation && (
            <span className="released-version-no-header-dark-mode-icon" style={{ position: 'absolute', top: '7px' }}>
              <DarkModeToggle switchDarkMode={changeDarkMode} darkMode={darkMode} />
            </span>
          )}
        </Header>
      </>
    );
  }

  return (
    <Header
      styles={{
        height: '46px',
        position: 'fixed',
        width: '450px',
        zIndex: '100',
      }}
    >
      <div className="d-flex">
        <span style={{}}>{_renderAppNameAndLogo()}</span>
        {showViewerNavigation && (
          <MobileNavigationMenu
            pages={pages}
            currentPageId={currentPageId}
            switchPage={switchPage}
            darkMode={darkMode}
            changeDarkMode={changeDarkMode}
            showHeader={showHeader}
          />
        )}
      </div>
      {!isVersionReleased && (
        <PreviewSettings
          isMobileLayout
          showHeader={showHeader}
          setAppDefinitionFromVersion={setAppDefinitionFromVersion}
        />
      )}
      {!showViewerNavigation && (
        <span className="released-version-no-header-dark-mode-icon" style={{ position: 'absolute', top: '7px' }}>
          <DarkModeToggle switchDarkMode={changeDarkMode} darkMode={darkMode} />
        </span>
      )}
    </Header>
  );
};

export default MobileHeader;
