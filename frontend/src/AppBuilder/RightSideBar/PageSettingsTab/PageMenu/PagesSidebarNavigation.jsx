import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import _ from 'lodash';
import cx from 'classnames';
import { IconLayoutSidebarLeftCollapse, IconLayoutSidebarRightCollapse, IconDotsVertical } from '@tabler/icons-react';
// eslint-disable-next-line import/no-unresolved
import useStore from '@/AppBuilder/_stores/store';
import { LEFT_SIDEBAR_WIDTH, RIGHT_SIDEBAR_WIDTH } from '../../../AppCanvas/appCanvasConstants';
import AppLogo from '@/_components/AppLogo';
import { DarkModeToggle } from '@/_components';
import { RenderPage, RenderPageAndPageGroup } from './PageGroup';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import toast from 'react-hot-toast';
import { shallow } from 'zustand/shallow';
import { Overlay, Popover } from 'react-bootstrap';
import { buildTree } from './Tree/utilities';
import { RIGHT_SIDE_BAR_TAB } from '../../rightSidebarConstants';
import { Button as ButtonComponent } from '@/components/ui/Button/Button';
import {
  Sidebar as SidebarWrapper,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  useSidebar,
} from '@/components/ui/sidebar';

export const PagesSidebarNavigation = ({
  isMobileDevice,
  currentPageId,
  switchPage,
  darkMode,
  isSidebarPinned,
  setIsSidebarPinned,
  canvasMaxWidth,
  switchDarkMode,
}) => {
  const { moduleId } = useModuleContext();
  const { definition: { styles = {}, properties = {} } = {} } = useStore((state) => state.pageSettings) || {};
  const selectedVersionName = useStore((state) => state.selectedVersion?.name);
  const currentMode = useStore((state) => state.modeStore.modules[moduleId].currentMode);
  const selectedEnvironmentName = useStore((state) => state.selectedEnvironment?.name);
  const homePageId = useStore((state) => state.appStore.modules[moduleId].app.homePageId);
  const setCurrentPageHandle = useStore((state) => state.setCurrentPageHandle);
  const appName = useStore((state) => state.appStore.modules[moduleId].app.appName);
  const isSidebarOpen = useStore((state) => state.isSidebarOpen);
  const selectedSidebarItem = useStore((state) => state.selectedSidebarItem);
  const isRightSidebarOpen = useStore((state) => state.isRightSidebarOpen, shallow);
  const setRightSidebarOpen = useStore((state) => state.setRightSidebarOpen);
  const activeRightSideBarTab = useStore((state) => state.activeRightSideBarTab);
  const setActiveRightSideBarTab = useStore((state) => state.setActiveRightSideBarTab);
  const pages = useStore((state) => state.modules.canvas.pages, shallow);
  const pagesVisibilityState = useStore((state) => state.resolvedStore.modules[moduleId]?.others?.pages || {}, shallow);
  const isPagesSidebarHidden = useStore((state) => state.getPagesSidebarVisibility(moduleId), shallow);
  const { isReleasedVersionId } = useStore(
    (state) => ({
      isReleasedVersionId: state?.releasedVersionId == state.currentVersionId || state.isVersionReleased,
    }),
    shallow
  );
  const { appMode } = useStore((state) => state.globalSettings, shallow);

  const navRef = useRef(null);
  const headerRef = useRef(null);
  const darkModeToggleRef = useRef(null);

  const measurementContainerRef = useRef(null);

  const [links, setLinks] = useState({
    visible: pages,
    overflow: [],
  });
  const [measuredHeaderWidth, setMeasuredHeaderWidth] = useState(0);
  const [measuredDarkModeToggleWidth, setMeasuredDarkModeToggleWidth] = useState(0);

  const navigationRef = useRef(null);

  const { hideHeader, position, style, collapsable, name, hideLogo } = properties ?? {};

  const license = useStore((state) => state.license);
  const isLicensed =
    !_.get(license, 'featureAccess.licenseStatus.isExpired', true) &&
    _.get(license, 'featureAccess.licenseStatus.isLicenseValid', false);

  const labelStyle = useMemo(
    () => ({
      icon: {
        hidden: style === 'text',
      },
      label: {
        hidden: style === 'icon' || (style === 'texticon' && collapsable && !isSidebarPinned && position != 'top'),
      },
    }),
    [style, collapsable, isSidebarPinned, position]
  );

  const pagesTree = useMemo(
    () => (isLicensed ? buildTree(pages, !!labelStyle?.label?.hidden) : pages),
    [isLicensed, pages, labelStyle?.label?.hidden]
  );

  const mainNavBarPages = useMemo(() => {
    return pagesTree.filter((page) => {
      const pageVisibility = pagesVisibilityState[page?.id]?.hidden ?? false;
      return (
        (!page?.restricted || currentMode !== 'view') &&
        !pageVisibility &&
        !page?.disabled &&
        (!page?.isPageGroup ||
          (page.children?.length > 0 &&
            page.children.some((child) => !child?.disabled) &&
            page.children.some((child) => {
              const pageVisibility = pagesVisibilityState[child?.id]?.hidden ?? false;
              return pageVisibility === false;
            })))
      );
    });
  }, [pagesTree, pagesVisibilityState, currentMode]);

  const measureStaticElements = useCallback(() => {
    if (headerRef.current) {
      const headerWidth = headerRef.current.offsetWidth;
      setMeasuredHeaderWidth(headerWidth);
    } else {
      setMeasuredHeaderWidth(0);
    }

    if (darkModeToggleRef.current) {
      const darkModeToggleWidth = darkModeToggleRef.current.offsetWidth;
      setMeasuredDarkModeToggleWidth(darkModeToggleWidth);
    } else {
      setMeasuredDarkModeToggleWidth(0);
    }
  }, []);

  useEffect(() => {
    let headerObserver;
    if (headerRef.current) {
      headerObserver = new ResizeObserver((_entries) => {
        measureStaticElements();
      });
      headerObserver.observe(headerRef.current);
    }

    let darkModeToggleObserver;
    if (darkModeToggleRef.current) {
      darkModeToggleObserver = new ResizeObserver((_entries) => {
        measureStaticElements();
      });
      darkModeToggleObserver.observe(darkModeToggleRef.current);
    }

    let measurementContainerObserver;
    if (measurementContainerRef.current) {
      measurementContainerObserver = new ResizeObserver((_entries) => {
        measureStaticElements();
      });
      measurementContainerObserver.observe(measurementContainerRef.current);
    }

    measureStaticElements();

    return () => {
      if (headerObserver) headerObserver.disconnect();
      if (darkModeToggleObserver) darkModeToggleObserver.disconnect();
      if (measurementContainerObserver) measurementContainerObserver.disconnect();
    };
  }, [measureStaticElements, hideHeader, hideLogo, style]);

  const calculateOverflow = useCallback(() => {
    if (!navRef.current || mainNavBarPages.length === 0) {
      setLinks({
        visible: [],
        overflow: [],
      });
      return;
    }

    if (position !== 'top') {
      setLinks({
        visible: mainNavBarPages,
        overflow: [],
      });
      return;
    }

    const effectiveContainerWidth = navRef.current.offsetWidth;

    let currentVisibleWidth = 0;
    const finalVisible = [];
    const finalOverflow = [];

    const measuredNavItems = Array.from(measurementContainerRef.current.children);
    const FLEX_GAP = 6;

    let currentFixedElementsWidth = measuredHeaderWidth + measuredDarkModeToggleWidth + 32 + 16;

    for (let i = 0; i < mainNavBarPages.length; i++) {
      const link = mainNavBarPages[i];
      const correspondingMeasuredElement = measuredNavItems.find((item) => item.dataset.id === String(link.id));

      if (!correspondingMeasuredElement) {
        console.warn(`Measurement element for page ID ${link.id} not found.`);
        continue;
      }

      const itemWidth = correspondingMeasuredElement.offsetWidth;
      const widthNeededForItem = itemWidth + (finalVisible.length > 0 ? FLEX_GAP : 0);

      const itemsRemainingForOverflow = mainNavBarPages.length - (i + 1);
      const isMoreButtonNeededSoon = itemsRemainingForOverflow > 0 || finalOverflow.length > 0;

      let spaceForMoreButton = 0;
      if (isMoreButtonNeededSoon) {
        spaceForMoreButton = 75;
        if (finalVisible.length > 0 || currentFixedElementsWidth > 0) {
          spaceForMoreButton += FLEX_GAP;
        }
      }

      if (
        currentFixedElementsWidth + currentVisibleWidth + widthNeededForItem + spaceForMoreButton <=
        effectiveContainerWidth
      ) {
        finalVisible.push(link);
        currentVisibleWidth += widthNeededForItem;
      } else {
        finalOverflow.push(link);
      }
    }

    let totalWidthWithMoreButton = currentFixedElementsWidth + currentVisibleWidth;
    if (finalOverflow.length > 0) {
      totalWidthWithMoreButton += 75;
      if (finalVisible.length > 0 || currentFixedElementsWidth > 0) {
        totalWidthWithMoreButton += FLEX_GAP;
      }
    }
    while (finalOverflow.length > 0 && totalWidthWithMoreButton > effectiveContainerWidth && finalVisible.length > 0) {
      const lastVisible = finalVisible.pop();
      const lastVisibleElement = measuredNavItems.find((item) => item.dataset.id === String(lastVisible.id));
      if (lastVisibleElement) {
        currentVisibleWidth -= lastVisibleElement.offsetWidth + (finalVisible.length > 0 ? FLEX_GAP : 0);
      }
      finalOverflow.unshift(lastVisible);

      totalWidthWithMoreButton = currentFixedElementsWidth + currentVisibleWidth;
      if (finalOverflow.length > 0) {
        totalWidthWithMoreButton += 75;
        if (finalVisible.length > 0 || currentFixedElementsWidth > 0) {
          totalWidthWithMoreButton += FLEX_GAP;
        }
      }
    }

    setLinks({
      visible: finalVisible,
      overflow: finalOverflow,
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainNavBarPages, position, measuredHeaderWidth, measuredDarkModeToggleWidth, canvasMaxWidth, style]);

  useLayoutEffect(() => {
    const handleResize = () => {
      requestAnimationFrame(() => {
        calculateOverflow();
      });
    };

    handleResize();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [calculateOverflow]);

  if (isMobileDevice) {
    return null;
  }

  const computeStyles = (isSelected, isHovered) => {
    const baseStyles = {
      pill: {
        borderRadius: `${styles.pillRadius.value}px`,
      },
      icon: {
        color: !styles.iconColor.isDefault && styles.iconColor.value,
        fill: !styles.iconColor.isDefault && styles.iconColor.value,
      },
    };

    switch (true) {
      case isSelected: {
        return {
          ...baseStyles,
          text: {
            color: !styles.selectedTextColor.isDefault && styles.selectedTextColor.value,
          },
          icon: {
            stroke: !styles.selectedIconColor.isDefault && styles.selectedIconColor.value,
            color: !styles.selectedIconColor.isDefault && styles.selectedIconColor.value,
            fill: !styles.selectedIconColor.isDefault && styles.selectedIconColor.value,
          },
          pill: {
            background: !styles.pillSelectedBackgroundColor.isDefault && styles.pillSelectedBackgroundColor.value,
            ...baseStyles.pill,
          },
        };
      }
      case isHovered: {
        return {
          ...baseStyles,
          pill: {
            background: !styles.pillHoverBackgroundColor.isDefault && styles.pillHoverBackgroundColor.value,
            ...baseStyles.pill,
          },
        };
      }
      default: {
        return {
          text: {
            color: !styles.textColor.isDefault && styles.textColor.value,
          },
          icon: {
            color: !styles.iconColor.isDefault && styles.iconColor.value,
            fill: !styles.iconColor.isDefault && styles.iconColor.value,
          },
        };
      }
    }
  };

  const getAbsoluteUrl = (url) => {
    if (!url) return '';

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  const switchPageWrapper = (page) => {
    if (page?.type === 'url') {
      if (page?.url) {
        const finalUrl = getAbsoluteUrl(page.url);
        if (finalUrl) {
          if (page.openIn === 'new_tab') {
            window.open(finalUrl, '_blank');
          } else {
            window.location.href = finalUrl;
          }
        }
      } else {
        toast.error('No URL provied');
        return;
      }
      return;
    }

    if (page?.type === 'app') {
      if (page?.appId) {
        const baseUrl = `${window.public_config?.TOOLJET_HOST}/applications/${page.appId}`;
        if (page.openIn === 'new_tab') {
          window.open(baseUrl, '_blank');
        } else {
          window.location.href = baseUrl;
        }
      } else {
        toast.error('No app selected');
        return;
      }
      return;
    }

    if (currentPageId === page?.id) {
      return;
    }
    const queryParams = {
      version: selectedVersionName,
      env: selectedEnvironmentName,
    };
    switchPage(
      page?.id,
      pages.find((p) => page.id === p?.id)?.handle,
      currentMode === 'view' ? Object.entries(queryParams) : []
    );
    currentMode !== 'view' && setCurrentPageHandle(page.handle);
  };

  const switchToHomePage = () => {
    if (currentPageId === homePageId) return;

    const page = pages.find((p) => p.id === homePageId);

    const queryParams = {
      version: selectedVersionName,
      env: selectedEnvironmentName,
    };

    switchPage(
      page?.id,
      pages.find((p) => page.id === p?.id)?.handle,
      currentMode === 'view' ? Object.entries(queryParams) : []
    );
  };

  const handleSidebarClick = (e) => {
    // Only handle sidebar clicks in edit mode, as there's no right sidebar in view mode
    if (currentMode !== 'edit') return;

    // Check if click is on the navigation area but not on navigation items
    const clickedElement = e.target;
    const isNavigationItem = clickedElement.closest(
      '.tj-list-item, .page-name, .more-pages-btn, .app-name, .page-dark-mode-btn-wrapper'
    );

    if (!isNavigationItem) {
      setActiveRightSideBarTab(RIGHT_SIDE_BAR_TAB.PAGES);
      if (!isRightSidebarOpen) {
        setRightSidebarOpen(true);
      }
    }
  };

  const shouldShowBlueBorder = currentMode === 'edit' && activeRightSideBarTab === RIGHT_SIDE_BAR_TAB.PAGES;

  const isTopPositioned = position === 'top';
  const labelHidden = labelStyle?.label?.hidden;
  const headerHidden = isLicensed ? hideHeader : false;
  const logoHidden = isLicensed ? hideLogo : false;

  if (headerHidden && logoHidden && isPagesSidebarHidden) {
    return null;
  }

  const rightSidebarWidth = isRightSidebarOpen ? RIGHT_SIDEBAR_WIDTH : 0;
  const leftSidebarWidth = isSidebarOpen ? LEFT_SIDEBAR_WIDTH[selectedSidebarItem] ?? LEFT_SIDEBAR_WIDTH.default : 0;

  const Header = () => {
    if (headerHidden && logoHidden) {
      return null;
    }

    return (
      <div
        ref={headerRef}
        style={{
          marginRight: headerHidden && logoHidden && position == 'top' && '0px',
        }}
        className="app-name"
      >
        {!logoHidden && (
          <div onClick={switchToHomePage} className="cursor-pointer flex-shrink-0">
            <AppLogo height={32} isLoadingFromHeader={false} />
          </div>
        )}
        {!headerHidden && (!labelHidden || isPagesSidebarHidden) && (
          <div className="app-text" style={{ wordWrap: 'break-word', overflow: 'hidden' }}>
            {name?.trim() ? name : appName}
          </div>
        )}
      </div>
    );
  };

  const Body = () => {
    return (
      !isPagesSidebarHidden && (
        <RenderPageAndPageGroup
          isLicensed={isLicensed}
          switchPageWrapper={switchPageWrapper}
          pages={pages}
          labelStyle={labelStyle}
          computeStyles={computeStyles}
          darkMode={darkMode}
          switchPage={switchPage}
          visibleLinks={links.visible}
          overflowLinks={links.overflow}
          navRef={navRef}
          position={position}
          isSidebarPinned={isSidebarPinned}
          currentMode={currentMode}
          currentPageId={currentPageId}
          homePageId={homePageId}
        />
      )
    );
  };

  const Footer = ({ toggleSidebar }) => {
    const handleToggle = () => {
      if (position === 'side' && toggleSidebar && typeof toggleSidebar === 'function') {
        toggleSidebar();
      } else return;
    };

    if (appMode === 'auto') {
      return (
        <div ref={darkModeToggleRef} className="d-flex align-items-center page-dark-mode-btn-wrapper">
          <DarkModeToggle
            toggleForCanvas={true}
            toggleSize="large"
            switchDarkMode={switchDarkMode}
            darkMode={darkMode}
            tooltipPlacement={position === 'top' ? 'bottom' : 'right'}
            btnClassName="!tw-w-[36px] !tw-h-[36px]"
          />
          {collapsable && !isTopPositioned && position === 'side' && style !== 'text' && !isPagesSidebarHidden && (
            <ButtonComponent
              className="left-sidebar-item !tw-w-[36px] !tw-h-[36px]"
              onClick={handleToggle}
              variant="ghost"
              size="large"
              iconOnly
            >
              {isSidebarPinned ? (
                <IconLayoutSidebarLeftCollapse size={16} className="tw-text-icon-strong" />
              ) : (
                <IconLayoutSidebarRightCollapse size={16} className="tw-text-icon-strong" />
              )}
            </ButtonComponent>
          )}
        </div>
      );
    }
    return null;
  };

  const FooterWithToggle = () => {
    // The useSidebar hook must be used within a SidebarProvider
    const { toggleSidebar } = useSidebar();

    return <Footer toggleSidebar={toggleSidebar} />;
  };

  const Sidebar = () => {
    return (
      <div
        ref={(el) => {
          navRef.current = el;
          navigationRef.current = el;
        }}
        className={cx('navigation-area', {
          'navigation-hover-trigger': currentMode === 'edit',
          close: !isSidebarPinned && properties?.collapsable && style !== 'text' && position === 'side',
          'icon-only':
            (style === 'icon' && position === 'side' && !isPagesSidebarHidden) ||
            (style === 'texticon' &&
              (collapsable ? !isSidebarPinned : false) &&
              position === 'side' &&
              !isPagesSidebarHidden),
          'position-top': position === 'top' || isPagesSidebarHidden,
          'text-only': style === 'text',
          'no-preview-settings': isReleasedVersionId,
          'not-collapsable': !collapsable,
          'no-header': headerHidden && logoHidden,
        })}
        style={{
          position: 'sticky',
          height: currentMode === 'edit' ? `calc(100% - 2px)` : `calc(100% - 32px)`,
          top: '0px',
          bottom: '0px',
          background: !styles?.backgroundColor?.isDefault && styles?.backgroundColor?.value,
          border: `${styles?.pillRadius?.value}px`,
          borderRight: (() => {
            if (position !== 'side' || shouldShowBlueBorder) return 'none';
            if (styles?.borderColor?.isDefault) {
              return '1px solid var(--cc-weak-border, #E4E7EB)';
            }
            return `1px solid ${styles?.borderColor?.value}`;
          })(),
          borderBottom: (() => {
            if (position !== 'top' || shouldShowBlueBorder) return 'none';
            if (styles?.borderColor?.isDefault) {
              return '1px solid var(--cc-weak-border, #E4E7EB)';
            }
            return `1px solid ${styles?.borderColor?.value}`;
          })(),
          boxShadow: shouldShowBlueBorder ? '0 0 0 1px #3E63DD' : 'var(--elevation-100-box-shadow)',
          maxWidth: (() => {
            if (moduleId === 'canvas' && position === 'top' && !isMobileDevice) {
              return canvasMaxWidth;
            }
          })(),
        }}
        onClick={handleSidebarClick}
      >
        {position === 'side' ? (
          // Using shadcn sidebar component when the page menu is side aligned
          <>
            <SidebarHeader>
              <Header />
            </SidebarHeader>
            <SidebarContent>
              <Body />
            </SidebarContent>
            <SidebarFooter>
              <FooterWithToggle />
            </SidebarFooter>
          </>
        ) : (
          <>
            <Header />
            <Body />
            <Footer />
          </>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        ...(position === 'top' && {
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
        }),
        ...(currentMode !== 'view' &&
          (position === 'top' || isPagesSidebarHidden) && {
            width: `calc(100% + ${leftSidebarWidth + rightSidebarWidth}px)`,
          }),
        position: 'relative', // Add relative positioning to the parent
      }}
    >
      <button
        ref={measurementContainerRef}
        style={{
          position: 'absolute',
          top: '-9999px',
          left: '-9999px',
          visibility: 'hidden',
          whiteSpace: 'nowrap',
          display: 'flex',
          padding: '0px',
          fontSize: '14px',
          flexGrow: 1,
        }}
      >
        {mainNavBarPages.map((link) => (
          <div
            style={{
              padding: `0px 10px 0px ${style === 'texticon' ? '32px' : '10px'}`,
              ...(link?.isPageGroup && { paddingRight: '30px' }),
              fontWeight: 500,
            }}
            key={`measure-${link.id}`}
            data-id={link.id}
          >
            {link?.name}
          </div>
        ))}
      </button>
      {/* Wrapper div to maintain hover state between navigation and tooltip */}
      <div className="navigation-with-tooltip-wrapper" style={{ position: 'relative' }}>
        {/* Main sidebar content */}
        {position === 'side' ? (
          // Using shadcn sidebar component when the page menu is side aligned
          <SidebarProvider
            open={isSidebarPinned}
            onOpenChange={setIsSidebarPinned}
            sidebarWidth="256px"
            sidebarWidthIcon="54px"
          >
            <SidebarWrapper>
              <Sidebar />
            </SidebarWrapper>
          </SidebarProvider>
        ) : (
          <Sidebar />
        )}

        {/* Show tooltip when tab is active */}
        {currentMode === 'edit' && activeRightSideBarTab === RIGHT_SIDE_BAR_TAB.PAGES && (
          <div
            className="navigation-tooltip"
            style={{
              position: 'absolute',
              top: position === 'top' ? 'calc(100% + 0px)' : '7px',
              left: position === 'top' ? '0px' : isSidebarPinned ? '6px' : '43px',
              zIndex: 1000,
              pointerEvents: 'auto', // Enable pointer events so tooltip can be hovered
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#4368E3',
              padding: '2px 6px',
              borderRadius: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            <div
              className="cursor-pointer"
              onClick={() => {
                setActiveRightSideBarTab(RIGHT_SIDE_BAR_TAB.PAGES);
                setRightSidebarOpen(true);
              }}
            >
              <SolidIcon name="propertiesstyles" width="12" fill="#f6f8fa" />
            </div>
            <div
              style={{
                color: '#f6f8fa',
                fontSize: '11px',
                fontWeight: '500',
              }}
            >
              Page and nav
            </div>
          </div>
        )}

        {/* Show tooltip on hover (only in edit mode, controlled by CSS) */}
        {currentMode === 'edit' && (
          <div
            className="navigation-tooltip-hover"
            style={{
              position: 'absolute',
              top: position === 'top' ? 'calc(100% + 0px)' : '7px',
              left: position === 'top' ? '0px' : isSidebarPinned ? '6px' : '43px',
              zIndex: 1000,
              pointerEvents: 'auto', // Enable pointer events so tooltip can be hovered
              display: 'none',
              alignItems: 'center',
              gap: '6px',
              background: '#4368E3',
              padding: '2px 6px',
              borderRadius: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            <div
              className="cursor-pointer"
              onClick={() => {
                setActiveRightSideBarTab(RIGHT_SIDE_BAR_TAB.PAGES);
                setRightSidebarOpen(true);
              }}
            >
              <SolidIcon name="propertiesstyles" width="12" fill="#f6f8fa" />
            </div>
            <div
              style={{
                color: '#f6f8fa',
                fontSize: '11px',
                fontWeight: '500',
              }}
            >
              Page and nav
            </div>
          </div>
        )}
      </div>{' '}
      {/* Close navigation-with-tooltip-wrapper */}
    </div>
  );
};

export default PagesSidebarNavigation;
