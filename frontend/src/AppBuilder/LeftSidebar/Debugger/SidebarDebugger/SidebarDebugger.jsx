import React, { useState } from 'react';
import SidebarDebuggerTabs from './SidebarDebuggerTabs';
import SidebarDebuggerHeader from './SidebarDebuggerHeader';

export const LeftSidebarDebugger = ({ darkMode, errors, clearErrorLogs, onClose, allLog }) => {
  const [activeTab, setActiveTab] = useState('allLog');

  return (
    <div>
      <SidebarDebuggerHeader
        darkMode={darkMode}
        onClear={clearErrorLogs}
        onClose={onClose}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <SidebarDebuggerTabs darkMode={darkMode} errors={errors} allLog={allLog} activeTab={activeTab} />
    </div>
  );
};
