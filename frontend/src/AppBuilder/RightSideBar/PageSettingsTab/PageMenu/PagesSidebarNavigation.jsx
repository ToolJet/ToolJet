import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import _, { set } from 'lodash';
import cx from 'classnames';
import * as Icons from '@tabler/icons-react';
// eslint-disable-next-line import/no-unresolved
import FolderList from '@/_ui/FolderList/FolderList';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import useStore from '@/AppBuilder/_stores/store';
import { APP_HEADER_HEIGHT } from '../../../AppCanvas/appCanvasConstants';
import OverflowTooltip from '@/_components/OverflowTooltip';
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
// import useSidebarMargin from './useSidebarMargin';

export const PagesSidebarNavigation = ({
  isMobileDevice,
  currentPageId,
  switchPage,
  darkMode,
  showHeader,
  isSidebarPinned,
  toggleSidebarPinned,
  height,
  canvasMaxWidth,
  switchDarkMode,
}) => {
  const { moduleId } = useModuleContext();
  const { definition: { styles = {}, properties = {} } = {} } = useStore((state) => state.pageSettings) || {};
  const selectedVersionName = useStore((state) => state.selectedVersion?.name);
  const currentMode = useStore((state) => state.modeStore.modules[moduleId].currentMode);
  const selectedEnvironmentName = useStore((state) => state.selectedEnvironment?.name);
  const homePageId = useStore((state) => state.appStore.modules[moduleId].app.homePageId);
  const license = useStore((state) => state.license);
  const setCurrentPageHandle = useStore((state) => state.setCurrentPageHandle);
  const appName = useStore((state) => state.appStore.modules[moduleId].app.appName);
  const isSidebarOpen = useStore((state) => state.isSidebarOpen);
  const isRightSidebarOpen = useStore((state) => state.isRightSidebarOpen, shallow);
  const setRightSidebarOpen = useStore((state) => state.setRightSidebarOpen);
  const activeRightSideBarTab = useStore((state) => state.activeRightSideBarTab);
  const setActiveRightSideBarTab = useStore((state) => state.setActiveRightSideBarTab);
  const pages = useStore((state) => state.modules.canvas.pages, shallow);
  const isPagesSidebarVisible = useStore((state) => state.getPagesSidebarVisibility(moduleId), shallow);
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
  const moreRef = useRef(null);
  const linkRefs = useRef({});
  const observer = useRef(null);
  const headerRef = useRef(null);
  const darkModeToggleRef = useRef(null);

  const measurementContainerRef = useRef(null);

  const [overflowLinks, setOverflowLinks] = useState([]);
  const [visibleLinks, setVisibleLinks] = useState(pages);
  const [showPopover, setShowPopover] = useState(false);
  const [measuredHeaderWidth, setMeasuredHeaderWidth] = useState(0);
  const [measuredDarkModeToggleWidth, setMeasuredDarkModeToggleWidth] = useState(0);
  const [measuredMoreButtonWidth, setMeasuredMoreButtonWidth] = useState(0);

  const navigationRef = useRef(null);

  const { disableMenu, hideHeader, position, style, collapsable, name, hideLogo } = properties ?? {};

  const isLicensed =
    !_.get(license, 'featureAccess.licenseStatus.isExpired', true) &&
    _.get(license, 'featureAccess.licenseStatus.isLicenseValid', false);

  const labelStyle = useMemo(
    () => ({
      icon: {
        hidden: properties?.style === 'text',
      },
      label: {
        hidden:
          properties?.style === 'icon' ||
          (style === 'texticon' && collapsable && !isSidebarPinned && properties?.position != 'top'),
      },
    }),
    [properties?.style, style, collapsable, isSidebarPinned, properties?.position]
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
      const headerStyle = window.getComputedStyle(headerRef.current);
      const headerMarginLeft = parseFloat(headerStyle.marginLeft) || 0;
      const headerMarginRight = parseFloat(headerStyle.marginRight) || 0;
      const totalHeaderWidth = headerRef.current.offsetWidth + headerMarginLeft + headerMarginRight;
      setMeasuredHeaderWidth(totalHeaderWidth);
    } else {
      setMeasuredHeaderWidth(0);
    }

    if (darkModeToggleRef.current) {
      const darkModeToggleStyle = window.getComputedStyle(darkModeToggleRef.current);
      const darkModeToggleMarginLeft = parseFloat(darkModeToggleStyle.marginLeft) || 0;
      const darkModeToggleMarginRight = parseFloat(darkModeToggleStyle.marginRight) || 0;
      const totalDarkModeToggleWidth =
        darkModeToggleRef.current.offsetWidth + darkModeToggleMarginLeft + darkModeToggleMarginRight;
      setMeasuredDarkModeToggleWidth(totalDarkModeToggleWidth);
    } else {
      setMeasuredDarkModeToggleWidth(0);
    }

    if (measurementContainerRef.current) {
      const measuredMoreButtonElement = Array.from(measurementContainerRef.current.children).find(
        (item) => item.dataset.id === 'more-button-measurement'
      );
      const MORE_BUTTON_WIDTH = measuredMoreButtonElement ? measuredMoreButtonElement.offsetWidth : 74;
      setMeasuredMoreButtonWidth(MORE_BUTTON_WIDTH);
    } else {
      setMeasuredMoreButtonWidth(74);
    }
  }, [hideHeader, hideLogo, collapsable, isSidebarPinned, position, style]);

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
  }, [measureStaticElements, hideHeader, hideLogo, collapsable, isSidebarPinned, position, style]);

  const calculateOverflow = useCallback(() => {
    if (!navRef.current || mainNavBarPages.length === 0) {
      setVisibleLinks([]);
      setOverflowLinks([]);
      return;
    }

    if (position !== 'top') {
      setVisibleLinks(mainNavBarPages);
      setOverflowLinks([]);
      return;
    }

    const containerWidth = navRef.current.offsetWidth;
    const effectiveContainerWidth = containerWidth - 32;

    let currentVisibleWidth = 0;
    const finalVisible = [];
    const finalOverflow = [];

    const measuredNavItems = Array.from(measurementContainerRef.current.children);
    const FLEX_GAP = 8;

    let currentFixedElementsWidth = measuredHeaderWidth + measuredDarkModeToggleWidth;

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
        spaceForMoreButton = measuredMoreButtonWidth;
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
      totalWidthWithMoreButton += measuredMoreButtonWidth;
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
        totalWidthWithMoreButton += measuredMoreButtonWidth;
        if (finalVisible.length > 0 || currentFixedElementsWidth > 0) {
          totalWidthWithMoreButton += FLEX_GAP;
        }
      }
    }

    setVisibleLinks(finalVisible);
    setOverflowLinks(finalOverflow);
  }, [
    mainNavBarPages,
    position,
    measuredHeaderWidth,
    measuredDarkModeToggleWidth,
    measuredMoreButtonWidth,
    canvasMaxWidth,
    isPagesSidebarHidden,
    style,
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
      '.tj-list-item, .page-name, .more-btn-pages, .app-name, .page-dark-mode-btn-wrapper'
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
  const headerHidden = isLicensed ? hideHeader : true;
  const logoHidden = isLicensed ? hideLogo : true;

  if (headerHidden && logoHidden && isPagesSidebarHidden) {
    return null;
  }

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
      className={cx({
        'right-sidebar-open':
          isRightSidebarOpen && currentMode !== 'view' && (position === 'top' || isPagesSidebarHidden),
        'left-sidebar-open': isSidebarOpen && currentMode !== 'view' && (position === 'top' || isPagesSidebarHidden),
      })}
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
          padding: '0px 16px',
          fontSize: '14px',
          flexGrow: 1,
        }}
        className="tj-list-item page-name"
      >
        {mainNavBarPages.map((link) => (
          <div
            style={{
              padding: `0px ${style === 'texticon' ? '21px' : '10px'}`,
              ...(link?.isPageGroup && { paddingRight: style === 'texticon' ? '39px' : '28px' }),
              fontWeight:
                currentPageId === link?.id || link?.children?.some((child) => currentPageId === child.id) ? 500 : 400,
            }}
            key={`measure-${link.id}`}
            data-id={link.id}
          >
            {link?.name}
          </div>
        ))}
        <button
          data-id="more-button-measurement"
          key="measure-more-button"
          onClick={() => setShowPopover(!showPopover)}
          className={`tj-list-item page-name more-btn-pages width-unset ${showPopover && 'tj-list-item-selected'}`}
          style={{ cursor: 'pointer', fontSize: '14px', marginLeft: '0px' }}
        >
          <SolidIcon fill={'var(--icon-weak)'} viewBox="0 3 21 18" width="16px" name="morevertical" />

          <div style={{ marginLeft: '6px' }}>More</div>
        </button>
      </button>
      {/* Wrapper div to maintain hover state between navigation and tooltip */}
      <div className="navigation-with-tooltip-wrapper" style={{ position: 'relative' }}>
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
            // 'right-sidebar-open': isRightSidebarOpen && (position === 'top' || !isPagesSidebarVisible),
            // 'left-sidebar-open': isSidebarOpen && (position === 'top' || !isPagesSidebarVisible),
            'no-preview-settings': isReleasedVersionId,
          })}
          style={{
            width: 226,
            position: 'sticky',
            height: currentMode === 'edit' ? `calc(100% - 2px)` : `calc(100% - 32px)`,
            top: '0px',
            bottom: '0px',
            background: !styles?.backgroundColor?.isDefault && styles?.backgroundColor?.value,
            border: `${styles?.pillRadius?.value}px`,
            borderRight:
              !styles?.borderColor?.isDefault && position === 'side' && !shouldShowBlueBorder
                ? `1px solid ${styles?.borderColor?.value}`
                : '',
            borderBottom:
              !styles?.borderColor?.isDefault && position === 'top' && !shouldShowBlueBorder
                ? `1px solid ${styles?.borderColor?.value}`
                : '',
            overflow: 'scroll',
            boxShadow: shouldShowBlueBorder ? '0 0 0 1px #3E63DD' : 'var(--elevation-100-box-shadow)',
            maxWidth: (() => {
              if (moduleId === 'canvas' && position === 'top' && !isMobileDevice) {
                return canvasMaxWidth;
              }
            })(),
          }}
          onClick={handleSidebarClick}
        >
          <div style={{ overflow: 'hidden', flexGrow: '1' }} className="position-relative">
            {(collapsable || !headerHidden || !logoHidden) && (
              <div
                ref={headerRef}
                style={{
                  marginRight: headerHidden && logoHidden && position == 'top' && '0px',
                }}
                className="app-name"
              >
                {!logoHidden && (
                  <div onClick={switchToHomePage} className="cursor-pointer flex-shrink-0">
                    <AppLogo isLoadingFromHeader={false} />
                  </div>
                )}
                {!headerHidden && (!labelHidden || isPagesSidebarHidden) && (
                  <div className="app-text" style={{ wordWrap: 'break-word', overflow: 'hidden' }}>
                    {name?.trim() ? name : appName}
                  </div>
                )}
                {collapsable &&
                  !isTopPositioned &&
                  style == 'texticon' &&
                  position === 'side' &&
                  !isPagesSidebarHidden && (
                    <div onClick={toggleSidebarPinned} className="icon-btn collapse-icon ">
                      <SolidIcon
                        className="cursor-pointer"
                        fill="var(--icon-strong)"
                        width="14px"
                        name={isSidebarPinned ? 'remove03' : 'menu'}
                      />
                    </div>
                  )}
              </div>
            )}
            {isLicensed && !isPagesSidebarHidden ? (
              <RenderPageAndPageGroup
                switchPageWrapper={switchPageWrapper}
                pages={pages}
                labelStyle={labelStyle}
                computeStyles={computeStyles}
                darkMode={darkMode}
                switchPage={switchPage}
                linkRefs={linkRefs}
                visibleLinks={visibleLinks}
                overflowLinks={overflowLinks}
                moreBtnRef={moreRef}
                navRef={navRef}
                position={position}
                isSidebarPinned={isSidebarPinned}
                currentMode={currentMode}
              />
            ) : (
              !isPagesSidebarHidden && (
                <RenderPagesWithoutGroup
                  darkMode={darkMode}
                  homePageId={homePageId}
                  labelStyle={labelStyle}
                  isSidebarPinned={isSidebarPinned}
                  pages={pages}
                  currentPageId={currentPageId}
                  computeStyles={computeStyles}
                  switchPageWrapper={switchPageWrapper}
                  moreBtnRef={moreRef}
                  visibleLinks={visibleLinks}
                  overflowLinks={overflowLinks}
                  position={position}
                  currentMode={currentMode}
                />
              )
            )}
          </div>
          {appMode === 'auto' && (
            <div ref={darkModeToggleRef} className="d-flex align-items-center page-dark-mode-btn-wrapper">
              <DarkModeToggle
                toggleForCanvas={true}
                switchDarkMode={switchDarkMode}
                darkMode={darkMode}
                tooltipPlacement={position === 'top' ? 'bottom' : 'right'}
              />
            </div>
          )}
        </div>
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

