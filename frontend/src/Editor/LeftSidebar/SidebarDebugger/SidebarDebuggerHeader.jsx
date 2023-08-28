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
            leftIcon="alignright"
            variant="tertiary"
            className="tj-text-sm left-sidebar-header-btn"
            style={{ width: '76px', height: '28px' }}
            iconWidth="20"
            title={'Clear'}
            fill={`var(--slate12)`}
          >
            Clear
          </ButtonSolid>
          <ButtonSolid
            title={`${pinned ? 'Unpin' : 'Pin'}`}
            onClick={() => setPinned(!pinned)}
            variant="tertiary"
            leftIcon={pinned ? 'unpin' : 'pin'}
            iconWidth="14"
            className="left-sidebar-header-btn"
            fill={`var(--slate12)`}
          ></ButtonSolid>
        </div>
      </HeaderSection.PanelHeader>
    </HeaderSection>
  );
};

export default SidebarDebuggerHeader;
