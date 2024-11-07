import React, { memo, useRef, useState } from 'react';
// import { RenameInput } from './RenameInput';
// import { PagehandlerMenu } from './PagehandlerMenu';
// import { EditModal } from './EditModal';
// import { SettingsModal } from './SettingsModal';
import EyeDisable from '@/_ui/Icon/solidIcons/EyeDisable';
import FileRemove from '@/_ui/Icon/solidIcons/FIleRemove';
import Home from '@/_ui/Icon/solidIcons/Home';
import useStore from '@/AppBuilder/_stores/store';
import _ from 'lodash';

export const PageMenuItemGhost = memo(({ darkMode, page }) => {
  const homePageId = useStore((state) => state.app.homePageId);
  const isHomePage = page.id === homePageId;
  const isHidden = page?.hidden ?? false;
  const isDisabled = page?.disabled ?? false;
  const isIconApplied = isHomePage || isHidden || isDisabled;
  // only update when the page is being edited

  return (
    <div
      className="page-handler"
      style={{
        position: 'relative',
        width: '100%',
        opacity: 0.5,
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--slate4)',
        }}
        className="page-menu-item"
      >
        <div className="left">{page.name}</div>
      </div>
    </div>
  );
});
