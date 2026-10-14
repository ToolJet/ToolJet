import React, { memo } from 'react';
import OverflowTooltip from '@/_components/OverflowTooltip';

export const TreeSelectItemGhost = memo(({ darkMode, item }) => {
  return (
    <div className={`treeselect-handler ghost ${darkMode ? 'dark-theme' : ''}`}>
      <div className="treeselect-option-item" style={{ width: '100%' }}>
        <div className="left">
          <OverflowTooltip childrenClassName="option-label">{item?.label || item?.value}</OverflowTooltip>
        </div>
      </div>
    </div>
  );
});

TreeSelectItemGhost.displayName = 'TreeSelectItemGhost';
