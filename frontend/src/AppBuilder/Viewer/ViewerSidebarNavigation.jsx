import React from 'react';
import _ from 'lodash';
import cx from 'classnames';
import * as Icons from '@tabler/icons-react';
// eslint-disable-next-line import/no-unresolved
import FolderList from '@/_ui/FolderList/FolderList';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import useStore from '@/AppBuilder/_stores/store';
import { APP_HEADER_HEIGHT } from '../AppCanvas/appCanvasConstants';
import OverflowTooltip from '@/_components/OverflowTooltip';
import { RenderPageAndPageGroup } from './PageGroup';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';

export const ViewerSidebarNavigation = ({
  isMobileDevice,
  pages,
  currentPageId,
  switchPage,
  darkMode,
  showHeader,
  isSidebarPinned,
  toggleSidebarPinned,
}) => {
  const { moduleId } = useModuleContext();
  const { definition: { styles = {}, properties = {} } = {} } = useStore((state) => state.pageSettings) || {};
  const selectedVersionName = useStore((state) => state.selectedVersion?.name);
  const selectedEnvironmentName = useStore((state) => state.selectedEnvironment?.name);
  const homePageId = useStore((state) => state.appStore.modules[moduleId].app.homePageId);
  const license = useStore((state) => state.license);

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

  const switchPageWrapper = (pageId) => {
    const queryParams = {
      version: selectedVersionName,
      env: selectedEnvironmentName,
    };
    switchPage(pageId, pages.find((page) => page.id === pageId)?.handle, Object.entries(queryParams), moduleId);
  };

  const isLicensed =
    !_.get(license, 'featureAccess.licenseStatus.isExpired', true) &&
    _.get(license, 'featureAccess.licenseStatus.isLicenseValid', false);

  return (
    <div
      className={cx('navigation-area', {
        close: !isSidebarPinned && properties?.collapsable,
        'sidebar-overlay': !isSidebarPinned && properties?.collapsable,
        'icon-only': labelStyle?.label?.hidden,
      })}
      style={{
        width: 200,
        position: 'fixed',
        height: `calc(100% - ${showHeader ? APP_HEADER_HEIGHT : 0}px)`,
        top: showHeader ? '47px' : '0px',
        bottom: '0px',
        background: !styles?.backgroundColor?.isDefault && styles?.backgroundColor?.value,
        border: `${styles?.pillRadius?.value}px`,
        borderRight: !styles?.borderColor?.isDefault ? `1px solid ${styles?.borderColor?.value}` : '',
      }}
    >
      <div className="position-relative" style={{ height: '100%' }}>
        <ButtonSolid
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
        ></ButtonSolid>
        {isLicensed ? (
          <RenderPageAndPageGroup
            switchPageWrapper={switchPageWrapper}
            pages={pages}
            labelStyle={labelStyle}
            computeStyles={computeStyles}
            darkMode={darkMode}
            switchPage={switchPage}
          />
        ) : (
          <div className={cx('page-handler-wrapper', { 'dark-theme': darkMode })}>
            {pages.map((page) => {
              const isHomePage = page.id === homePageId;
              const iconName = isHomePage && !page.icon ? 'IconHome2' : page.icon;
              // eslint-disable-next-line import/namespace
              const IconElement = Icons?.[iconName] ?? Icons?.['IconFileDescription'];
              return page.hidden || page.disabled ? null : (
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
                      <OverflowTooltip style={{ width: '110px' }} childrenClassName={'mx-2 page-name'}>
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
    </div>
  );
};

export default ViewerSidebarNavigation;
