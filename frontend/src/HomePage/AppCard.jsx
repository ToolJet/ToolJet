import React, { useState } from 'react';
import { AppMenu } from './AppMenu';
import { history } from '@/_helpers';
import moment from 'moment';

export default function AppCard(props) {
  const { app, canUpdateApp } = props;
  const canUpdate = canUpdateApp(app);

  const [focused, setFocused] = useState(false);

  return (
    <div
      className={`app-card mb-2 mx-1 p-2 ${focused ? 'highlight' : ''}`}
      key={app.id}
      onMouseEnter={() => setFocused(true)}
      onMouseLeave={() => setFocused(false)}
    >
      <div className="row no-gutters mb-3">
        <div className="col-10">
          <br />
        </div>
        <div className="col-2">
          {(props.canCreateApp(app) || props.canDeleteApp(app)) && (
            <AppMenu
              app={app}
              canCreateApp={props.canCreateApp()}
              canDeleteApp={props.canDeleteApp(app)}
              folders={props.folders}
              foldersChanged={props.foldersChanged}
              deleteApp={() => props.deleteApp(app)}
              cloneApp={() => props.cloneApp(app)}
              exportApp={() => props.exportApp(app)}
            />
          )}
        </div>
      </div>
      <div className="ps-2">
        <div className="app-title">{app.name}</div>
        <span className="app-creator">
          {app.user?.first_name} {app.user?.last_name}
        </span>
        <br />
        <span className="pt app-creation-time">{moment(app.created_at).fromNow(true)} ago</span>
      </div>
      {focused && (
        <>
          <div className="container-fluid d-flex flex-column align-content-center px-0 mt-2">
            <div className="row">
              {canUpdate && (
                <div className="col-6 pe-1">
                  <button
                    type="button"
                    className="btn btn-sm btn-light edit-button"
                    style={{ width: '100%' }}
                    onClick={() => history.push(`/apps/${app.id}`)}
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="Open in app builder"
                  >
                    Edit
                  </button>
                </div>
              )}
              <div
                className={`col-${canUpdate ? '6' : '12'} ps-1`}
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title={app?.current_version_id === null ? 'App does not have a deployed version' : 'Open in app viewer'}
                style={{ marginLeft: `${canUpdate ? '0px' : '2px'}` }}
              >
                <button
                  type="button"
                  className="btn btn-sm btn-primary launch-button"
                  disabled={app?.current_version_id === null}
                  style={{ width: '100%' }}
                  onClick={() => {
                    if (app?.current_version_id) {
                      window.open(`/applications/${app.slug}`);
                    } else {
                      history.push(app?.current_version_id ? `/applications/${app.slug}` : '');
                    }
                  }}
                >
                  Launch
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
