import React from 'react';
import UpIcon from './up.svg';
import DownIcon from './down.svg';

import './styles.scss';

export default function LogsPanel({ editorSession, editorSessionActions }) {
  const logs = editorSession.logsConsole.logs;

  return (
    <div className="logs-panel workflow-logs-panel">
      <div className="header" onClick={editorSessionActions.toggleLogsConsole}>
        <span>Logs</span>
        <div className="up-icon">{editorSession.logsConsole.display ? <DownIcon /> : <UpIcon />}</div>
      </div>
      {editorSession.logsConsole.display && (
        <div className="logs-console">
          {Array.isArray(logs) &&
            logs.map((log, index) => (
              <span key={index}>
                {JSON.stringify(log)}
                <br />
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
