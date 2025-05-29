import React, { useMemo } from 'react';
import { HeaderSection } from '@/_ui/LeftSidebar';
import { LeftSidebarDebugger } from '@/Editor/LeftSidebar/SidebarDebugger/SidebarDebugger';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

function Debugger({ pinned, setPinned }) {
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
      />
    </div>
  );
}

export default Debugger;
