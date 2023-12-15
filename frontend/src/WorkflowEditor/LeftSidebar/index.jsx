import React from 'react';
import HistoryIcon from './icons/history.svg';
import TriggerIcon from './icons/trigger.svg';
import WebhookIcon from './icons/webhook.svg';
import RunItem from './RunItem';
import Trigger from './Trigger';

import './styles.scss';

export default function LeftSidebar(props) {
  const { editorSession, editorSessionActions } = props;

  const toggleDisplay = (displayType) => {
    if (editorSession.leftDrawer.display === '') {
      editorSessionActions.toggleLeftDrawer(displayType);
    } else {
      editorSessionActions.toggleLeftDrawer('');
    }
  };

  return (
    <div className="left-sidebar-container workflow-sidebar">
      <div className="left-sidebar">
        <div className="icon" onClick={() => toggleDisplay('run')}>
          <HistoryIcon className={editorSession.leftDrawer?.display === 'run' ? 'active' : ''} />
        </div>

        {window?.public_config?.DISABLE_WEBHOOKS !== 'true' && (
          <div
            className={`icon-trigger ${editorSession.leftDrawer?.display === 'trigger' ? 'icon-trigger-active' : ''}`}
            onClick={() => toggleDisplay('trigger')}
          >
            {editorSession.leftDrawer?.display === 'trigger' ? <TriggerIcon /> : <WebhookIcon />}
          </div>
        )}
      </div>

      {editorSession.leftDrawer?.display === 'run' && (
        <div
          className="left-sidebar-drawer"
          onWheel={(event) => {
            event.stopPropagation();
            event.preventDefault();
          }}
          style={{ marginLeft: '0.5px' }}
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

      <Trigger editorSession={editorSession} editorSessionActions={editorSessionActions} />
    </div>
  );
}
