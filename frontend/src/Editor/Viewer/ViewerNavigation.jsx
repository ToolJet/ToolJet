import React from 'react';
import _ from 'lodash';

export const ViewerNavigation = ({
  showViewerNavigation,
  canvasBackgroundColor,
  pages,
  currentPageId,
  switchPage,
  darkMode,
}) => {
  if (!showViewerNavigation) return null;

  return (
    <div
      className="navigation-area"
      style={{
        width: 200,
        backgroundColor: canvasBackgroundColor,
      }}
    >
      <div className="page-handler-wrapper">
        {pages.map(([id, page]) => (
          <div
            key={page.handle}
            onClick={() => switchPage(id)}
            className={`viewer-page-handler cursor-pointer ${darkMode && 'dark'}`}
          >
            <div className={`card mb-1  ${id === currentPageId ? 'active' : ''}`}>
              <div className="card-body">
                <span className="mx-3">{_.truncate(page.name, { length: 22 })}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
