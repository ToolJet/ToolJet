import React, { useState } from 'react';
import HistoryIcon from './icons/history.svg';

export default function LeftSidebar(props) {
  const [displayDrawer, setDisplayDrawer] = useState(false);

  const { editorSession, _editorSessionActions } = props;
  return (
    <div className="left-sidebar">
      <div className="icon" onClick={() => setDisplayDrawer((prevValue) => !prevValue)}>
        <HistoryIcon />
      </div>
      {displayDrawer && (
        <div className="drawer">
          <div className="container p-0">
            <div className="row title-row">
              <div className="col">
                <p className="title-text">Run history</p>
              </div>
            </div>
            <div className="row list-row">
              <div className="col">
                {editorSession.executionHistory.map((run) => (
                  <div className="run-item" key={run.id}>
                    {run.createdAt}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
