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
import { RenderPage, RenderPageAndPageGroup } from './PageGroup';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import toast from 'react-hot-toast';
import { shallow } from 'zustand/shallow';
import { resolveReferences } from '@/_helpers/utils';
import { Overlay, Popover } from 'react-bootstrap';
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
  const currentMode = useStore((state) => state.modeStore.modules[moduleId].currentMode);
  const selectedEnvironmentName = useStore((state) => state.selectedEnvironment?.name);
  const homePageId = useStore((state) => state.appStore.modules[moduleId].app.homePageId);
  const license = useStore((state) => state.license);
  const setCurrentPageHandle = useStore((state) => state.setCurrentPageHandle);
  const appName = useStore((state) => state.appStore.modules[moduleId].app.appName);
  const isSidebarOpen = useStore((state) => state.isSidebarOpen);
  const isRightSidebarOpen = useStore((state) => state.isRightSidebarOpen, shallow);

  const navRef = useRef(null);
  const moreRef = useRef(null);
  const linkRefs = useRef({});
  const observer = useRef(null);
  const measurementContainerRef = useRef(null);

  const [overflowLinks, setOverflowLinks] = useState([]);
  const [visibleLinks, setVisibleLinks] = useState(pages);
  const [showPopover, setShowPopover] = useState(false);

  const { disableMenu, hideHeader, position, style, collapsable, name, hideLogo } = properties ?? {};

  const calculateOverflow = useCallback(() => {
    if (!navRef.current || !measurementContainerRef.current || pages.length === 0) {
      return;
    }

    const containerWidth = navRef.current.offsetWidth;
    let currentWidth = 0;
    const tempVisible = [];
    const tempOverflow = [];

    const measuredNavItems = Array.from(measurementContainerRef.current.children);
    const MORE_BUTTON_WIDTH_ESTIMATE = 250;

    for (let i = 0; i < pages.length; i++) {
      const link = pages[i];
      const correspondingMeasuredElement = measuredNavItems.find((item) => item.dataset.id === String(link.id));

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
  }, [pages, position, style]);

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
  const isPagesSidebarHidden = resolveReferences(disableMenu?.value);

  if (hideHeader && hideLogo && isPagesSidebarHidden) {
    return null;
  }

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
          // .filter((p) => !p.pageGroupId || p.isPageGroup)
          .map((link) => (
            <div
              style={{ padding: `0px ${style === 'texticon' ? '22px' : '10px'}` }}
              key={`measure-${link.id}`}
              data-id={link.id}
            >
              {link?.name}
            </div>
          ))}
      </button>
      <div
        ref={navRef}
        className={cx('navigation-area', {
          close: !isSidebarPinned && properties?.collapsable && style !== 'text' && position === 'side',
          'icon-only':
            style === 'icon' ||
            (style === 'texticon' && !isSidebarPinned && position === 'side' && !isPagesSidebarHidden),
          'position-top': position === 'top' || isPagesSidebarHidden,
          'text-only': style === 'text',
          'right-sidebar-open': isRightSidebarOpen && (position === 'top' || isPagesSidebarHidden),
          'left-sidebar-open': isSidebarOpen && (position === 'top' || isPagesSidebarHidden),
        })}
        style={{
          width: 226,
          position: 'sticky',
          height: currentMode === 'edit' ? '100%' : `calc(100% - 32px)`,
          top: '4px',
          bottom: '0px',
          background: !styles?.backgroundColor?.isDefault && styles?.backgroundColor?.value,
          border: `${styles?.pillRadius?.value}px`,
          borderRight:
            !styles?.borderColor?.isDefault && position === 'side' ? `1px solid ${styles?.borderColor?.value}` : '',
          borderBottom:
            !styles?.borderColor?.isDefault && position === 'top' ? `1px solid ${styles?.borderColor?.value}` : '',
          overflow: 'scroll',
          boxShadow: 'var(--elevation-100-box-shadow)',
        }}
      >
        <div style={{ overflow: 'hidden' }} className="position-relative">
          {(collapsable || !headerHidden || !hideLogo) && (
            <div
              style={{
                marginRight: hideHeader && hideLogo && position == 'top' && '0px',
              }}
              className="app-name"
            >
              {!hideLogo && (
                <div onClick={switchToHomePage} className="cursor-pointer flex-shrink-0">
                  <AppLogo isLoadingFromHeader={false} />
                </div>
              )}
              {!headerHidden && (!labelHidden || isPagesSidebarHidden) && (
                <OverflowTooltip>{name?.trim() ? name : appName}</OverflowTooltip>
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
              />
            )
          )}
        </div>
        <div className="d-flex align-items-center page-dark-mode-btn-wrapper">
          <DarkModeToggle
            toggleForCanvas={true}
            switchDarkMode={switchDarkMode}
            darkMode={darkMode}
            tooltipPlacement="right"
          />
        </div>
      </div>
    </div>
  );
};

const RenderPagesWithoutGroup = ({
  darkMode,
  homePageId,
  labelStyle,
  isSidebarPinned,
  pages,
  currentPageId,
  computeStyles,
  switchPageWrapper,
  visibleLinks,
  overflowLinks,
  linkRefs,
  handleToggle,
  position,
  moreBtnRef,
}) => {
  const [showPopover, setShowPopover] = useState(false);
  const filteredPagesVisible = (position == 'top' ? visibleLinks : pages).filter(
    (page) => (!page?.isPageGroup || page.children?.length > 0) && !page?.restricted
  );
  const filteredPagesOverflow = overflowLinks.filter(
    (page) => (!page?.isPageGroup || page.children?.length > 0) && !page?.restricted
  );

  return (
    <div className={cx('page-handler-wrapper', { 'dark-theme': darkMode })}>
      {filteredPagesVisible.map((page) => {
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
      {filteredPagesOverflow.length > 0 && position === 'top' && (
        <>
          <button
            ref={moreBtnRef}
            onClick={() => setShowPopover(!showPopover)}
            className="tj-list-item page-name"
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
            <Popover id="more-nav-btns">
              <Popover.Body>
                {filteredPagesOverflow.map((page, index) => {
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
