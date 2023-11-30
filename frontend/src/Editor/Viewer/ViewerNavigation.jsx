import React from 'react';
import _ from 'lodash';
// eslint-disable-next-line import/no-unresolved
import { slide as Menu } from 'react-burger-menu';
import LogoIcon from '@assets/images/rocket.svg';
import { Link } from 'react-router-dom';
import { DarkModeToggle } from '@/_components/DarkModeToggle';
import Header from './Header';
import FolderList from '@/_ui/FolderList/FolderList';
import { useEditorStore } from '@/_stores/editorStore';
import { shallow } from 'zustand/shallow';
import { redirectToDashboard } from '@/_helpers/routes';

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

const MobileNavigationMenu = ({ pages, switchPage, currentPageId, darkMode, changeDarkMode }) => {
  const [hamburgerMenuOpen, setHamburgerMenuOpen] = React.useState(false);

  const handlepageSwitch = (pageId) => {
    setHamburgerMenuOpen(false);
    switchPage(pageId);
  };

  var styles = {
    bmBurgerButton: {
      position: 'fixed',
      width: '21px',
      height: '16px',
      right: 10,
      top: 15,
    },
    bmBurgerBars: {
      background: darkMode ? '#4C5155' : 'rgb(77, 114, 250)',
    },
    bmCrossButton: {
      display: 'none',
    },
    bmCross: {
      background: '#bdc3c7',
    },
    bmMenuWrap: {
      height: '100%',
      width: '100%',
      top: 0,
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
    },
    bmItem: {
      display: 'inline-block',
    },
    bmOverlay: {
      background: 'rgba(0, 0, 0, 0.3)',
    },
  };

  return (
    <>
      <Menu
        isOpen={hamburgerMenuOpen}
        styles={styles}
        pageWrapId={'page-wrap'}
        outerContainerId={'outer-container'}
        onStateChange={(state) => setHamburgerMenuOpen(state.isOpen)}
        right
      >
        <Header className={'mobile-header'}>
          <div className="py-2 row w-100">
            <div onClick={() => setHamburgerMenuOpen(false)} className="col-1 mx-1">
              <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect y="0.0507812" width="20" height="20" rx="4" fill="#F0F4FF"></rect>
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M5.52851 5.57942C5.78886 5.31907 6.21097 5.31907 6.47132 5.57942L9.99992 9.10801L13.5285 5.57942C13.7889 5.31907 14.211 5.31907 14.4713 5.57942C14.7317 5.83977 14.7317 6.26188 14.4713 6.52223L10.9427 10.0508L14.4713 13.5794C14.7317 13.8398 14.7317 14.2619 14.4713 14.5222C14.211 14.7826 13.7889 14.7826 13.5285 14.5222L9.99992 10.9936L6.47132 14.5222C6.21097 14.7826 5.78886 14.7826 5.52851 14.5222C5.26816 14.2619 5.26816 13.8398 5.52851 13.5794L9.05711 10.0508L5.52851 6.52223C5.26816 6.26188 5.26816 5.83977 5.52851 5.57942Z"
                  fill="#3E63DD"
                ></path>
              </svg>
            </div>
            <div style={{ marginTop: '2px' }} className="col">
              <span>Menu</span>
            </div>
          </div>
        </Header>

        <div className="p-2 w-100">
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
                      <span className="mx-3">{_.truncate(page.name, { length: 22 })}</span>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
        <ViewerNavigation.Footer darkMode={darkMode} switchDarkMode={changeDarkMode} />
      </Menu>
    </>
  );
};

const ViewerHeader = ({ showHeader, appName, changeDarkMode, darkMode, pages, currentPageId, switchPage }) => {
  const { currentLayout } = useEditorStore(
    (state) => ({
      currentLayout: state?.currentLayout,
    }),
    shallow
  );
  if (!showHeader && currentLayout !== 'mobile') {
    return null;
  }

  return (
    <Header
      styles={{
        height: '48px',
      }}
    >
      {showHeader && (
        <>
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
          {appName && <span>{appName}</span>}
        </>
      )}
      {currentLayout !== 'mobile' && <DarkModeToggle switchDarkMode={changeDarkMode} darkMode={darkMode} />}
      {currentLayout === 'mobile' && (
        <ViewerNavigation.BurgerMenu
          pages={pages}
          currentPageId={currentPageId}
          switchPage={switchPage}
          darkMode={darkMode}
          changeDarkMode={changeDarkMode}
        />
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

ViewerNavigation.BurgerMenu = MobileNavigationMenu;
ViewerNavigation.Header = ViewerHeader;
ViewerNavigation.Footer = Footer;
