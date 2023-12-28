import React from 'react';
import _ from 'lodash';
// eslint-disable-next-line import/no-unresolved
import LogoIcon from '@assets/images/rocket.svg';
import { Link } from 'react-router-dom';
import { DarkModeToggle } from '@/_components/DarkModeToggle';
import Header from './Header';
import FolderList from '@/_ui/FolderList/FolderList';
import { useEditorStore } from '@/_stores/editorStore';
import { shallow } from 'zustand/shallow';
import { redirectToDashboard } from '@/_helpers/routes';
import './viewer.scss';
import classNames from 'classnames';
import { useCurrentStateStore } from '@/_stores/currentStateStore';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import PreviewSettings from './PreviewSettings';
import MobileNavigationMenu from './MobileNavigationMenu';

export const ViewerNavigation = ({ isMobileDevice, pages, currentPageId, switchPage, darkMode }) => {
  if (isMobileDevice) {
    return null;
  }
  return (
    <div
      className={`navigation-area`}
      style={{
        width: 200,
        // backgroundColor: canvasBackgroundColor,
      }}
    >
      <div className="page-handler-wrapper">
        {pages.map(([id, page]) =>
          page.hidden || page.disabled ? null : (
            <FolderList key={page.handle} onClick={() => switchPage(id)} selectedItem={id === currentPageId}>
              <span data-cy={`pages-name-${String(page.name).toLowerCase()}`} className="mx-3 text-wrap">
                {_.truncate(page.name, { length: 18 })}
              </span>
            </FolderList>
          )
        )}
      </div>
    </div>
  );
};

const ViewerHeader = ({
  showHeader,
  appName,
  changeDarkMode,
  darkMode,
  pages,
  currentPageId,
  switchPage,
  setAppDefinitionFromVersion,
  showViewerNavigation,
  onAppEnvironmentChanged,
}) => {
  const { currentLayout } = useEditorStore(
    (state) => ({
      currentLayout: state?.currentLayout,
    }),
    shallow
  );
  const isVersionReleased = useAppVersionStore((state) => state.isVersionReleased, shallow);
  const currentUser = useCurrentStateStore((state) => state.globals.currentUser, shallow);
  const getAvatarText = () => currentUser?.firstName?.charAt(0) + currentUser?.lastName?.charAt(0);
  const getAvatarTitle = () => `${currentUser?.firstName} ${currentUser?.lastName}`;
  const isMobileLayout = currentLayout === 'mobile';

  const _renderAppNameAndLogo = () => (
    <div
      className={classNames('d-flex')}
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
      <div className={'viewer-vertical-line'}></div>
      {/* <div className="navbar-seperator"></div> */}

      {appName && (
        <div className="d-flex align-items-center">
          <span>{appName}</span>
        </div>
      )}
    </div>
  );

  // Desktop layout
  if (!isMobileLayout && !showHeader && isVersionReleased) {
    return (
      <span className="released-version-no-header-dark-mode-icon">
        <DarkModeToggle switchDarkMode={changeDarkMode} darkMode={darkMode} />
      </span>
    );
  }

  if (isMobileLayout && !showHeader && isVersionReleased) {
    return (
      <>
        {showViewerNavigation ? (
          <MobileNavigationMenu
            pages={pages}
            currentPageId={currentPageId}
            switchPage={switchPage}
            darkMode={darkMode}
            changeDarkMode={changeDarkMode}
            showHeader={showHeader}
            avatarText={getAvatarText()}
            avatarTitle={getAvatarTitle()}
          />
        ) : (
          <span className="released-version-no-header-dark-mode-icon">
            <DarkModeToggle switchDarkMode={changeDarkMode} darkMode={darkMode} />
          </span>
        )}
      </>
    );
  }

  if (isMobileLayout && !showHeader && !isVersionReleased) {
    return (
      <>
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
        <PreviewSettings isMobileLayout={true} showHeader={showHeader} />
        {!showViewerNavigation && (
          <span className="released-version-no-header-dark-mode-icon">
            <DarkModeToggle switchDarkMode={changeDarkMode} darkMode={darkMode} />
          </span>
        )}
      </>
    );
  }

  return (
    <Header
      styles={{
        height: '48px',
      }}
    >
      {isMobileLayout && (
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
              setAppDefinitionFromVersion={setAppDefinitionFromVersion}
            />
          )}
        </div>
      )}
      {!isMobileLayout && _renderAppNameAndLogo()}
      {!isVersionReleased && (
        <PreviewSettings
          isMobileLayout={isMobileLayout}
          showHeader={showHeader}
          setAppDefinitionFromVersion={setAppDefinitionFromVersion}
          onAppEnvironmentChanged={onAppEnvironmentChanged}
        />
      )}
      {isMobileLayout && !showViewerNavigation && (
        <span className="released-version-no-header-dark-mode-icon" style={{ top: 'auto' }}>
          <DarkModeToggle switchDarkMode={changeDarkMode} darkMode={darkMode} />
        </span>
      )}
      {currentLayout !== 'mobile' && (
        <div className="d-flex align-items-center">
          <DarkModeToggle switchDarkMode={changeDarkMode} darkMode={darkMode} />
        </div>
      )}
    </Header>
  );
};

ViewerNavigation.Header = ViewerHeader;
