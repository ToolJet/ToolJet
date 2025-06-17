import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import _ from 'lodash';
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
import { RenderPageAndPageGroup } from './PageGroup';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const PagesSidebarNavigation = ({
  isMobileDevice,
  pages,
  currentPageId,
  switchPage,
  darkMode,
  showHeader,
  isSidebarPinned,
  toggleSidebarPinned,
  height,
  switchDarkMode,
}) => {
  const { definition: { styles = {}, properties = {} } = {} } = useStore((state) => state.pageSettings) || {};
  const selectedVersionName = useStore((state) => state.selectedVersion?.name);
  const currentMode = useStore((state) => state.currentMode);
  const selectedEnvironmentName = useStore((state) => state.selectedEnvironment?.name);
  const homePageId = useStore((state) => state.app.homePageId);
  const license = useStore((state) => state.license);
  const setCurrentPageHandle = useStore((state) => state.setCurrentPageHandle);

  const navRef = useRef(null);
  const moreRef = useRef(null);
  const linkRefs = useRef({});
  const observer = useRef(null);
  const measurementContainerRef = useRef(null);

  const [overflowLinks, setOverflowLinks] = useState([]);
  const [visibleLinks, setVisibleLinks] = useState(pages);
  const [showPopover, setShowPopover] = useState(false);

  const { disableMenu, hideHeader, position, style, collapsable, name } = properties ?? {};

  const calculateOverflow = useCallback(() => {
    if (!navRef.current || !measurementContainerRef.current || pages.length === 0) {
      return;
    }

    const containerWidth = navRef.current.offsetWidth;
    let currentWidth = 112;
    const tempVisible = [];
    const tempOverflow = [];

    const measuredNavItems = Array.from(measurementContainerRef.current.children);

    const MORE_BUTTON_WIDTH_ESTIMATE = 80;

    for (let i = 0; i < pages.length; i++) {
      const link = pages[i];
      const correspondingMeasuredElement = measuredNavItems.find((item) => item.dataset.id === String(link.id));

      if (!correspondingMeasuredElement) {
        continue;
      }

      const itemWidth = correspondingMeasuredElement.offsetWidth;
      const itemMargin = parseInt(window.getComputedStyle(correspondingMeasuredElement).marginRight || '0', 10);
      const totalItemWidth = itemWidth + itemMargin;

      const spaceNeededForMoreButton = i < pages.length - 1 || tempOverflow.length > 0 ? MORE_BUTTON_WIDTH_ESTIMATE : 0;

      if (currentWidth + totalItemWidth <= containerWidth - spaceNeededForMoreButton) {
        tempVisible.push(link);
        currentWidth += totalItemWidth;
      } else {
        tempOverflow.push(link);
      }
    }

    if (tempOverflow.length > 0 && currentWidth + MORE_BUTTON_WIDTH_ESTIMATE > containerWidth) {
      if (tempVisible.length > 0) {
        const lastVisible = tempVisible.pop();
        tempOverflow.unshift(lastVisible);
      }
    }

    setVisibleLinks(tempVisible);
    setOverflowLinks(tempOverflow);
  }, [pages]);

  useLayoutEffect(() => {
    let debouncedHandleResize = () => {};
    if (position === 'top') {
      calculateOverflow();
      const handleResize = () => {
        let timeoutId;
        return () => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(calculateOverflow, 100);
        };
      };

      debouncedHandleResize = handleResize();
      window.addEventListener('resize', debouncedHandleResize);
    }

    return () => {
      window.removeEventListener('resize', debouncedHandleResize);
    };
  }, [pages, calculateOverflow, position]);

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

  const labelStyle = {
    icon: {
      hidden: properties?.style === 'text',
    },
    label: {
      hidden: properties?.style === 'icon',
    },
  };

  const getAbsoluteUrl = (url) => {
    if (!url) return '';

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  const switchPageWrapper = (page) => {
    if (page?.type === 'url' && page?.url) {
      const finalUrl = getAbsoluteUrl(page.url);
      if (finalUrl) {
        if (page.openIn === 'new_tab') {
          window.open(finalUrl, '_blank');
        } else {
          window.location.href = finalUrl;
        }
      }
      return;
    }

    if (page?.type === 'app' && page?.appId) {
      const baseUrl = `${window.public_config?.TOOLJET_HOST}/applications/${page.appId}`;
      if (page.openIn === 'new_tab') {
        window.open(baseUrl, '_blank');
      } else {
        window.location.href = baseUrl;
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

  const isLicensed =
    !_.get(license, 'featureAccess.licenseStatus.isExpired', true) &&
    _.get(license, 'featureAccess.licenseStatus.isLicenseValid', false);

  const isPinnedWithLabel = isSidebarPinned && !labelStyle?.label?.hidden;
  const isUnpinnedInEdit = !isSidebarPinned && currentMode !== 'view';
  const isTopPositioned = position === 'top';
  const labelHidden = labelStyle?.label?.hidden;
  const sidebarCollapsed = !isSidebarPinned;
  const isEditing = currentMode === 'edit';

  return (
    <div>
      <button
        ref={measurementContainerRef}
        style={{
          position: 'absolute',
          top: '-9999px',
          left: '-9999px',
          visibility: 'hidden',
          whiteSpace: 'nowrap',
          display: 'flex',
          padding: '0px 22px',
          className: 'tj-list-item page-name',
          marginLeft: '184px',
        }}
      >
        {pages.map((link) => (
          <div style={{ padding: '0px 22px' }} key={`measure-${link.id}`} data-id={link.id}>
            {link?.name}
          </div>
        ))}
      </button>
      <div
        ref={navRef}
        className={cx('navigation-area', {
          close: !isSidebarPinned && properties?.collapsable,
          // 'sidebar-overlay': !isSidebarPinned && properties?.collapsable,
          'icon-only': labelHidden || (sidebarCollapsed && position !== 'top'),
          'position-top': position === 'top',
          'text-only': style === 'text',
        })}
        style={{
          width: 226,
          position: 'fixed',
          // height: `calc(100% - ${showHeader ? APP_HEADER_HEIGHT : 0}px)`,
          height,
          top: showHeader ? '47px' : '0px',
          bottom: '0px',
          background: !styles?.backgroundColor?.isDefault && styles?.backgroundColor?.value,
          border: `${styles?.pillRadius?.value}px`,
          borderRight: !styles?.borderColor?.isDefault ? `1px solid ${styles?.borderColor?.value}` : '',
          overflow: 'scroll',
        }}
      >
        <div className="position-relative">
          <div className="app-name">
            {!hideHeader && (
              <>
                <div className="cursor-pointer">
                  <AppLogo isLoadingFromHeader={false} />
                </div>
                {isPinnedWithLabel && !labelHidden && <span>{name}</span>}
              </>
            )}
            {collapsable && !isTopPositioned && !labelHidden && (
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
          {/* <ButtonSolid
          onClick={() => {
            toggleSidebarPinned();
          }}
          as="a"
          variant="tertiary"
          className={cx('left-sidebar-header-btn pin', { 'd-none': !properties?.collapsable })}
          fill={`var(--slate12)`}
          darkMode={darkMode}
          leftIcon={isSidebarPinned ? 'unpin01' : 'pin'}
          iconWidth="18"
        ></ButtonSolid> */}
          {isLicensed ? (
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
            />
          ) : (
            <div className={cx('page-handler-wrapper', { 'dark-theme': darkMode })}>
              {pages.map((page) => {
                const isHomePage = page.id === homePageId;
                const iconName = isHomePage && !page.icon ? 'IconHome2' : page.icon;
                // eslint-disable-next-line import/namespace
                const IconElement = Icons?.[iconName] ?? Icons?.['IconFileDescription'];
                return page.hidden || page.disabled || page?.restricted ? null : (
                  <FolderList
                    key={page.handle}
                    onClick={() => switchPageWrapper(page?.id)}
                    selectedItem={page?.id === currentPageId}
                    CustomIcon={!labelStyle?.icon?.hidden && IconElement}
                    customStyles={computeStyles}
                    darkMode={darkMode}
                  >
                    {!labelStyle?.label?.hidden && (
                      <span data-cy={`pages-name-${String(page?.name).toLowerCase()}`}>
                        <OverflowTooltip style={{ width: '110px' }} childrenClassName={'page-name'}>
                          {page.name}
                        </OverflowTooltip>
                      </span>
                    )}
                  </FolderList>
                );
              })}
            </div>
          )}
        </div>
        <div className="d-flex align-items-center page-dark-mode-btn-wrapper">
          <DarkModeToggle switchDarkMode={switchDarkMode} darkMode={darkMode} tooltipPlacement="right" />
        </div>
      </div>
    </div>
  );
};

export default PagesSidebarNavigation;
