import React, { useState } from 'react';
import { AppMenu } from './AppMenu';
// import { Link } from 'react-router-dom';
// import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
// import { renderTooltip } from '@/_helpers/appUtils';
import moment from 'moment';

export default function AppCard(props) {
  const { app } = props;

  const [focused, setFocused] = useState(false);

  return (
    <div
      className={`app-card m-2 p-2 ${focused ? 'highlight' : ''}`}
      key={app.id}
      onMouseEnter={() => setFocused(true)}
      onMouseLeave={() => setFocused(false)}
    >
      <div className="row no-gutters">
        <div className="col-10">
          <span className="app-title mb-3">{app.name}</span>
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
      <small className="pt-2 app-description">
        created {moment(app.created_at).fromNow(true)} ago by {app.user?.first_name} {app.user?.last_name}{' '}
      </small>
      <div className="text-muted">
        {/* {!props.isLoading && props.canUpdateApp(app) && (
          <Link to={`/apps/${app.id}`} className="d-none d-lg-inline">
            <OverlayTrigger
              placement="top"
              overlay={(props) =>
                renderTooltip({
                  props,
                  text: 'Open in app builder',
                })
              }
            >
              <span className="badge bg-green-lt">Edit</span>
            </OverlayTrigger>
          </Link>
        )} */}
        {/* <Link
          to={app?.current_version_id ? `/applications/${app.slug}` : ''}
          target={app?.current_version_id ? '_blank' : ''}
        >
          {!props.darkMode && (
            <OverlayTrigger
              placement="top"
              overlay={(props) =>
                renderTooltip({
                  props,
                  text:
                    app?.current_version_id === null ? 'App does not have a deployed version' : 'Open in app viewer',
                })
              }
            >
              {
                <span className={`${app?.current_version_id ? 'badge bg-blue-lt mx-2 ' : 'badge bg-light-grey mx-2'}`}>
                  launch{' '}
                </span>
              }
            </OverlayTrigger>
          )}
          {props.darkMode && (
            <OverlayTrigger
              placement="top"
              overlay={(props) =>
                renderTooltip({
                  props,
                  text:
                    app?.current_version_id === null ? 'App does not have a deployed version' : 'Open in app viewer',
                })
              }
            >
              {
                <span
                  className={`${
                    app?.current_version_id === null ? 'badge launch-btn mx-2 ' : 'badge launch-btn bg-azure-lt mx-2'
                  }`}
                  style={{
                    filter: app?.current_version_id === null ? 'brightness(0.3)' : 'brightness(1) invert(1)',
                  }}
                >
                  launch{' '}
                </span>
              }
            </OverlayTrigger>
          )}
        </Link> */}
      </div>
    </div>
  );
}
