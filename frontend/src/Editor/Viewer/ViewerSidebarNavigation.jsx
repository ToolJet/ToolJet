import React from 'react';
import _ from 'lodash';
import cx from 'classnames';
import * as Icons from '@tabler/icons-react';
// eslint-disable-next-line import/no-unresolved
import FolderList from '@/_ui/FolderList/FolderList';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { getCurrentState } from '@/_stores/currentStateStore';

const APP_HEADER_HEIGHT = 47;

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
  if (isMobileDevice) {
    return null;
  }

  const { definition: { styles, properties } = {} } = getCurrentState().pageSettings ?? {};
  const computeStyles = (isSelected, isHovered) => {
    if (darkMode) {
      return {};
    }
    const baseStyles = {
      pill: {
        borderRadius: `${styles?.pillRadius?.value}px`,
      },
      icon: {
        color: styles?.iconColor?.value,
        fill: styles?.iconColor?.value,
      },
    };

    switch (true) {
      case isSelected: {
        return {
          ...baseStyles,
          text: {
            color: styles?.selectedTextColor?.value,
          },
          icon: {
            color: styles?.selectedIconColor?.value,
            fill: styles?.selectedIconColor?.value,
          },
          pill: {
            background: styles?.pillSelectedBackgroundColor?.value,
            ...baseStyles?.pill,
          },
        };
      }
      case isHovered: {
        return {
          ...baseStyles,
          pill: {
            background: styles?.pillHoverBackgroundColor?.value,
            ...baseStyles?.pill,
          },
        };
      }
      default: {
        return {
          text: {
            color: styles?.textColor?.value,
          },
          icon: {
            color: styles?.iconColor?.value,
            fill: styles?.iconColor?.value,
          },
          ...baseStyles,
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
        background: !darkMode && styles?.backgroundColor?.value,
        border: `${styles?.pillRadius?.value}px`,
      }}
    >
      <div className="position-relative">
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
          iconWidth="16"
        ></ButtonSolid>
        <div className="page-handler-wrapper">
          {pages.map((page) => {
            // eslint-disable-next-line import/namespace
            const IconElement = Icons?.[page.icon] ?? Icons?.['IconHome2'];
            return page.hidden || page.disabled ? null : (
              <FolderList
                key={page.handle}
                onClick={() => switchPage(page?.id)}
                selectedItem={page?.id === currentPageId}
                CustomIcon={!labelStyle?.icon?.hidden && IconElement}
                customStyles={computeStyles}
                darkMode={darkMode}
              >
                {!labelStyle?.label?.hidden && (
                  <span data-cy={`pages-name-${String(page?.name).toLowerCase()}`} className="mx-2 text-wrap page-name">
                    {_.truncate(page?.name, { length: 18 })}
                  </span>
                )}
              </FolderList>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ViewerSidebarNavigation;
