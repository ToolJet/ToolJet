import React from 'react';
import { LeftSidebarDebugger } from './SidebarDebugger/SidebarDebugger';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

function Debugger({ pinned, setPinned, toggleLeftSidebar }) {
  const [logs, clearLogs] = useStore(
    (state) => [state.debugger.logs, state.debugger.clear, state.debugger.pinned, state.debugger.setPinned],
    shallow
  );

  const currentPageId = useStore((state) => state.modules.canvas.currentPageId);

  const logsToBeShown = logs.filter((log) => log.page === currentPageId);

  return (
    <div>
      <LeftSidebarDebugger
        darkMode={false}
        errors={logsToBeShown.filter((log) => log.logLevel === 'error')}
        clearErrorLogs={clearLogs}
        setPinned={setPinned}
        pinned={pinned}
        allLog={logs}
        toggleLeftSidebar={toggleLeftSidebar}
      />
    </div>
  );
}

export default Debugger;
