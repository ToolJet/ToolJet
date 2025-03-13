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
import PreviewSettings from './PreviewSettings';
import useStore from '@/AppBuilder/_stores/store';
import AppLogo from '@/_components/AppLogo';

const DesktopHeader = ({
  showHeader,
  appName,
  darkMode,
  setAppDefinitionFromVersion,
  isAppLoaded,
  changeToDarkMode,
}) => {
  const { showDarkModeToggle, isReleasedVersionId } = useStore(
    (state) => ({
      isReleasedVersionId: state?.releasedVersionId == state.currentVersionId || state.isVersionReleased,
      showDarkModeToggle: state.globalSettings.appMode === 'auto' || !state.globalSettings.appMode,
    }),
    shallow
  );

  const _renderAppNameAndLogo = () => (
    <div
      className={classNames('d-flex', 'align-items-center')}
      style={{ visibility: showHeader || isReleasedVersionId ? 'visible' : 'hidden' }}
    >
      <h1 className="navbar-brand d-none-navbar-horizontal pe-0">
        <Link
          data-cy="viewer-page-logo"
          onClick={() => {
            redirectToDashboard();
          }}
        >
          <AppLogo isLoadingFromHeader={false} viewer={true} />
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

  if (!showHeader) {
    return (
      <>
        {!isReleasedVersionId && (
          <PreviewSettings
            isMobileLayout={false}
            showHeader={showHeader}
            setAppDefinitionFromVersion={setAppDefinitionFromVersion}
            darkMode={darkMode}
          />
        )}
        {showDarkModeToggle && isAppLoaded && (
          <span className="released-version-no-header-dark-mode-icon">
            <DarkModeToggle switchDarkMode={changeToDarkMode} darkMode={darkMode} />
          </span>
        )}
      </>
    );
  }
  return (
    <Header
      styles={{
        height: '46px',
      }}
    >
      {_renderAppNameAndLogo()}
      {!isReleasedVersionId && (
        <PreviewSettings
          isMobileLayout={false}
          showHeader={showHeader}
          setAppDefinitionFromVersion={setAppDefinitionFromVersion}
          darkMode={darkMode}
        />
      )}
      {showDarkModeToggle && (
        <div className="d-flex align-items-center">
          <DarkModeToggle switchDarkMode={changeToDarkMode} darkMode={darkMode} />
        </div>
      )}
    </Header>
  );
};

export default DesktopHeader;
