import React, { useEffect, useState } from 'react';
import _ from 'lodash';
// eslint-disable-next-line import/no-unresolved
import { slide as MobileMenu } from 'react-burger-menu';
import { DarkModeToggle } from '@/_components/DarkModeToggle';
import Header from './Header';
import Cross from '@/_ui/Icon/solidIcons/Cross';
import useStore from '@/AppBuilder/_stores/store';
import { buildTree } from '../RightSideBar/PageSettingsTab/PageMenu/Tree/utilities';
import * as Icons from '@tabler/icons-react';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { redirectToDashboard } from '@/_helpers/routes';
import AppLogo from '@/_components/AppLogo';
import { Link } from 'react-router-dom';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import OverflowTooltip from '@/_components/OverflowTooltip';

const RenderGroup = ({ pageGroup, currentPage, darkMode, handlepageSwitch, currentPageId, icon, pages }) => {
  const { moduleId } = useModuleContext();
  const [isExpanded, setIsExpanded] = useState(true);
  const groupActive = currentPage.pageGroupId === pageGroup?.id;
  const getPagesVisibility = useStore((state) => state.getPagesVisibility);

  const homePageId = useStore((state) => state.appStore.modules[moduleId].app.homePageId);
  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };
  // eslint-disable-next-line import/namespace
  const IconElement = Icons?.[pageGroup?.icon] ?? Icons?.['IconFile'];
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
              <span>{_.truncate(pageGroup?.name, { length: 22 })}</span>
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
              const IconElement = Icons?.[iconName] ?? Icons?.['IconFile'];
              const pageVisibility = getPagesVisibility('canvas', page?.id);

              return pageVisibility || page?.disabled ? null : (
                <div
                  key={page.handle}
                  onClick={() => handlepageSwitch(page?.id)}
                  className={`viewer-page-handler mb-2 cursor-pointer ${darkMode && 'dark'}`}
                >
                  <div className={`card mb-1  ${page?.id === currentPageId ? 'active' : ''}`}>
                    <div className="card-body">
                      <IconElement />
                      <span>{_.truncate(page?.name, { length: 22 })}</span>
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
  const { moduleId } = useModuleContext();
  const tree = buildTree(pages);
  const currentMode = useStore((state) => state.modeStore.modules[moduleId].currentMode);
  const getPagesVisibility = useStore((state) => state.getPagesVisibility);

  const homePageId = useStore((state) => state.appStore.modules[moduleId].app.homePageId);
  const filteredTree = tree.filter((page) => {
    const pageVisibility = getPagesVisibility('canvas', page?.id);

    return (
      (!page?.restricted || currentMode !== 'view') &&
      !pageVisibility &&
      !page?.disabled &&
      (!page?.isPageGroup ||
        (page.children?.length > 0 &&
          page.children.some((child) => !child?.disabled) &&
          page.children.some((child) => {
            const pageVisibility = getPagesVisibility('canvas', child?.id);
            return pageVisibility === false;
          })))
    );
  });
  return (
    <div className="w-100">
      <div className={`pages-container ${darkMode && 'dark'}`}>
        {filteredTree.map((page) => {
          if (
            page.isPageGroup &&
            page.children?.length === 0 &&
            (currentMode === 'view' ? !page.children.some((child) => child?.restricted === true) : true)
          ) {
            return null;
          }
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
            const pageVisibility = getPagesVisibility('canvas', page?.id);
            const iconName = isHomePage && !page.icon ? 'IconHome2' : page.icon;
            // eslint-disable-next-line import/namespace
            const IconElement = Icons?.[iconName] ?? Icons?.['IconFile'];

            return pageVisibility || page.disabled || (page?.restricted && currentMode !== 'edit') ? null : (
              <div
                key={page.handle}
                onClick={() => handlepageSwitch(page?.id)}
                className={`viewer-page-handler cursor-pointer ${darkMode && 'dark'}`}
              >
                <div className={`card ${page?.id === currentPageId ? 'active' : ''}`}>
                  <div className="card-body">
                    <IconElement />
                    <span>{_.truncate(page?.name, { length: 22 })}</span>
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

const MobileNavigationMenu = ({
  pages,
  switchPage,
  currentPageId,
  darkMode,
  changeToDarkMode,
  showDarkModeToggle,
  appName,
  viewerWrapperRef,
}) => {
  const { moduleId } = useModuleContext();
  const selectedVersionName = useStore((state) => state.selectedVersion?.name);
  const selectedEnvironmentName = useStore((state) => state.selectedEnvironment?.name);
  const license = useStore((state) => state.license);
  const [isViewportNarrow, setIsViewportNarrow] = useState(false);
  const [hamburgerMenuOpen, setHamburgerMenuOpen] = useState(false);

  useEffect(() => {
    if (viewerWrapperRef.current) {
      viewerWrapperRef.current.offsetWidth > 450 ? setIsViewportNarrow(false) : setIsViewportNarrow(true);
    }
  }, []);

  const dynamicMenuWrapClass = isViewportNarrow ? 'bm-menu-wrap--viewport-narrow' : '';
  const dynamicOverlayClass = isViewportNarrow ? 'bm-overlay--viewport-narrow' : '';

  const handlepageSwitch = (pageId) => {
    setHamburgerMenuOpen(false);
    const queryParams = {
      version: selectedVersionName,
      env: selectedEnvironmentName,
    };
    switchPage(pageId, pages.find((page) => page.id === pageId)?.handle, Object.entries(queryParams), moduleId);
  };
  var styles = {
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
      left: 0,
    },
    bmMenu: {
      background: darkMode ? '#202B37' : '#fff',
      padding: '16px 16px',
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
      overflow: 'hidden',
    },
    bmOverlay: {
      background: 'rgba(0, 0, 0, 0.3)',
      top: '0px',
    },
  };

  const currentPage = pages?.find((page) => page.id === currentPageId);
  const getPagesVisibility = useStore((state) => state.getPagesVisibility);

  const isLicensed =
    !_.get(license, 'featureAccess.licenseStatus.isExpired', true) &&
    _.get(license, 'featureAccess.licenseStatus.isLicenseValid', false);
  const homePageId = useStore((state) => state.appStore.modules[moduleId].app.homePageId);

  const { definition: { properties = {} } = {} } = useStore((state) => state.pageSettings) || {};
  const { name, hideLogo, hideHeader } = properties ?? {};

  return (
    <>
      <MobileMenu
        isOpen={hamburgerMenuOpen}
        styles={styles}
        pageWrapId={'page-wrap'}
        outerContainerId={'outer-container'}
        onStateChange={(state) => setHamburgerMenuOpen(state.isOpen)}
        className={dynamicMenuWrapClass}
        overlayClassName={dynamicOverlayClass}
        customBurgerIcon={
          <div className="icon-btn">
            <SolidIcon fill="var(--icon-strong)" name="menu" />
          </div>
        }
        right={false}
      >
        <div style={{ height: '95%' }} className="pt-0">
          <Header styles={{ paddingBottom: '24px' }} className={'mobile-header'}>
            <div onClick={() => setHamburgerMenuOpen(false)} className="cursor-pointer">
              <div className="icon-btn">
                <SolidIcon name="remove03" />
              </div>
            </div>
            <div className="d-flex flex-grow-1 justify-content-center">
              <h1 className="navbar-brand d-none-navbar-horizontal p-0">
                <Link
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  data-cy="viewer-page-logo"
                  onClick={() => {
                    redirectToDashboard();
                  }}
                >
                  {!hideLogo && <AppLogo isLoadingFromHeader={false} viewer={true} />}
                  {!hideHeader && (
                    <div className="d-flex align-items-center app-title">
                      <OverflowTooltip>{name?.trim() ? name : appName}</OverflowTooltip>
                    </div>
                  )}
                </Link>
              </h1>
            </div>
          </Header>

          <div style={{ paddingBottom: '56px' }} className="w-100 overflow-auto h-100">
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
                pages?.map((page) => {
                  const isHomePage = page.id === homePageId;
                  const iconName = isHomePage && !page.icon ? 'IconHome2' : page.icon;
                  // eslint-disable-next-line import/namespace
                  const IconElement = Icons?.[iconName] ?? Icons?.['IconFile'];
                  const pageVisibility = getPagesVisibility('canvas', page?.id);

                  return pageVisibility || page?.disabled ? null : (
                    <div
                      key={page.handle}
                      onClick={() => handlepageSwitch(page?.id)}
                      className={`viewer-page-handler cursor-pointer ${darkMode && 'dark'}`}
                    >
                      <div className={`card  ${page?.id === currentPageId ? 'active' : ''}`}>
                        <div className="card-body">
                          <IconElement style={{ width: '16px', height: '16px' }} />
                          <span>{_.truncate(page?.name, { length: 22 })}</span>
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
            <div className="d-flex justify-content-center">
              <div className={`d-flex align-items-center justify-content-center`}>
                <DarkModeToggle
                  switchDarkMode={changeToDarkMode}
                  darkMode={darkMode}
                  showText={false}
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
