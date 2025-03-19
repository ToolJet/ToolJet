import React, { useState } from 'react';
import _ from 'lodash';
// eslint-disable-next-line import/no-unresolved
import { slide as MobileMenu } from 'react-burger-menu';
import { DarkModeToggle } from '@/_components/DarkModeToggle';
import Header from './Header';
import Cross from '@/_ui/Icon/solidIcons/Cross';
import useStore from '@/AppBuilder/_stores/store';
import { buildTree } from '../LeftSidebar/PageMenu/Tree/utilities';
import * as Icons from '@tabler/icons-react';

const RenderGroup = ({ pages, pageGroup, currentPage, darkMode, handlepageSwitch, currentPageId, icon }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const groupActive = currentPage.pageGroupId === pageGroup?.id;
  const homePageId = useStore((state) => state.app.homePageId);
  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };
  // eslint-disable-next-line import/namespace
  const IconElement = Icons?.[pageGroup?.icon] ?? Icons?.['IconFileDescription'];
  return (
    <>
      <div style={{ border: 'none' }} className={`accordion-item  ${darkMode ? 'dark-mode' : ''} `}>
        <div
          onClick={handleToggle}
          key={pageGroup.id}
          className={`viewer-page-handler mb-2 cursor-pointer page-group-wrapper ${
            groupActive ? 'page-group-active' : ''
          } ${darkMode && 'dark'}`}
        >
          <div className={`card mb-1`}>
            <div className="card-body">
              <IconElement />
              <span style={{ color: 'var(--slate12)' }}>{_.truncate(pageGroup?.name, { length: 22 })}</span>
              <svg
                className={`page-group-collapse ${isExpanded ? 'expanded' : 'collapsed'}`}
                width={17}
                height={16}
                viewBox="0 0 17 16"
                fill="black"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11.1257 4L5.27446 4C4.50266 4 4.02179 4.83721 4.41068 5.50387L7.33631 10.5192C7.72218 11.1807 8.67798 11.1807 9.06386 10.5192L11.9895 5.50387C12.3784 4.83721 11.8975 4 11.1257 4Z"
                  fill="#ACB2B9"
                />
              </svg>
            </div>
          </div>
        </div>
        {isExpanded && (
          <div style={{ paddingLeft: '16px' }}>
            {pages.map((page) => {
              const isHomePage = page.id === homePageId;
              const iconName = isHomePage && !page.icon ? 'IconHome2' : page.icon;
              // eslint-disable-next-line import/namespace
              const IconElement = Icons?.[iconName] ?? Icons?.['IconFileDescription'];
              return page?.hidden || page?.disabled ? null : (
                <div
                  key={page.handle}
                  onClick={() => handlepageSwitch(page?.id)}
                  className={`viewer-page-handler mb-2 cursor-pointer ${darkMode && 'dark'}`}
                >
                  <div className={`card mb-1  ${page?.id === currentPageId ? 'active' : ''}`}>
                    <div className="card-body">
                      <IconElement />
                      <span style={{ color: 'var(--slate12)' }}>{_.truncate(page?.name, { length: 22 })}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

const RenderPageGroups = ({ pages, handlepageSwitch, darkMode, currentPageId, currentPage }) => {
  const tree = buildTree(pages);
  const homePageId = useStore((state) => state.app.homePageId);
  return (
    <div className="w-100">
      <div className={`pages-container ${darkMode && 'dark'}`}>
        {tree.map((page) => {
          if (page.isPageGroup) {
            return (
              <RenderGroup
                currentPage={currentPage}
                key={page.id}
                pages={page.children}
                pageGroup={page}
                currentPageId={currentPageId}
                darkMode={darkMode}
                handlepageSwitch={handlepageSwitch}
              />
            );
          } else {
            const isHomePage = page.id === homePageId;
            const iconName = isHomePage && !page.icon ? 'IconHome2' : page.icon;
            // eslint-disable-next-line import/namespace
            const IconElement = Icons?.[iconName] ?? Icons?.['IconFileDescription'];
            return page?.hidden || page?.disabled ? null : (
              <div
                key={page.handle}
                onClick={() => handlepageSwitch(page?.id)}
                className={`viewer-page-handler mb-2 cursor-pointer ${darkMode && 'dark'}`}
              >
                <div className={`card mb-1  ${page?.id === currentPageId ? 'active' : ''}`}>
                  <div className="card-body">
                    <IconElement />
                    <span style={{ color: 'var(--slate12)' }}>{_.truncate(page?.name, { length: 22 })}</span>
                  </div>
                </div>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
};

const MobileNavigationMenu = ({ pages, switchPage, currentPageId, darkMode, changeToDarkMode, showDarkModeToggle }) => {
  const selectedVersionName = useStore((state) => state.selectedVersion?.name);
  const selectedEnvironmentName = useStore((state) => state.selectedEnvironment?.name);
  const license = useStore((state) => state.license);

  const [hamburgerMenuOpen, setHamburgerMenuOpen] = useState(false);
  const handlepageSwitch = (pageId) => {
    setHamburgerMenuOpen(false);
    const queryParams = {
      version: selectedVersionName,
      env: selectedEnvironmentName,
    };
    switchPage(pageId, pages.find((page) => page.id === pageId)?.handle, Object.entries(queryParams), true);
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

  const currentPage = pages.find((page) => page.id === currentPageId);

  const isLicensed =
    !_.get(license, 'featureAccess.licenseStatus.isExpired', true) &&
    _.get(license, 'featureAccess.licenseStatus.isLicenseValid', false);
  const homePageId = useStore((state) => state.app.homePageId);

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
              {isLicensed ? (
                <RenderPageGroups
                  pages={pages}
                  currentPageId={currentPageId}
                  darkMode={darkMode}
                  handlepageSwitch={handlepageSwitch}
                  currentPage={currentPage}
                />
              ) : (
                pages.map((page) => {
                  const isHomePage = page.id === homePageId;
                  const iconName = isHomePage && !page.icon ? 'IconHome2' : page.icon;
                  // eslint-disable-next-line import/namespace
                  const IconElement = Icons?.[iconName] ?? Icons?.['IconFileDescription'];
                  return page?.hidden || page?.disabled ? null : (
                    <div
                      key={page.handle}
                      onClick={() => handlepageSwitch(page?.id)}
                      className={`viewer-page-handler mb-2 cursor-pointer ${darkMode && 'dark'}`}
                    >
                      <div className={`card mb-1  ${page?.id === currentPageId ? 'active' : ''}`}>
                        <div className="card-body">
                          <IconElement />
                          <span style={{ color: 'var(--slate12)' }}>{_.truncate(page?.name, { length: 22 })}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
        {showDarkModeToggle && (
          <div>
            <hr className="m-0 mb-3" />
            <div className="d-flex justify-content-center">
              <div
                className={`d-flex align-items-center justify-content-center`}
                style={{ border: '1px solid var(--slate7)', width: 'calc(100% - 20px)' }}
              >
                <DarkModeToggle
                  switchDarkMode={changeToDarkMode}
                  darkMode={darkMode}
                  showText={true}
                  tooltipPlacement={'top'}
                />
              </div>
            </div>
          </div>
        )}
      </MobileMenu>
    </>
  );
};

export default MobileNavigationMenu;
