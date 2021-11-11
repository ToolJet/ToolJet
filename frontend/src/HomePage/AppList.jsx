import React from 'react';
import { AppMenu } from './AppMenu';
import { Link } from 'react-router-dom';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { renderTooltip } from '@/_helpers/appUtils';
import moment from 'moment';
import _ from 'lodash';

const AppList = (props) => {
  return (
    <div style={{ minHeight: '600px' }} className="app-list">
      {props.isLoading && (
        <>
          {Array.from(Array(10)).map((index) => (
            <tr className="row" key={index}>
              <td className="col-3 p-3">
                <div className="skeleton-line w-10"></div>
                <div className="skeleton-line w-10"></div>
              </td>
              <td className="col p-3"></td>
              <td className="text-muted col-auto col-1 pt-4">
                <div className="skeleton-line"></div>
              </td>
              <td className="text-muted col-auto col-1 pt-4">
                <div className="skeleton-line"></div>
              </td>
            </tr>
          ))}
        </>
      )}

      {props.meta.total_count > 0 && (
        <div className="container px-0">
          {_.chunk(props.apps, 5).map((fiveApps, index) => (
            <div className="row" key={index}>
              {fiveApps.map((app) => (
                <div className="app-card col m-2 p-2" key={app.id}>
                  <span className="app-title mb-3">{app.name}</span>
                  <br />
                  <small className="pt-2 app-description">
                    created {moment(app.created_at).fromNow(true)} ago by {app.user?.first_name} {app.user?.last_name}{' '}
                  </small>
                  <div className="text-muted">
                    {!props.isLoading && props.canUpdateApp(app) && (
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
                    )}
                    <Link
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
                                app?.current_version_id === null
                                  ? 'App does not have a deployed version'
                                  : 'Open in app viewer',
                            })
                          }
                        >
                          {
                            <span
                              className={`${
                                app?.current_version_id ? 'badge bg-blue-lt mx-2 ' : 'badge bg-light-grey mx-2'
                              }`}
                            >
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
                                app?.current_version_id === null
                                  ? 'App does not have a deployed version'
                                  : 'Open in app viewer',
                            })
                          }
                        >
                          {
                            <span
                              className={`${
                                app?.current_version_id === null
                                  ? 'badge launch-btn mx-2 '
                                  : 'badge launch-btn bg-azure-lt mx-2'
                              }`}
                              style={{
                                filter:
                                  app?.current_version_id === null ? 'brightness(0.3)' : 'brightness(1) invert(1)',
                              }}
                            >
                              launch{' '}
                            </span>
                          }
                        </OverlayTrigger>
                      )}
                    </Link>

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
              ))}
            </div>
          ))}
        </div>
      )}
      {props.currentFolder.count === 0 && (
        <div>
          <img className="mx-auto d-block" src="assets/images/icons/empty-folder-svgrepo-com.svg" height="120px" />
          <span className="d-block text-center text-body">This folder is empty</span>
        </div>
      )}
    </div>
  );
};

export default AppList;
