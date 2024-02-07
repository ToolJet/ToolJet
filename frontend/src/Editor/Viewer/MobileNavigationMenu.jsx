import React, { useState } from 'react';
import _ from 'lodash';
// eslint-disable-next-line import/no-unresolved
import { slide as MobileMenu } from 'react-burger-menu';
import { DarkModeToggle } from '@/_components/DarkModeToggle';
import Header from './Header';
import Cross from '@/_ui/Icon/solidIcons/Cross';

const MobileNavigationMenu = ({ pages, switchPage, currentPageId, darkMode, changeDarkMode }) => {
  const [hamburgerMenuOpen, setHamburgerMenuOpen] = useState(false);
  const handlepageSwitch = (pageId) => {
    setHamburgerMenuOpen(false);
    switchPage(pageId);
  };
  var styles = {
    bmBurgerButton: {
      position: 'absolute',
      width: '16px',
      height: '16px',
      top: '13px',
      right: '1rem',
    },
    bmBurgerBars: {
      background: 'var(--slate12)',
    },
    bmCrossButton: {
      display: 'none',
      cursor: 'pointer',
    },
    bmCross: {
      background: '#bdc3c7',
    },
    bmMenuWrap: {
      height: '100%',
      width: 'calc(100% - 20%)',
      top: 0,
      right: 0,
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
        right
      >
        <div className="pt-0">
          <Header className={'mobile-header'}>
            <div className="py-2 row w-100">
              <div className="col">
                <span style={{ color: 'var(--slate12)' }}>Menu</span>
              </div>
              <div onClick={() => setHamburgerMenuOpen(false)} className="col-1 cursor-pointer">
                <Cross fill={'var(--slate12)'} />
              </div>
            </div>
          </Header>

          <div className="w-100">
            <div className={`pages-container ${darkMode && 'dark'}`}>
              {pages.map((page) =>
                page?.hidden || page?.disabled ? null : (
                  <div
                    key={page.handle}
                    onClick={() => handlepageSwitch(page?.id)}
                    className={`viewer-page-handler mb-2 cursor-pointer ${darkMode && 'dark'}`}
                  >
                    <div className={`card mb-1  ${page?.id === currentPageId ? 'active' : ''}`}>
                      <div className="card-body">
                        <span style={{ color: 'var(--slate12)' }}>{_.truncate(page?.name, { length: 22 })}</span>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
        <div>
          <hr className="m-0 mb-3" />
          <div className="d-flex justify-content-center">
            <div
              className={`d-flex align-items-center justify-content-center`}
              style={{ border: '1px solid var(--slate7)', width: 'calc(100% - 20px)' }}
            >
              <DarkModeToggle
                switchDarkMode={changeDarkMode}
                darkMode={darkMode}
                showText={true}
                tooltipPlacement={'top'}
              />
            </div>
          </div>
        </div>
      </MobileMenu>
    </>
  );
};

export default MobileNavigationMenu;
