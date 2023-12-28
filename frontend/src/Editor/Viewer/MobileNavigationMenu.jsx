import React from 'react';
import _ from 'lodash';
// eslint-disable-next-line import/no-unresolved
import { slide as MobileMenu } from 'react-burger-menu';
import { DarkModeToggle } from '@/_components/DarkModeToggle';
import Header from './Header';
import { shallow } from 'zustand/shallow';
import './viewer.scss';
import { useAppInfo } from '@/_stores/appDataStore';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import Cross from '@/_ui/Icon/solidIcons/Cross';

const MobileNavigationMenu = ({
  pages,
  switchPage,
  currentPageId,
  darkMode,
  changeDarkMode,
  //   showHeader,
  //   avatarText,
  //   avatarTitle,
  //   setAppDefinitionFromVersion,
}) => {
  const [hamburgerMenuOpen, setHamburgerMenuOpen] = React.useState(false);
  //   const { appId, isPublic } = useAppInfo();
  const handlepageSwitch = (pageId) => {
    setHamburgerMenuOpen(false);
    switchPage(pageId);
  };
  //   const isVersionReleased = useAppVersionStore((state) => state.isVersionReleased, shallow);
  var styles = {
    bmBurgerButton: {
      position: 'fixed',
      width: '16px',
      height: '16px',
      top: '1rem',
      right: '1rem',
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
          <hr className="m-0 mb-3" />
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

export default MobileNavigationMenu;
