import React from 'react';
import _ from 'lodash';
import { slide as Menu } from 'react-burger-menu';
import { useMounted } from '@/_hooks/use-mount.jsx';

export const ViewerNavigation = ({
  isMobileDevice,
  canvasBackgroundColor,
  pages,
  currentPageId,
  switchPage,
  darkMode,
}) => {
  // const isMounted = useMounted();

  if (isMobileDevice) {
    return null;
    // return (
    //   <ViewerNavigation.BurgerMenu
    //     // isMounted={isMounted}
    //     pages={pages}
    //     switchPage={switchPage}
    //     currentPageId={currentPageId}
    //     darkMode={darkMode}
    //   />
    // );
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

ViewerNavigation.BurgerMenu = MobileNavigationMenu;
