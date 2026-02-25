import React, { memo } from 'react';
import TablerIcon from '@/_ui/Icon/TablerIcon';
import { getSafeRenderableValue } from '@/AppBuilder/Widgets/utils';
import OverflowTooltip from '@/_components/OverflowTooltip';

// Ghost Menu Item (for DragOverlay)
const GhostMenuItem = ({ item, getResolvedValue }) => {
  return (
    <div className="page-menu-item" style={{ width: '100%' }}>
      <div className="left">
        <div className="main-page-icon-wrapper">
          <TablerIcon iconName={item?.icon?.value || 'IconFile'} fallbackIcon="IconFile" size={20} stroke={1.5} className="nav-item-icon" />
        </div>
        <OverflowTooltip childrenClassName="page-name">
          {getSafeRenderableValue(getResolvedValue?.(item?.label) ?? item?.label)}
        </OverflowTooltip>
      </div>
    </div>
  );
};

// Ghost Group Item (for DragOverlay)
const GhostGroupItem = ({ item, getResolvedValue }) => {
  return (
    <div className="page-menu-item page-group-item" style={{ width: '100%' }}>
      <div className="left">
        <div className="page-name">
          <OverflowTooltip childrenClassName="page-name">
            {getSafeRenderableValue(getResolvedValue?.(item?.label) ?? item?.label)}
          </OverflowTooltip>
        </div>
      </div>
    </div>
  );
};

export const NavMenuItemGhost = memo(({ darkMode, item, getResolvedValue }) => {
  return (
    <div className={`nav-handler ghost ${darkMode ? 'dark-theme' : ''}`}>
      {item?.isGroup ? (
        <GhostGroupItem item={item} getResolvedValue={getResolvedValue} />
      ) : (
        <GhostMenuItem item={item} getResolvedValue={getResolvedValue} />
      )}
    </div>
  );
});

NavMenuItemGhost.displayName = 'NavMenuItemGhost';
