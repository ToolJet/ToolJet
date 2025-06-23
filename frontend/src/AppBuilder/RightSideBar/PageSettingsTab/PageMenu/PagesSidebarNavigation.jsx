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
import { DarkModeToggle, ToolTip } from '@/_components';
import { RenderPageAndPageGroup } from './PageGroup';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import toast from 'react-hot-toast';
// import useSidebarMargin from './useSidebarMargin';

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
  const { moduleId } = useModuleContext();
  const { definition: { styles = {}, properties = {} } = {} } = useStore((state) => state.pageSettings) || {};
  const selectedVersionName = useStore((state) => state.selectedVersion?.name);
  const currentMode = useStore((state) => state.currentMode);
  const selectedEnvironmentName = useStore((state) => state.selectedEnvironment?.name);
  const homePageId = useStore((state) => state.appStore.modules[moduleId].app.homePageId);
  const license = useStore((state) => state.license);
  const setCurrentPageHandle = useStore((state) => state.setCurrentPageHandle);
  const appName = useStore((state) => state.appStore.modules[moduleId].app.appName);
  const isSidebarOpen = useStore((state) => state.isSidebarOpen);

  const navRef = useRef(null);
  const moreRef = useRef(null);
  const linkRefs = useRef({});
  const observer = useRef(null);
  const measurementContainerRef = useRef(null);

  const [overflowLinks, setOverflowLinks] = useState([]);
  const [visibleLinks, setVisibleLinks] = useState(pages);
  const [showPopover, setShowPopover] = useState(false);

  const { disableMenu, hideHeader, position, style, collapsable } = properties ?? {};

  const calculateOverflow = useCallback(() => {
    if (!navRef.current || !measurementContainerRef.current || pages.length === 0) {
      return;
    }

    const containerWidth = navRef.current.offsetWidth;
    let currentWidth = 0;
    const tempVisible = [];
    const tempOverflow = [];

    const measuredNavItems = Array.from(measurementContainerRef.current.children);
    const MORE_BUTTON_WIDTH_ESTIMATE = 180;

    for (let i = 0; i < pages.length; i++) {
      const link = pages[i];
      const correspondingMeasuredElement = measuredNavItems.find(
        (item) => item.dataset.id === String(link.id) && !link?.pageGroupId
      );

      if (!correspondingMeasuredElement) {
        continue;
      }

      const itemWidth = correspondingMeasuredElement.offsetWidth;

      const spaceNeededForMoreButton = i < pages.length - 1 || tempOverflow.length > 0 ? MORE_BUTTON_WIDTH_ESTIMATE : 0;

      if (currentWidth + itemWidth <= containerWidth - spaceNeededForMoreButton) {
        tempVisible.push(link);
        currentWidth += itemWidth;
      } else {
        tempOverflow.push(link);
      }
    }

    if (tempOverflow.length > 0 && currentWidth + MORE_BUTTON_WIDTH_ESTIMATE > containerWidth) {
      if (tempVisible.length > 0) {
        const lastVisible = tempVisible.pop();
        tempOverflow.unshift(lastVisible);
        currentWidth -= lastVisible.offsetWidth;
      }
    }

    setVisibleLinks(tempVisible);
    setOverflowLinks(tempOverflow);
  }, [pages]);

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
  }, [pages, calculateOverflow]);

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
      hidden:
        properties?.style === 'icon' || (style === 'texticon' && !isSidebarPinned && properties?.position != 'top'),
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

  const isLicensed =
    !_.get(license, 'featureAccess.licenseStatus.isExpired', true) &&
    _.get(license, 'featureAccess.licenseStatus.isLicenseValid', false);

  const isPinnedWithLabel = isSidebarPinned && !labelStyle?.label?.hidden;
  const isUnpinnedInEdit = !isSidebarPinned && currentMode !== 'view';
  const isTopPositioned = position === 'top';
  const labelHidden = labelStyle?.label?.hidden;
  const sidebarCollapsed = !isSidebarPinned;
  const isEditing = currentMode === 'edit';
  const headerHidden = isLicensed ? hideHeader : false;

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
          padding: '0px 0px',
          className: 'tj-list-item page-name',
        }}
      >
        {pages
          .filter((p) => !p.pageGroupId)
          .map((link) => (
            <div style={{ padding: '0px 10px' }} key={`measure-${link.id}`} data-id={link.id}>
              {link?.name}
            </div>
          ))}
      </button>
      <div
        ref={navRef}
        className={cx('navigation-area', {
          close: !isSidebarPinned && properties?.collapsable && style !== 'text' && position === 'side',
          // 'sidebar-overlay': !isSidebarPinned && properties?.collapsable,
          'icon-only': style === 'icon' || (style === 'texticon' && !isSidebarPinned && position === 'side'),
          'position-top': position === 'top',
          'text-only': style === 'text',
        })}
        style={{
          width: 226,
          position: 'sticky',
          // height: `calc(100% - ${showHeader ? APP_HEADER_HEIGHT : 0}px)`,
          // height,
          height: '100%',
          // top: showHeader ? '47px' : '0px',
          top: '0px',
          bottom: '0px',
          background: !styles?.backgroundColor?.isDefault && styles?.backgroundColor?.value,
          border: `${styles?.pillRadius?.value}px`,
          borderRight: !styles?.borderColor?.isDefault ? `1px solid ${styles?.borderColor?.value}` : '',
          overflow: 'scroll',
          boxShadow: 'var(--elevation-100-box-shadow)',
          // ...(position === 'side' && isSidebarOpen ? { marginLeft: isSidebarPinned ? '574px' : '392px' } : {}),
        }}
      >
        <div className="position-relative">
          <div
            style={{
              marginRight: headerHidden && position == 'top' && '0px',
            }}
            className="app-name"
          >
            {!headerHidden && (
              <>
                <div className="cursor-pointer">
                  <AppLogo isLoadingFromHeader={false} />
                </div>
                {((isPinnedWithLabel && !labelHidden) || position === 'top') && <span>{appName}</span>}
              </>
            )}
            {collapsable && !isTopPositioned && style == 'texticon' && position === 'side' && (
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
                const IconElement = (props) => {
                  // eslint-disable-next-line import/namespace
                  const Icon = Icons?.[iconName] ?? Icons?.['IconFileDescription'];

                  if (!isSidebarPinned || labelStyle?.label?.hidden) {
                    return (
                      <ToolTip message={page?.name} placement={'right'}>
                        <Icon {...props} />
                      </ToolTip>
                    );
                  }

                  return <Icon {...props} />;
                };
                return page.hidden || page.disabled || page?.restricted ? null : (
                  <FolderList
                    key={page.handle}
                    onClick={() => switchPageWrapper(page)}
                    selectedItem={page?.id === currentPageId}
                    CustomIcon={!labelStyle?.icon?.hidden && IconElement}
                    customStyles={computeStyles}
                    darkMode={darkMode}
                  >
                    {!labelStyle?.label?.hidden && (
                      <span data-cy={`pages-name-${String(page?.name).toLowerCase()}`}>
                        <OverflowTooltip
                          style={{ width: '110px', position: 'relative' }}
                          childrenClassName={'page-name'}
                        >
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
