import React from 'react';
import usePinnedPopover from '@/_hooks/usePinnedPopover';
import { LeftSidebarItem } from './SidebarItem';
import { SidebarPinnedButton } from './SidebarPinnedButton';
import JSONTreeViewer from '@/_ui/JSONTreeViewer';

export const LeftSidebarInspector = ({ darkMode, currentState }) => {
  const [open, trigger, content, popoverPinned, updatePopoverPinnedState] = usePinnedPopover(false);

  const jsontreeData = { ...currentState };
  delete jsontreeData.errors;

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
          <JSONTreeViewer data={jsontreeData} />
        </div>
      </div>
    </>
  );
};
