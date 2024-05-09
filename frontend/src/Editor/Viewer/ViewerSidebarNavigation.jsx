import React from 'react';
import _ from 'lodash';
// eslint-disable-next-line import/no-unresolved
import FolderList from '@/_ui/FolderList/FolderList';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import classNames from 'classnames';

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
  return (
    <div
      className={classNames('navigation-area', {
        close: !isSidebarPinned,
        'sidebar-overlay': !isSidebarPinned,
      })}
      style={{
        width: 200,
        position: 'fixed',
        height: `calc(100% - ${showHeader ? APP_HEADER_HEIGHT : 0}px)`,
        top: showHeader ? '47px' : '0px',
        bottom: '0px',
      }}
    >
      <div className="position-relative">
        <ButtonSolid
          onClick={() => {
            toggleSidebarPinned();
          }}
          as="a"
          variant="tertiary"
          className="left-sidebar-header-btn pin"
          fill={`var(--slate12)`}
          darkMode={darkMode}
          leftIcon={isSidebarPinned ? 'unpin' : 'pin'}
          iconWidth="14"
        ></ButtonSolid>
        <div className="page-handler-wrapper">
          {pages.map((page) =>
            page.hidden || page.disabled ? null : (
              <FolderList
                key={page.handle}
                onClick={() => switchPage(page?.id)}
                selectedItem={page?.id === currentPageId}
              >
                <span data-cy={`pages-name-${String(page?.name).toLowerCase()}`} className="mx-3 text-wrap page-name">
                  {_.truncate(page?.name, { length: 18 })}
                </span>
              </FolderList>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewerSidebarNavigation;
