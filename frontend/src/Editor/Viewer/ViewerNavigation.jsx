import React from 'react';
import _, { noop } from 'lodash';
// eslint-disable-next-line import/no-unresolved
import { slide as MobileMenu } from 'react-burger-menu';
import LogoIcon from '@assets/images/rocket.svg';
import { Link } from 'react-router-dom';
import { DarkModeToggle } from '@/_components/DarkModeToggle';
import Header from './Header';
import FolderList from '@/_ui/FolderList/FolderList';
import { useEditorStore } from '@/_stores/editorStore';
import { shallow } from 'zustand/shallow';
import { redirectToDashboard } from '@/_helpers/routes';
import './viewer.scss';
import { AppVersionsManager } from '../AppVersionsManager/AppVersionsManager';
import { useAppInfo } from '@/_stores/appDataStore';
import classNames from 'classnames';
import Avatar from '@/_ui/Avatar';
import { useCurrentStateStore } from '@/_stores/currentStateStore';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import Cross from '@/_ui/Icon/solidIcons/Cross';

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

const MobileNavigationMenu = ({
  pages,
  switchPage,
  currentPageId,
  darkMode,
  changeDarkMode,
  showHeader,
  avatarText,
  avatarTitle,
  setAppDefinitionFromVersion,
}) => {
  const [hamburgerMenuOpen, setHamburgerMenuOpen] = React.useState(false);
  const { appId, isPublic } = useAppInfo();
  const handlepageSwitch = (pageId) => {
    setHamburgerMenuOpen(false);
    switchPage(pageId);
  };
  const isVersionReleased = useAppVersionStore((state) => state.isVersionReleased, shallow);
  var styles = {
    bmBurgerButton: {
      position: 'fixed',
      width: '16px',
      height: '16px',
      top: '1rem',
      left: '1rem',
    },
    bmBurgerBars: {
      background: 'var(--slate12)',
    },
    bmCrossButton: {
      display: 'none',
    },
    bmCross: {
      background: '#bdc3c7',
    },
    bmMenuWrap: {
      height: '100%',
      width: 'calc(100% - 20%)',
      top: 0,
      left: 0,
    },
    bmMenu: {
      background: darkMode ? '#202B37' : '#fff',
      padding: '0',
    },
    bmMorphShape: {
      fill: '#373a47',
    },
    bmItemList: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'var(--base)',
    },
    bmItem: {
      display: 'inline-block',
      padding: '0.5rem 0rem',
      width: '100%',
    },
    bmOverlay: {
      background: 'rgba(0, 0, 0, 0.3)',
    },
  };

  return (
    <>
      <MobileMenu
        isOpen={hamburgerMenuOpen}
        styles={styles}
        pageWrapId={'page-wrap'}
        outerContainerId={'outer-container'}
        onStateChange={(state) => setHamburgerMenuOpen(state.isOpen)}
        left
      >
        <div className="pt-0">
          <Header className={'mobile-header'}>
            <div className="py-2 row w-100">
              <div className="col">
                <span style={{ color: 'var(--slate12)' }}>Menu</span>
              </div>
              <div onClick={() => setHamburgerMenuOpen(false)} className="col-1">
                <Cross fill={'var(--slate12)'} />
              </div>
            </div>
          </Header>

          <div className="w-100">
            <div className={`pages-container ${darkMode && 'dark'}`}>
              {pages.map(([id, page]) =>
                page.hidden || page.disabled ? null : (
                  <div
                    key={page.handle}
                    onClick={() => handlepageSwitch(id)}
                    className={`viewer-page-handler mb-2 cursor-pointer ${darkMode && 'dark'}`}
                  >
                    <div className={`card mb-1  ${id === currentPageId ? 'active' : ''}`}>
                      <div className="card-body">
                        <span style={{ color: 'var(--slate12)' }}>{_.truncate(page.name, { length: 22 })}</span>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
        <div>
          <hr className="m-0" />
          {!isVersionReleased && (
            <div className="p-3">
              <AppVersionsManager
                appId={appId}
                setAppDefinitionFromVersion={(data) => {
                  setAppDefinitionFromVersion(data);
                  setHamburgerMenuOpen(false);
                }}
                onVersionDelete={noop}
                isPublic={isPublic ?? false}
                isEditable={false}
              />
            </div>
          )}
          {isVersionReleased && showHeader && (
            <div className="p-3 d-flex align-items-center">
              <Avatar title={avatarTitle} text={avatarText} borderShape="rounded" realtime={true} />
              <span
                style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginLeft: '12px',
                }}
              >
                {avatarTitle}
              </span>
            </div>
          )}
          <div className="d-flex justify-content-center">
            <div
              className={`d-flex align-items-center justify-content-center`}
              style={{ border: '1px solid var(--slate7)', width: 'calc(100% - 20px)' }}
            >
              <DarkModeToggle switchDarkMode={changeDarkMode} darkMode={darkMode} showText={true} />
            </div>
          </div>
        </div>
      </MobileMenu>
    </>
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
}) => {
  const { currentLayout } = useEditorStore(
    (state) => ({
      currentLayout: state?.currentLayout,
    }),
    shallow
  );
  const isVersionReleased = useAppVersionStore((state) => state.isVersionReleased, shallow);
  const { appId, isPublic } = useAppInfo();
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

  // Mobile Layouts
  if (isMobileLayout && !showHeader && isVersionReleased) {
    return (
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
    );
  }

  if (isMobileLayout && !showHeader && !isVersionReleased) {
    return (
      <>
        <MobileNavigationMenu
          pages={pages}
          currentPageId={currentPageId}
          switchPage={switchPage}
          darkMode={darkMode}
          changeDarkMode={changeDarkMode}
          showHeader={showHeader}
        />
        <div className="released-version-no-header-mbl-preview">
          <span
            style={{
              backgroundColor: isMobileLayout ? 'var(--slate12)' : 'var(--slate5)',
              color: isMobileLayout ? 'var(--slate1)' : 'var(--slate12)',
            }}
            className="preview-chip"
          >
            Preview
          </span>
        </div>
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
          <MobileNavigationMenu
            pages={pages}
            currentPageId={currentPageId}
            switchPage={switchPage}
            darkMode={darkMode}
            changeDarkMode={changeDarkMode}
            showHeader={showHeader}
            setAppDefinitionFromVersion={setAppDefinitionFromVersion}
          />
          <span style={{ marginLeft: '40px' }}>{_renderAppNameAndLogo()}</span>
        </div>
      )}
      <>
        {!isMobileLayout && _renderAppNameAndLogo()}
        {!isVersionReleased && (
          <span
            style={{
              backgroundColor: isMobileLayout ? 'var(--slate12)' : 'var(--slate5)',
              color: isMobileLayout ? 'var(--slate1)' : 'var(--slate12)',
            }}
            className="preview-chip"
          >
            Preview
          </span>
        )}
      </>
      {currentLayout !== 'mobile' && (
        <div className="d-flex align-items-center">
          {!isVersionReleased && (
            <AppVersionsManager
              appId={appId}
              setAppDefinitionFromVersion={setAppDefinitionFromVersion}
              onVersionDelete={noop}
              isPublic={isPublic ?? false}
              isEditable={false}
            />
          )}
          <DarkModeToggle switchDarkMode={changeDarkMode} darkMode={darkMode} />
          {isVersionReleased && (
            <div style={{ marginLeft: '16px' }}>
              <Avatar
                key={currentUser?.id}
                title={getAvatarTitle()}
                text={getAvatarText()}
                borderShape="rounded"
                indexId={currentUser?.id}
                realtime={true}
              />
            </div>
          )}
        </div>
      )}
    </Header>
  );
};

const Footer = ({ darkMode, switchDarkMode }) => {
  return (
    <div className="viewer-footer fixed-bottom">
      <footer className="border-top">
        <div className={`d-flex align-items-center p-2 mx-3 position-absolute`}>
          <DarkModeToggle switchDarkMode={switchDarkMode} darkMode={darkMode} showText={true} />
        </div>
      </footer>
    </div>
  );
};

// ViewerNavigation.BurgerMenu = MobileNavigationMenu;
ViewerNavigation.Header = ViewerHeader;
ViewerNavigation.Footer = Footer;
