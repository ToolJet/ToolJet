import React from 'react';
import Logs from './Logs';
import { useTranslation } from 'react-i18next';
import cx from 'classnames';

const DebuggerTabContent = ({ logs, darkMode, tabName }) => {
  const { t } = useTranslation();
  return (
    <div className="debugger-card-body color-slate12">
      {logs.length === 0 && (
        <center className="p-2">
          {tabName === 'errors'
            ? t(`leftSidebar.Debugger.noErrors`, 'No errors found.')
            : t(`leftSidebar.Debugger.noLogs`, 'No Logs found.')}
        </center>
      )}

      <div
        className={cx('tab-content', {
          'dark-theme': darkMode,
        })}
      >
        {logs.map((error, index) => (
          <Logs key={index} errorProps={error} logProps={error} idx={index} darkMode={darkMode} />
        ))}
      </div>
    </div>
  );
};

const SidebarDebuggerTabs = ({ darkMode, errors, allLog, activeTab }) => {
  return (
    <>
      {activeTab === 'allLog' && (
        <DebuggerTabContent logs={allLog} darkMode={darkMode} tabName={'allLogs'} />
      )}
      {activeTab === 'errors' && (
        <DebuggerTabContent logs={errors} darkMode={darkMode} tabName={'errors'} />
      )}
    </>
  );
};

export default SidebarDebuggerTabs;
