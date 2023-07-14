import React from 'react';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import ErrorLogs from './ErrorLogs';
import AllLogs from './AllLogs';
import { useTranslation } from 'react-i18next';

const SidebarDebuggerTabs = ({ darkMode, errors }) => {
  const { t } = useTranslation();
  return (
    <Tabs defaultActiveKey="allLog" id="justify-tab-example" className="mb-3" justify>
      <Tab eventKey="allLog" title="All Log">
        <div className="card-body mb-5">
          {errors.length === 0 && (
            <center className="p-2 text-muted">{t(`leftSidebar.Debugger.noErrors`, 'No errors found.')}</center>
          )}

          <div className="tab-content">
            {errors.map((error, index) => (
              <AllLogs key={index} errorProps={error} idx={index} darkMode={darkMode} />
            ))}
          </div>
        </div>
      </Tab>
      <Tab eventKey="errors" title="Errors">
        <div className="card-body mb-5">
          {errors.length === 0 && (
            <center className="p-2 text-muted">{t(`leftSidebar.Debugger.noErrors`, 'No errors found.')}</center>
          )}

          <div className="tab-content">
            {errors.map((error, index) => (
              <ErrorLogs key={index} errorProps={error} idx={index} darkMode={darkMode} />
            ))}
          </div>
        </div>
      </Tab>
    </Tabs>
  );
};

export default SidebarDebuggerTabs;
