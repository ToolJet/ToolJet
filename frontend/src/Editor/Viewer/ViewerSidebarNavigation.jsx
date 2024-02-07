import React from 'react';
import _ from 'lodash';
// eslint-disable-next-line import/no-unresolved
import FolderList from '@/_ui/FolderList/FolderList';

export const ViewerSidebarNavigation = ({ isMobileDevice, pages, currentPageId, switchPage, darkMode }) => {
  if (isMobileDevice) {
    return null;
  }
  return (
    <div
      className={`navigation-area`}
      style={{
        width: 200,
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
