import React, { useState, useCallback, useEffect } from 'react';
import { AppMenu } from './AppMenu';
import { history } from '@/_helpers';
import moment from 'moment';
import { ToolTip } from '@/_components';
import useHover from '@/_hooks/useHover';
import configs from './Configs/AppIcon.json';
import { Link } from 'react-router-dom';
import urlJoin from 'url-join';
import { useTranslation } from 'react-i18next';
const { defaultIcon } = configs;

export default function AppCard({
  app,
  canCreateApp,
  canDeleteApp,
  deleteApp,
  cloneApp,
  exportApp,
  appActionModal,
  canUpdateApp,
  currentFolder,
}) {
  const canUpdate = canUpdateApp(app);
  const [hoverRef, isHovered] = useHover();
  const [focused, setFocused] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const { t } = useTranslation();

  const onMenuToggle = useCallback(
    (status) => {
      setMenuOpen(!!status);
      !status && !isHovered && setFocused(false);
    },
    [isHovered]
  );

  const appActionModalCallBack = useCallback(
    (action) => {
      appActionModal(app, currentFolder, action);
    },
    [app, appActionModal, currentFolder]
  );

  useEffect(() => {
    !isMenuOpen && setFocused(!!isHovered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHovered]);

  const updated = moment(app.created_at).fromNow(true);
  const darkMode = localStorage.getItem('darkMode') === 'true';

  return (
    <div
      className={`app-card mb-3 p-3 pt-2${focused ? ' highlight' : ''}`}
      key={app.id}
      ref={hoverRef}
      data-cy={`${String(app.name).toLowerCase().replace(/\s+/g, '-')}-card`}
    >
      <div className="row mb-3">
        <div className="col-12 d-flex justify-content-between">
          <div className="pt-2">
            <div className="app-icon-main p-1">
              <div className="app-icon p-1 d-flex">
                <img
                  src={`assets/images/icons/app-icons/${app.icon || defaultIcon}.svg`}
                  alt="Application Icon"
                  data-cy={`app-card-${app.icon || defaultIcon}-icon`}
                />
              </div>
            </div>
          </div>
          <div className="pt-1">
            {(canCreateApp(app) || canDeleteApp(app)) && (
              <AppMenu
                onMenuOpen={onMenuToggle}
                openAppActionModal={appActionModalCallBack}
                canCreateApp={canCreateApp()}
                canDeleteApp={canDeleteApp(app)}
                canUpdateApp={canUpdateApp(app)}
                deleteApp={() => deleteApp(app)}
                cloneApp={() => cloneApp(app)}
                exportApp={() => exportApp(app)}
                isMenuOpen={isMenuOpen}
                darkMode={darkMode}
                currentFolder={currentFolder}
              />
            )}
          </div>
        </div>
      </div>
      <div>
        <ToolTip message={app.name}>
          <div className="app-title" data-cy={`${String(app.name).toLowerCase().replace(/\s+/g, '-')}-title`}>
            {app.name}
          </div>
        </ToolTip>
      </div>
      {canUpdate && (
        <div className="py-1">
          <div className="app-creator py-1" data-cy="app-creator">{`${
            app.user?.first_name ? app.user.first_name : ''
          } ${app.user?.last_name ? app.user.last_name : ''}`}</div>
          <div className="app-creation-time" data-cy="app-creation-time">
            <ToolTip message={app.created_at && moment(app.created_at).format('dddd, MMMM Do YYYY, h:mm:ss a')}>
              <span>{updated === 'just now' ? updated : `${updated} ago`}</span>
            </ToolTip>
          </div>
        </div>
      )}
      <div style={{ display: focused ? 'block' : 'none' }}>
        <div className={`container-fluid d-flex flex-column align-content-center px-0 ${canUpdate ? 'mt-1' : 'mt-4'}`}>
          <div className="row">
            {canUpdate && (
              <div className="col-6 pe-1">
                <ToolTip message="Open in app builder">
                  <Link to={`/apps/${app.id}`}>
                    <button type="button" className="btn btn-sm btn-light edit-button" data-cy="edit-button">
                      {t('globals.edit', 'Edit')}
                    </button>
                  </Link>
                </ToolTip>
              </div>
            )}
            <div className={`col-${canUpdate ? '6' : '12'} ps-1`}>
              <ToolTip
                message={
                  app?.current_version_id === null
                    ? t('homePage.appCard.noDeployedVersion', 'App does not have a deployed version')
                    : t('homePage.appCard.openInAppViewer', 'Open in app viewer')
                }
              >
                <span>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary launch-button"
                    disabled={app?.current_version_id === null || app?.is_maintenance_on}
                    onClick={() => {
                      if (app?.current_version_id) {
                        window.open(urlJoin(window.public_config?.TOOLJET_HOST, `/applications/${app.slug}`));
                      } else {
                        history.push(app?.current_version_id ? `/applications/${app.slug}` : '');
                      }
                    }}
                    data-cy="launch-button"
                  >
                    {app?.is_maintenance_on
                      ? t('homePage.appCard.maintenance', 'Maintenance')
                      : t('homePage.appCard.launch', 'Launch')}
                  </button>
                </span>
              </ToolTip>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
