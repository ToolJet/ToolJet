import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import _ from 'lodash';
import '@/_ui/FolderList/FolderList.scss';
import cx from 'classnames';
import { IconLayoutSidebarLeftCollapse, IconLayoutSidebarRightCollapse } from '@tabler/icons-react';
// eslint-disable-next-line import/no-unresolved
import useStore from '@/AppBuilder/_stores/store';
import AppLogo from '@/_components/AppLogo';
import { DarkModeToggle } from '@/_components';
import { RenderPageAndPageGroup } from './PageGroup';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { shallow } from 'zustand/shallow';
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
import PageMenuConfigHandle from './PageMenuConfigHandle';

export const PagesSidebarNavigation = ({
  isMobileDevice,
  currentPageId,
  darkMode,
  isSidebarPinned,
  setIsSidebarPinned,
  canvasMaxWidth,
  switchDarkMode,
  canvasContentRef,
}) => {
  const { moduleId } = useModuleContext();
  const { definition: { styles = {}, properties = {} } = {} } = useStore((state) => state.pageSettings) || {};
  const currentMode = useStore((state) => state.modeStore.modules[moduleId].currentMode);
  const homePageId = useStore((state) => state.appStore.modules[moduleId].app.homePageId);
  const appName = useStore((state) => state.appStore.modules[moduleId].app.appName);
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
  const switchToHomePage = useStore((state) => state.switchToHomePage);
  const switchPageWrapper = useStore((state) => state.switchPageWrapper);

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

  const { hideHeader, position, style, collapsable, name, hideLogo } = properties ?? {};

  const hasAppPagesAddNavGroupEnabled = useStore((state) => state.license?.featureAccess?.appPagesAddNavGroupEnabled);
  const hasAppPagesHeaderAndLogoEnabled = useStore(
    (state) => state.license?.featureAccess?.appPagesHeaderAndLogoEnabled
  );

  const labelStyle = useMemo(
    () => ({
      icon: {
        hidden: style === 'text',
      },
      label: {
        hidden: style === 'icon' || (style === 'texticon' && !isSidebarPinned && position != 'top'),
      },
    }),
    [style, isSidebarPinned, position]
  );

  const pagesTree = useMemo(
    () => (hasAppPagesAddNavGroupEnabled ? buildTree(pages, !!labelStyle?.label?.hidden) : pages),
    [hasAppPagesAddNavGroupEnabled, pages, labelStyle?.label?.hidden]
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
  }, [measureStaticElements, hideHeader, hideLogo, position, style, appMode]);

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
    const FLEX_GAP = 6; // flex gap between pages and page groups

    let currentFixedElementsWidth = measuredHeaderWidth + measuredDarkModeToggleWidth + 32 + 16; // 32 is for flex gap in 'navigation-area' and 16 is for padding inside 'page-handler-wrapper'

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
        spaceForMoreButton = 75; // fixed width for the more button
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
  }, [
    mainNavBarPages,
    position,
    measuredHeaderWidth,
    measuredDarkModeToggleWidth,
    canvasMaxWidth,
    style,
    isPagesSidebarHidden,
    isMobileDevice,
  ]);

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

  useEffect(() => {
    // Box shadow on the navigation menu only appears when the canvas is scrolled and not on the top
    if (position !== 'top') {
      const navbar = navRef.current;
      if (navbar) {
        navbar.classList.remove('navigation-area--shadow');
      }
      return;
    }

    const canvasContent = canvasContentRef?.current;
    if (!canvasContent) return;

    const applyShadow = () => {
      const navbar = navRef.current;
      if (!navbar) return;

      const shouldShowShadow = canvasContent.scrollTop > 0;
      navbar.classList.toggle('navigation-area--shadow', shouldShowShadow);
    };

    const handleScroll = () => {
      requestAnimationFrame(applyShadow);
    };

    applyShadow();

    canvasContent.addEventListener('scroll', handleScroll);

    return () => {
      canvasContent.removeEventListener('scroll', handleScroll);
    };
  }, [position]);

  useEffect(() => {
    // Keep sidebar pin state updated based on style of page menu and whether it is collapsable or not
    if (style === 'icon') setIsSidebarPinned(false);
    if (style === 'text' || (style === 'texticon' && !collapsable)) setIsSidebarPinned(true);
  }, [style, collapsable, setIsSidebarPinned]);

  if (isMobileDevice) {
    return null;
  }

  const computedStyles = {
    '--nav-item-label-color': !styles.textColor.isDefault ? styles.textColor.value : 'var(--text-placeholder, #6A727C)',
    '--nav-item-icon-color': !styles.iconColor.isDefault ? styles.iconColor.value : 'var(--cc-default-icon, #6A727C)',
    '--selected-nav-item-label-color': !styles.selectedTextColor.isDefault
      ? styles.selectedTextColor.value
      : 'var(--cc-primary-text, #1B1F24)',
    '--selected-nav-item-icon-color': !styles.selectedIconColor.isDefault
      ? styles.selectedIconColor.value
      : 'var(--cc-default-icon, #6A727C)',
    '--hovered-nav-item-pill-bg': !styles.pillHoverBackgroundColor.isDefault
      ? styles.pillHoverBackgroundColor.value
      : 'var(--cc-surface2-surface, #F6F8FA)',
    '--selected-nav-item-pill-bg': !styles.pillSelectedBackgroundColor.isDefault
      ? styles.pillSelectedBackgroundColor.value
      : 'var(--cc-appBackground-surface, #F6F6F6)',
    '--nav-item-pill-radius': `${styles.pillRadius.value}px`,
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

  const labelHidden = labelStyle?.label?.hidden;
  const headerHidden = hasAppPagesHeaderAndLogoEnabled ? hideHeader : false;
  const logoHidden = hasAppPagesHeaderAndLogoEnabled ? hideLogo : false;

  if (headerHidden && logoHidden && isPagesSidebarHidden) {
    return null;
  }

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
          <div onClick={() => switchToHomePage(currentPageId, moduleId)} className="cursor-pointer">
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
          isLicensed={hasAppPagesAddNavGroupEnabled}
          switchPageWrapper={switchPageWrapper}
          pages={pages}
          labelStyle={labelStyle}
          computedStyles={computedStyles}
          darkMode={darkMode}
          visibleLinks={links.visible}
          overflowLinks={links.overflow}
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

    if (
      ((isPagesSidebarHidden || position === 'top') && appMode !== 'auto') ||
      (position === 'side' && appMode !== 'auto' && (!collapsable || style !== 'texticon'))
    )
      return;

    return (
      <div ref={darkModeToggleRef} className="d-flex align-items-center page-dark-mode-btn-wrapper">
        {appMode === 'auto' && (
          <DarkModeToggle
            toggleForCanvas={true}
            toggleSize="large"
            switchDarkMode={switchDarkMode}
            darkMode={darkMode}
            tooltipPlacement={position === 'top' ? 'bottom' : 'right'}
            btnClassName="!tw-w-[36px] !tw-h-[36px]"
          />
        )}
        {!isPagesSidebarHidden && position === 'side' && collapsable && style === 'texticon' && (
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
  };

  const FooterWithToggle = () => {
    // The useSidebar hook must be used within a SidebarProvider
    const { toggleSidebar } = useSidebar();

    return <Footer toggleSidebar={toggleSidebar} />;
  };

  const Sidebar = () => {
    const searchParams = new URLSearchParams(location.search);
    const isPreviewMode = searchParams.has('env') || searchParams.has('version');
    return (
      <div
        ref={(el) => {
          navRef.current = el;
        }}
        className={cx('navigation-area', {
          'navigation-hover-trigger': currentMode === 'edit',
          close: !isSidebarPinned && collapsable && style !== 'text' && position === 'side',
          'position-top': position === 'top' || isPagesSidebarHidden,
          'icon-only':
            (style === 'icon' && position === 'side' && !isPagesSidebarHidden) ||
            (style === 'texticon' && !isSidebarPinned && position === 'side' && !isPagesSidebarHidden),
          'text-only': style === 'text',
          'no-preview-settings': !isPreviewMode,
          'not-collapsable': !isPagesSidebarHidden && position === 'side' && (style !== 'texticon' || !collapsable),
          'collapsable-only':
            !isPagesSidebarHidden && position === 'side' && collapsable && appMode !== 'auto' && style === 'texticon',
          'no-header': headerHidden && logoHidden,
        })}
        style={{
          position: 'sticky',
          height: currentMode === 'edit' ? '100%' : `calc(100% - 32px)`,
          top: '0px',
          bottom: '0px',
          background: !styles?.backgroundColor?.isDefault && styles?.backgroundColor?.value,
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
          maxWidth: (() => {
            if (moduleId === 'canvas' && position === 'top' && !isMobileDevice) {
              return canvasMaxWidth;
            }
          })(),
        }}
        onClick={handleSidebarClick}
      >
        {position === 'side' && !isPagesSidebarHidden ? (
          // Using shadcn sidebar component when the page menu is side aligned
          <>
            <SidebarHeader>
              <Header />
            </SidebarHeader>
            <SidebarContent className="page-menu-scroll">
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
        position: 'relative', // Add relative positioning to the parent
      }}
    >
      {/* Arbitrary element start - used for calculating width of page menu items */}
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
        }}
      >
        {mainNavBarPages.map((link) => (
          <div
            style={{
              padding: `0px ${link?.isPageGroup ? '30px' : '10px'} 0px ${style === 'texticon' ? '32px' : '10px'}`,
              fontWeight: 500,
            }}
            key={`measure-${link.id}`}
            data-id={link.id}
          >
            {link?.name}
          </div>
        ))}
      </button>
      {/* Arbitrary element end */}
      {/* Wrapper div to maintain hover state between navigation and tooltip */}
      <div
        className={`navigation-with-tooltip-wrapper ${shouldShowBlueBorder && 'active'}`}
        style={{ position: 'relative' }}
      >
        {/* Main sidebar content */}
        {position === 'side' && !isPagesSidebarHidden ? (
          // Using shadcn sidebar component when the page menu is side aligned
          <SidebarProvider
            open={isSidebarPinned}
            onOpenChange={setIsSidebarPinned}
            sidebarWidth="256px"
            sidebarWidthIcon="54px"
            className="!tw-min-h-0 tw-h-full"
          >
            <SidebarWrapper
              collapsible={style === 'text' || (style === 'texticon' && !collapsable) ? 'none' : 'icon'}
              className="group-data-[side=left]:!tw-border-r-0 tw-flex"
              wrapperClassName="tw-block"
            >
              <Sidebar />
            </SidebarWrapper>
          </SidebarProvider>
        ) : (
          <Sidebar />
        )}

        {/* Show tooltip on hover or when tab is active (only in edit mode, controlled by CSS) */}
        {currentMode === 'edit' && <PageMenuConfigHandle position={position} isSidebarPinned={isSidebarPinned} />}
      </div>
      {/* Close navigation-with-tooltip-wrapper */}
    </div>
  );
};

export default PagesSidebarNavigation;
