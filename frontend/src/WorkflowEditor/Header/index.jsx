import React from 'react';
import { Link } from 'react-router-dom';
import AppLogo from '@/_components/AppLogo';
import { Modes } from '../reducer/reducer';
import { AppVersionsManager } from '../../Editor/AppVersionsManager/List';

export default function Header(props) {
  const { executeWorkflow, editorSession, updateFlow, editorSessionActions, reloadQueries } = props;

  return (
    <div className="header">
      <div className="grid">
        <div className="row" style={{ height: '40px' }}>
          <div className="col-4 d-flex flex-columns align-items-center">
            <div className="logo-section">
              <Link to="/">
                <AppLogo isLoadingFromHeader={true} />
              </Link>
            </div>
            <button
              onClick={executeWorkflow}
              type="button"
              className="btn btn-primary"
              style={{ height: '30px', marginRight: 6 }}
              disabled={editorSession.mode === Modes.Running}
            >
              {editorSession.mode === Modes.Running ? 'Running' : 'Run'}
            </button>
            {editorSession.appSavingStatus.status ? 'Saving..' : 'All changes saved'}
          </div>
          {/* <div className="col-3">
            <AppVersionsManager
              appId={editorSession.app.id}
              editingVersion={{ id: editorSession.app.versionId }}
              releasedVersionId={editorSession.app.releasedVersionId}
              setAppDefinitionFromVersion={(version) => {
                editorSessionActions.setAppVersionId(version.id);
                // editorSessionActions.setQueries(version.definition.queries);
                reloadQueries(version.definition.queries).then(() => {
                  updateFlow({ nodes: version.definition.nodes, edges: version.definition.edges });
                });
              }}
              showCreateVersionModalPrompt={false}
              closeCreateVersionModalPrompt={() => {}}
            />
          </div> */}
        </div>
      </div>
    </div>
  );
}
