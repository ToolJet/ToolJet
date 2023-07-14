import React from 'react';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import ErrorLogs from './ErrorLogs';
import AllLogs from './AllLogs';
import { useTranslation } from 'react-i18next';

const DebuggerTabContent = ({ logs, LogsComponent, darkMode }) => {
  const { t } = useTranslation();
  return (
    <div className="card-body mb-5">
      {logs.length === 0 && (
        <center className="p-2 text-muted">{t(`leftSidebar.Debugger.noErrors`, 'No errors found.')}</center>
      )}

      <div className="tab-content">
        {logs.map((error, index) => (
          <LogsComponent key={index} errorProps={error} idx={index} darkMode={darkMode} />
        ))}
      </div>
    </div>
  );
};

const SidebarDebuggerTabs = ({ darkMode, errors }) => {
  return (
    <Tabs defaultActiveKey="allLog" id="sidebar-debugger" className="mb-3" justify>
      <Tab eventKey="allLog" title="All Log">
        <DebuggerTabContent logs={errors} LogsComponent={AllLogs} darkMode={darkMode} />
      </Tab>
      <Tab eventKey="errors" title="Errors">
        <DebuggerTabContent logs={errors} LogsComponent={ErrorLogs} darkMode={darkMode} />
      </Tab>
    </Tabs>
  );
};

export default SidebarDebuggerTabs;
