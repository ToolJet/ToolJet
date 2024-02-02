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

const DesktopHeader = ({ showHeader, appName, changeDarkMode, darkMode, setAppDefinitionFromVersion }) => {
  const { isVersionReleased, editingVersion } = useAppVersionStore(
    (state) => ({
      isVersionReleased: state.isVersionReleased,
      editingVersion: state?.editingVersion,
    }),
    shallow
  );
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

  if (!showHeader) {
    return (
      <>
        {!isVersionReleased && !isEmpty(editingVersion) && (
          <PreviewSettings
            isMobileLayout={false}
            showHeader={showHeader}
            setAppDefinitionFromVersion={setAppDefinitionFromVersion}
            darkMode={darkMode}
          />
        )}
        <span className="released-version-no-header-dark-mode-icon">
          <DarkModeToggle switchDarkMode={changeDarkMode} darkMode={darkMode} />
        </span>
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
      {!isVersionReleased && !isEmpty(editingVersion) && (
        <PreviewSettings
          isMobileLayout={false}
          showHeader={showHeader}
          setAppDefinitionFromVersion={setAppDefinitionFromVersion}
          darkMode={darkMode}
        />
      )}
      <div className="d-flex align-items-center">
        <DarkModeToggle switchDarkMode={changeDarkMode} darkMode={darkMode} />
      </div>
    </Header>
  );
};

export default DesktopHeader;
