import React, { useState } from 'react';
import SidebarDebuggerTabs from './SidebarDebuggerTabs';
import SidebarDebuggerHeader from './SidebarDebuggerHeader';

export const LeftSidebarDebugger = ({ darkMode, errors, clearErrorLogs, setPinned, pinned, allLog, toggleLeftSidebar }) => {
  const [activeTab, setActiveTab] = useState('allLog');

  return (
    <div>
      <SidebarDebuggerHeader
        darkMode={darkMode}
        clearErrorLogs={clearErrorLogs}
        setPinned={setPinned}
        pinned={pinned}
        toggleLeftSidebar={toggleLeftSidebar}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      <SidebarDebuggerTabs darkMode={darkMode} errors={errors} allLog={allLog} activeTab={activeTab} />
    </div>
  );
};
