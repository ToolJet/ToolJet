import React from 'react';
import _ from 'lodash';
// eslint-disable-next-line import/no-unresolved
import FolderList from '@/_ui/FolderList/FolderList';

const APP_HEADER_HEIGHT = 47;

export const ViewerSidebarNavigation = ({ isMobileDevice, pages, currentPageId, switchPage, darkMode, showHeader }) => {
  if (isMobileDevice) {
    return null;
  }
  return (
    <div
      className={`navigation-area overflow-y-auto`}
      style={{
        width: 200,
        position: 'fixed',
        height: `calc(100% - ${showHeader ? APP_HEADER_HEIGHT : 0}px)`,
        top: showHeader ? '47px' : '0px',
        bottom: '0px',
      }}
    >
      <div className="page-handler-wrapper">
        {pages.map((page) =>
          page.hidden || page.disabled ? null : (
            <FolderList
              key={page.handle}
              onClick={() => switchPage(page?.id)}
              selectedItem={page?.id === currentPageId}
            >
              <span data-cy={`pages-name-${String(page?.name).toLowerCase()}`} className="mx-3 text-wrap">
                {_.truncate(page?.name, { length: 18 })}
              </span>
            </FolderList>
          )
        )}
      </div>
    </div>
  );
};

export default ViewerSidebarNavigation;
