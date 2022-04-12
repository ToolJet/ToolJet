import React from 'react';
import usePinnedPopover from '@/_hooks/usePinnedPopover';
import { LeftSidebarItem } from './SidebarItem';
import { SidebarPinnedButton } from './SidebarPinnedButton';
import JSONTreeViewer from '@/_ui/JSONTreeViewer';
import _ from 'lodash';

export const LeftSidebarInspector = ({ darkMode, currentState }) => {
  const [open, trigger, content, popoverPinned, updatePopoverPinnedState] = usePinnedPopover(false);

  const jsontreeData = { ...currentState };
  delete jsontreeData.errors;

  const iconsList = [
    { iconName: 'queries', iconPath: '/assets/images/icons/editor/left-sidebar/queries.svg' },
    { iconName: 'components', iconPath: '/assets/images/icons/editor/left-sidebar/components.svg' },
    { iconName: 'globals', iconPath: '/assets/images/icons/editor/left-sidebar/globals.svg' },
    { iconName: 'variables', iconPath: '/assets/images/icons/editor/left-sidebar/variables.svg' },
  ];

  return (
    <>
      <LeftSidebarItem
        tip="Inspector"
        {...trigger}
        icon="inspect"
        className={`left-sidebar-item left-sidebar-layout ${open && 'active'} left-sidebar-inspector`}
        text={'Inspector'}
      />
      <div
        {...content}
        className={`card popover ${open || popoverPinned ? 'show' : 'hide'}`}
        style={{ resize: 'horizontal', maxWidth: '50%' }}
      >
        <SidebarPinnedButton
          darkMode={darkMode}
          component={'Inspector'}
          state={popoverPinned}
          updateState={updatePopoverPinnedState}
        />
        <div style={{ marginTop: '1rem' }} className="card-body">
          <JSONTreeViewer data={jsontreeData} useIcons={true} iconsList={iconsList} />
        </div>
      </div>
    </>
  );
};