const RenderPagesWithoutGroup = ({
  darkMode,
  homePageId,
  labelStyle,
  isSidebarPinned,
  _pages,
  currentPageId,
  computeStyles,
  switchPageWrapper,
  visibleLinks,
  overflowLinks,
  linkRefs,
  handleToggle,
  position,
  moreBtnRef,
  _currentMode,
}) => {
  const [showPopover, setShowPopover] = useState(false);

  return (
    <div className={cx('page-handler-wrapper', { 'dark-theme': darkMode })}>
      {visibleLinks.map((page) => {
        return (
          <RenderPage
            key={page.handle}
            page={page}
            currentPageId={currentPageId}
            switchPageWrapper={switchPageWrapper}
            labelStyle={labelStyle}
            computeStyles={computeStyles}
            darkMode={darkMode}
            homePageId={homePageId}
            linkRefs={linkRefs}
            callback={handleToggle}
            position={position}
          />
        );
      })}
      {overflowLinks.length > 0 && position === 'top' && (
        <>
          <button
            ref={moreBtnRef}
            onClick={() => setShowPopover(!showPopover)}
            className="tj-list-item page-name more-btn-pages width-unset"
            style={{ cursor: 'pointer', fontSize: '14px', marginLeft: '0px' }}
          >
            <SolidIcon fill={'var(--icon-weak)'} viewBox="0 3 21 18" width="16px" name="morevertical" />
            <div style={{ marginLeft: '6px' }}>More</div>
          </button>

          <Overlay
            show={showPopover}
            target={moreBtnRef.current}
            placement="bottom-end"
            onHide={() => setShowPopover(false)}
            rootClose
          >
            <Popover id="more-nav-btns" className={`${darkMode && 'dark-theme'}`}>
              <Popover.Body>
                {overflowLinks.map((page, _index) => {
                  return (
                    <RenderPage
                      key={page.handle}
                      page={page}
                      currentPageId={currentPageId}
                      switchPageWrapper={switchPageWrapper}
                      labelStyle={labelStyle}
                      computeStyles={computeStyles}
                      darkMode={darkMode}
                      homePageId={homePageId}
                      linkRefs={linkRefs}
                      isSidebarPinned={isSidebarPinned}
                    />
                  );
                })}
              </Popover.Body>
            </Popover>
          </Overlay>
        </>
      )}
    </div>
  );
};

export default PagesSidebarNavigation;
