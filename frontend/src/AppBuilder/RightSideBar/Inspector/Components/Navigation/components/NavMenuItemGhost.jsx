import React, { memo } from 'react';
import * as Icons from '@tabler/icons-react';
import { getSafeRenderableValue } from '@/AppBuilder/Widgets/utils';
import OverflowTooltip from '@/_components/OverflowTooltip';

// Ghost Menu Item (for DragOverlay)
const GhostMenuItem = ({ item, getResolvedValue }) => {
  const getIconComponent = () => {
    const iconName = item?.icon?.value || 'IconFile';
    const IconComponent = Icons?.[iconName] ?? Icons?.['IconFile'];
    return IconComponent;
  };

  const IconComponent = getIconComponent();

  return (
    <div className="page-menu-item" style={{ width: '100%' }}>
      <div className="left">
        <div className="main-page-icon-wrapper">
          <IconComponent size={20} stroke={1.5} className="nav-item-icon" />
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
