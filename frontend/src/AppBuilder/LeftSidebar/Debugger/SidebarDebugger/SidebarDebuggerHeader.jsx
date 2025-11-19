import React from 'react';
import { HeaderSection } from '@/_ui/LeftSidebar';
import _ from 'lodash';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { Button as ButtonComponent } from '@/components/ui/Button/Button';


export const SidebarDebuggerHeader = ({ darkMode, clearErrorLogs, toggleLeftSidebar }) => {
  return (
    <HeaderSection darkMode={darkMode}>
      <HeaderSection.PanelHeader title="Debugger">
        <div className="d-flex justify-content-end" style={{ gap: '2px' }}>
          <ButtonComponent
            iconOnly
            leadingIcon={'trash'}
            onClick={clearErrorLogs}
            variant="ghost"
            fill="var(--icon-strong,#6A727C)"
            size="medium"
            isLucid={true}
          />
          <ButtonComponent
            iconOnly
            leadingIcon={'x'}
            onClick={() => toggleLeftSidebar(false)}
            variant="ghost"
            fill="var(--icon-strong,#6A727C)"
            size="medium"
            data-cy="left-sidebar-close-button"
            isLucid={true}
          />
        </div>
      </HeaderSection.PanelHeader>
    </HeaderSection>
  );
};

export default SidebarDebuggerHeader;
