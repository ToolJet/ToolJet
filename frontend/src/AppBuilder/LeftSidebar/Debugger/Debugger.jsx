import React from 'react';
import { LeftSidebarDebugger } from './SidebarDebugger/SidebarDebugger';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

function Debugger({ onClose, darkMode }) {
  const [logs, clearLogs] = useStore(
    (state) => [state.debugger.logs, state.debugger.clear],
    shallow
  );

  const currentPageId = useStore((state) => state.modules.canvas.currentPageId);

  const logsToBeShown = logs.filter((log) => log.page === currentPageId);

  return (
    <div>
      <LeftSidebarDebugger
        darkMode={darkMode}
        errors={logsToBeShown.filter((log) => log.logLevel === 'error')}
        clearErrorLogs={clearLogs}
        onClose={onClose}
        allLog={logs}
      />
    </div>
  );
}

export default Debugger;
