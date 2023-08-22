import React from 'react';
import { HeaderSection } from '@/_ui/LeftSidebar';
import _ from 'lodash';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

export const SidebarDebuggerHeader = ({ darkMode, clearErrorLogs, setPinned, pinned }) => {
  return (
    <HeaderSection darkMode={darkMode}>
      <HeaderSection.PanelHeader title="Debugger">
        <div className="d-flex justify-content-end" style={{ gap: '2px' }}>
          <ButtonSolid
            onClick={clearErrorLogs}
            leftIcon="remove"
            variant="tertiary"
            className="tj-text-sm"
            style={{ width: '76px', height: '28px' }}
            iconWidth="20"
            title={'Clear'}
          >
            Clear
          </ButtonSolid>
          <ButtonSolid
            title={`${pinned ? 'Unpin' : 'Pin'}`}
            onClick={() => setPinned(!pinned)}
            variant="tertiary"
            style={{ width: '28px', height: '28px', padding: 0 }}
            leftIcon={pinned ? 'pin' : 'unpin'}
            iconWidth="20"
          ></ButtonSolid>
        </div>
      </HeaderSection.PanelHeader>
    </HeaderSection>
  );
};

export default SidebarDebuggerHeader;
