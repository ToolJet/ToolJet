import React from 'react';
import HistoryIcon from './icons/history.svg';
import RunItem from './RunItem';

import './styles.scss';

export default function LeftSidebar(props) {
  const { editorSession, editorSessionActions } = props;
  return (
    <div className="left-sidebar-container workflow-sidebar">
      <div className="left-sidebar">
        <div className="icon" onClick={() => editorSessionActions.toggleLeftDrawer((prevValue) => !prevValue)}>
          <HistoryIcon className={editorSession.leftDrawer?.display ? 'active' : ''} />
        </div>
      </div>
      {editorSession.leftDrawer?.display && (
        <div
          className="left-sidebar-drawer"
          onWheel={(event) => {
            event.stopPropagation();
            event.preventDefault();
          }}
        >
          <div className="container p-0">
            <div className="row title-row">
              <div className="col">
                <p className="title-text">Run history</p>
              </div>
            </div>
            <div className="row list-row">
              <div className="col">
                {editorSession.executionHistory.map((run) => (
                  <RunItem run={run} onClick={() => editorSessionActions.showHistoricalLogs(run.id)} key={run.id} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
