import React, { memo } from 'react';
import _ from 'lodash';
import { PageMenuItem } from './PageMenuItem';
import { PageGroupItem } from './PageGroupItem';

export const PageMenuItemGhost = memo(({ darkMode, page }) => {
  return (
    <div className={`page-handler ghost ${darkMode ? 'dark-theme' : ''}`}>
      {page.isPageGroup ? (
        <PageGroupItem darkMode={darkMode} page={page} />
      ) : (
        <PageMenuItem darkMode={darkMode} page={page} />
      )}
    </div>
  );
});
