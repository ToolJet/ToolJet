import React from 'react';
import { Button, HeaderSection } from '@/_ui/LeftSidebar';
import _ from 'lodash';

export const SidebarDebuggerHeader = ({ darkMode, clearErrorLogs, setPinned, pinned }) => {
  return (
    <HeaderSection darkMode={darkMode}>
      <HeaderSection.PanelHeader title="Debugger">
        <div className="d-flex justify-content-end">
          <Button onClick={clearErrorLogs} darkMode={darkMode} size="sm" styles={{ width: '76px' }}>
            <Button.Content title={'Clear'} iconSrc={'assets/images/icons/clear.svg'} direction="left" />
          </Button>
          <Button
            title={`${pinned ? 'Unpin' : 'Pin'}`}
            onClick={() => setPinned(!pinned)}
            darkMode={darkMode}
            size="sm"
            styles={{ width: '28px', padding: 0 }}
          >
            <Button.Content
              iconSrc={`assets/images/icons/editor/left-sidebar/pinned${pinned ? 'off' : ''}.svg`}
              direction="left"
            />
          </Button>
        </div>
      </HeaderSection.PanelHeader>
    </HeaderSection>
  );
};

export default SidebarDebuggerHeader;
