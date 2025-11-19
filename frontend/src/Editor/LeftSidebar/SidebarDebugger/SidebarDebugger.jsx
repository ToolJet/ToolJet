import React from 'react';
import SidebarDebuggerTabs from './SidebarDebuggerTabs';
import SidebarDebuggerHeader from './SidebarDebuggerHeader';

export const LeftSidebarDebugger = ({ darkMode, errors, clearErrorLogs, setPinned, pinned, allLog, toggleLeftSidebar }) => {
  return (
    <div>
      <SidebarDebuggerHeader
        darkMode={darkMode}
        clearErrorLogs={clearErrorLogs}
        setPinned={setPinned}
        pinned={pinned}
        toggleLeftSidebar={toggleLeftSidebar}
      />
      <SidebarDebuggerTabs darkMode={darkMode} errors={errors} allLog={allLog} />
    </div>
  );
};
