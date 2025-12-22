import React from 'react';
import SidebarDebuggerTabs from './SidebarDebuggerTabs';
import SidebarDebuggerHeader from './SidebarDebuggerHeader';

export const LeftSidebarDebugger = ({ darkMode, errors, clearErrorLogs, setPinned, pinned, allLog }) => {
  return (
    <div>
      <SidebarDebuggerHeader
        darkMode={darkMode}
        clearErrorLogs={clearErrorLogs}
        setPinned={setPinned}
        pinned={pinned}
      />
      <SidebarDebuggerTabs darkMode={darkMode} errors={errors} allLog={allLog} />
    </div>
  );
};
