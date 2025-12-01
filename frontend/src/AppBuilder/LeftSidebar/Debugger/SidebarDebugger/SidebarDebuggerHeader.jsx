import React from 'react';
import { HeaderSection } from '@/_ui/LeftSidebar';
import { Button as ButtonComponent } from '@/components/ui/Button/Button';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import cx from 'classnames';
import './styles.scss';


export const SidebarDebuggerHeader = ({ darkMode, clearErrorLogs, toggleLeftSidebar, activeTab, setActiveTab }) => {
  return (
    <HeaderSection darkMode={darkMode} className="">
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
      <Tabs
        defaultActiveKey="allLog"
        activeKey={activeTab}
        onSelect={setActiveTab}
        id="sidebar-debugger"
        className={cx('sidebar-debugger', {
          'dark-theme': darkMode,
        })}
        justify
      >
        <Tab eventKey="allLog" title="All Log" className='debugger-tab' />
        <Tab eventKey="errors" title="Errors" />
      </Tabs>
    </HeaderSection>
  );
};

export default SidebarDebuggerHeader;
