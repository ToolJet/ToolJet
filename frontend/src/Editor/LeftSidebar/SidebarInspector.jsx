import React from 'react';
import usePinnedPopover from '@/_hooks/usePinnedPopover';
import { LeftSidebarItem } from './SidebarItem';
import { SidebarPinnedButton } from './SidebarPinnedButton';
import ReactJson from 'react-json-view';
import JSONTreeViewer from '@/_ui/JSONTreeViewer';

export const LeftSidebarInspector = ({ darkMode, currentState }) => {
  const [open, trigger, content, popoverPinned, updatePopoverPinnedState] = usePinnedPopover(false);
  const jsonData = Object.entries(currentState).filter(([key]) => key !== 'errors');
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
          {jsonData.map((data) => (
            <JSONTreeViewer
              key={data[0]}
              data={data[1]}
              theme={darkMode ? 'shapeshifter' : 'rjv-default'}
              name={data[0]}
              style={{ fontSize: '0.7rem' }}
              enableClipboard={false}
              displayDataTypes={false}
              collapsed={true}
              displayObjectSize={false}
              quotesOnKeys={false}
              sortKeys={true}
              collapseStringsAfterLength={1000}
            />
          ))}
        </div>
      </div>
    </>
  );
};
