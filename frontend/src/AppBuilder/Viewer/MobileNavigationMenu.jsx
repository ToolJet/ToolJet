import React, { useEffect, useState } from 'react';
import _ from 'lodash';
// eslint-disable-next-line import/no-unresolved
import { slide as MobileMenu } from 'react-burger-menu';
import { DarkModeToggle } from '@/_components/DarkModeToggle';
import Header from './Header';
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
              <div className={`page-group-collapse`}>
                {isExpanded ? (
                  <Icons.IconChevronUp size={16} color="var(--icon-default, #ACB2B9)" />
                ) : (
                  <Icons.IconChevronDown size={16} color="var(--icon-default, #ACB2B9)" />
                )}
              </div>
            </div>
          </div>
        </div>
        {isExpanded && (
          <div style={{ paddingLeft: '32px' }}>
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
      width: '100%',
    },
    bmOverlay: {
      background: 'rgba(0, 0, 0, 0.3)',
      top: '0px',
    },
    bmBurgerButton: {
      position: 'relative',
      borderRadius: '8px',
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
        <Header className={'mobile-header'}>
          <div onClick={() => setHamburgerMenuOpen(false)} className="cursor-pointer">
            <div className="icon-btn">
              <Icons.IconX size={16} />
            </div>
          </div>
          <div className="w-100 tw-min-w-0 tw-shrink tw-px-[7px]">
            <Link
              data-cy="viewer-page-logo"
              onClick={() => {
                redirectToDashboard();
              }}
            >
              <h1 className="navbar-brand d-flex align-items-center justify-content-center tw-gap-[12px] p-0">
                {!hideLogo && <AppLogo height={32} isLoadingFromHeader={false} viewer={true} />}
                {!hideHeader && (
                  <OverflowTooltip childrenClassName="app-title">{name?.trim() ? name : appName}</OverflowTooltip>
                )}
              </h1>
            </Link>
          </div>
        </Header>

        <div className="h-100 tw-p-[8px] tw-overflow-y-auto">
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

        {showDarkModeToggle && (
          <div className="page-dark-mode-btn-wrapper">
            <DarkModeToggle
              switchDarkMode={changeToDarkMode}
              darkMode={darkMode}
              showText={false}
              tooltipPlacement={'top'}
            />
          </div>
        )}
      </MobileMenu>
    </>
  );
};

export default MobileNavigationMenu;
