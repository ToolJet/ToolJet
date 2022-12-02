import React from 'react';
import _ from 'lodash';
import { slide as Menu } from 'react-burger-menu';
import { useMounted } from '@/_hooks/use-mount.jsx';
import LogoIcon from '../Icons/logo.svg';
import { Link } from 'react-router-dom';
import { DarkModeToggle } from '@/_components/DarkModeToggle';

export const ViewerNavigation = ({
  isMobileDevice,
  canvasBackgroundColor,
  pages,
  currentPageId,
  switchPage,
  darkMode,
}) => {
  if (isMobileDevice) {
    return null;
  }

  return (
    <div
      className="navigation-area"
      style={{
        width: 200,
        backgroundColor: canvasBackgroundColor,
      }}
    >
      <div className="page-handler-wrapper">
        {pages.map(
          ([id, page]) =>
            !page.hidden && (
              <div
                key={page.handle}
                onClick={() => switchPage(id)}
                className={`viewer-page-handler cursor-pointer ${darkMode && 'dark'}`}
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
  );
};

const MobileNavigationMenu = ({ pages, switchPage, currentPageId, darkMode }) => {
  const isMounted = useMounted();
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
      top: 16,
    },
    bmBurgerBars: {
      background: darkMode ? '#4C5155' : 'rgb(77, 114, 250)',
    },
    bmCrossButton: {
      height: '24px',
      width: '24px',
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
      padding: '2.5em 1.5em 0',
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

  React.useEffect(() => {
    if (isMounted && currentPageId) {
      switchPage(currentPageId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]);

  return (
    <Menu
      isOpen={hamburgerMenuOpen}
      styles={styles}
      pageWrapId={'page-wrap'}
      outerContainerId={'outer-container'}
      onStateChange={(state) => setHamburgerMenuOpen(state.isOpen)}
      right
    >
      {pages.map(
        ([id, page]) =>
          !page.hidden && (
            <div
              key={page.handle}
              onClick={() => handlepageSwitch(id)}
              className={`viewer-page-handler cursor-pointer ${darkMode && 'dark'}`}
            >
              <div className={`card mb-1  ${id === currentPageId ? 'active' : ''}`}>
                <div className="card-body">
                  <span className="mx-3">{_.truncate(page.name, { length: 22 })}</span>
                </div>
              </div>
            </div>
          )
      )}
    </Menu>
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
  currentLayout,
}) => {
  return (
    <div className="header">
      <header className="navbar navbar-expand-md navbar-light d-print-none">
        <div className="container-xl header-container position-relative">
          {showHeader && (
            <>
              <h1 className="navbar-brand navbar-brand-autodark d-none-navbar-horizontal pe-0">
                <Link to="/" data-cy="viewer-page-logo">
                  <LogoIcon />
                </Link>
              </h1>
              {appName && <span>{appName}</span>}
            </>
          )}
          <div className={`d-flex align-items-center m-1 p-1`}>
            <DarkModeToggle switchDarkMode={changeDarkMode} darkMode={darkMode} />
          </div>
          {currentLayout === 'mobile' && (
            <ViewerNavigation.BurgerMenu
              pages={pages}
              currentPageId={currentPageId}
              switchPage={switchPage}
              darkMode={darkMode}
            />
          )}
        </div>
      </header>
    </div>
  );
};

ViewerNavigation.BurgerMenu = MobileNavigationMenu;
ViewerNavigation.Header = ViewerHeader;
