import React, { useState, useCallback, useEffect } from 'react';
import cx from 'classnames';
import { AppMenu } from './AppMenu';
import { history } from '@/_helpers';
import moment from 'moment';
import { ToolTip } from '@/_components';
import { Fade } from '@/_ui/Fade';
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
    <div className="card homepage-app-card animation-fade">
      <div
        className={`p-3 pt-2`}
        key={app.id}
        ref={hoverRef}
        data-cy={`${app.name.toLowerCase().replace(/\s+/g, '-')}-card`}
      >
        <div className="row mb-4 home-app-card-header">
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
            <Fade visible={focused} className="pt-1">
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
            </Fade>
          </div>
        </div>
        <div>
          <ToolTip message={app.name}>
            <h3 className="app-card-name" data-cy={`${app.name.toLowerCase().replace(/\s+/g, '-')}-title`}>
              {app.name}
            </h3>
          </ToolTip>
        </div>
        {canUpdate && (
          <div>
            <div className="app-creation-time mute-text" data-cy="app-creation-time">
              <ToolTip message={app.created_at && moment(app.created_at).format('dddd, MMMM Do YYYY, h:mm:ss a')}>
                <span>{updated === 'just now' ? `Edited ${updated}` : `Edited ${updated} ago`}</span>
              </ToolTip>
              &nbsp;by{' '}
              {`${app.user?.first_name ? app.user.first_name : ''} ${app.user?.last_name ? app.user.last_name : ''}`}
            </div>
          </div>
        )}
        <Fade visible={focused} className="row mt-2">
          {canUpdate && (
            <div className="col-7">
              <ToolTip message="Open in app builder">
                <Link to={`/apps/${app.id}`}>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary w-100 rounded-2 edit-button"
                    data-cy="edit-button"
                  >
                    <svg width="15" height="14" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M10.2467 1.69584C10.5858 1.35698 11.0456 1.16663 11.525 1.16663C12.0046 1.16663 12.4646 1.35715 12.8037 1.69629C13.1429 2.03543 13.3334 2.49541 13.3334 2.97502C13.3334 3.4545 13.143 3.91435 12.804 4.25346C12.8039 4.25356 12.8041 4.25337 12.804 4.25346L12.0667 4.99339C12.0462 5.02363 12.0226 5.05238 11.9958 5.07917C11.9695 5.10544 11.9414 5.12869 11.9118 5.1489L7.91322 9.16176C7.80376 9.27161 7.65507 9.33336 7.5 9.33336H5.75C5.42783 9.33336 5.16667 9.07219 5.16667 8.75002V7.00002C5.16667 6.84495 5.22841 6.69626 5.33826 6.58681L9.35112 2.58825C9.37133 2.55865 9.39458 2.53049 9.42086 2.50421C9.44764 2.47742 9.47639 2.45378 9.50663 2.43329L10.2463 1.69629C10.2464 1.69614 10.2466 1.69599 10.2467 1.69584ZM9.83989 3.7482L6.33333 7.24226V8.16669H7.25777L10.7518 4.66013L9.83989 3.7482ZM11.5753 3.8337L10.6663 2.92472L11.0712 2.52125C11.1916 2.4009 11.3548 2.33329 11.525 2.33329C11.6952 2.33329 11.8584 2.4009 11.9788 2.52125C12.0991 2.6416 12.1667 2.80482 12.1667 2.97502C12.1667 3.14522 12.0991 3.30845 11.9788 3.42879L11.5753 3.8337ZM2.76256 4.01259C3.09075 3.6844 3.53587 3.50002 4 3.50002H4.58333C4.9055 3.50002 5.16667 3.76119 5.16667 4.08336C5.16667 4.40552 4.9055 4.66669 4.58333 4.66669H4C3.84529 4.66669 3.69692 4.72815 3.58752 4.83754C3.47812 4.94694 3.41667 5.09531 3.41667 5.25002V10.5C3.41667 10.6547 3.47812 10.8031 3.58752 10.9125C3.69692 11.0219 3.84529 11.0834 4 11.0834H9.25C9.40471 11.0834 9.55308 11.0219 9.66248 10.9125C9.77188 10.8031 9.83333 10.6547 9.83333 10.5V9.91669C9.83333 9.59452 10.0945 9.33336 10.4167 9.33336C10.7388 9.33336 11 9.59452 11 9.91669V10.5C11 10.9642 10.8156 11.4093 10.4874 11.7375C10.1592 12.0656 9.71413 12.25 9.25 12.25H4C3.53587 12.25 3.09075 12.0656 2.76256 11.7375C2.43437 11.4093 2.25 10.9642 2.25 10.5V5.25002C2.25 4.78589 2.43437 4.34077 2.76256 4.01259Z"
                        fill="#FBFCFD"
                      />
                    </svg>
                    &nbsp;{t('globals.edit', 'Edit')}
                  </button>
                </Link>
              </ToolTip>
            </div>
          )}
          <div
            className={cx({
              'col-5': canUpdate,
              'col-12': !canUpdate,
            })}
          >
            <ToolTip
              message={
                app?.current_version_id === null
                  ? t('homePage.appCard.noDeployedVersion', 'App does not have a deployed version')
                  : t('homePage.appCard.openInAppViewer', 'Open in app viewer')
              }
            >
              <button
                type="button"
                className={cx(`btn btn-sm w-100 btn-light rounded-2 launch-button`)}
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
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M3.50008 2.91667C3.34537 2.91667 3.197 2.97812 3.0876 3.08752C2.97821 3.19692 2.91675 3.34529 2.91675 3.5V7C2.91675 7.32217 2.65558 7.58333 2.33341 7.58333C2.01125 7.58333 1.75008 7.32217 1.75008 7V3.5C1.75008 3.03587 1.93446 2.59075 2.26264 2.26256C2.59083 1.93437 3.03595 1.75 3.50008 1.75H10.5001C10.9642 1.75 11.4093 1.93437 11.7375 2.26256C12.0657 2.59075 12.2501 3.03587 12.2501 3.5V10.5C12.2501 10.9641 12.0657 11.4092 11.7375 11.7374C11.4093 12.0656 10.9642 12.25 10.5001 12.25H7.00008C6.67791 12.25 6.41675 11.9888 6.41675 11.6667C6.41675 11.3445 6.67791 11.0833 7.00008 11.0833H10.5001C10.6548 11.0833 10.8032 11.0219 10.9126 10.9125C11.022 10.8031 11.0834 10.6547 11.0834 10.5V3.5C11.0834 3.34529 11.022 3.19692 10.9126 3.08752C10.8032 2.97812 10.6548 2.91667 10.5001 2.91667H3.50008ZM7.00008 5.25C6.67791 5.25 6.41675 4.98883 6.41675 4.66667C6.41675 4.3445 6.67791 4.08333 7.00008 4.08333H9.33341C9.65558 4.08333 9.91675 4.3445 9.91675 4.66667V7C9.91675 7.32217 9.65558 7.58333 9.33341 7.58333C9.01125 7.58333 8.75008 7.32217 8.75008 7V6.07496L6.82923 7.99581C6.60142 8.22362 6.23207 8.22362 6.00427 7.99581C5.77646 7.76801 5.77646 7.39866 6.00427 7.17085L7.92512 5.25H7.00008ZM1.16675 9.91667C1.16675 9.27233 1.68908 8.75 2.33341 8.75H4.08341C4.72775 8.75 5.25008 9.27233 5.25008 9.91667V11.6667C5.25008 12.311 4.72775 12.8333 4.08341 12.8333H2.33341C1.68908 12.8333 1.16675 12.311 1.16675 11.6667V9.91667ZM4.08341 9.91667H2.33341V11.6667H4.08341V9.91667Z"
                    fill="#121212"
                  />
                </svg>
                &nbsp;
                {app?.is_maintenance_on
                  ? t('homePage.appCard.maintenance', 'Maintenance')
                  : t('homePage.appCard.launch', 'Launch')}
              </button>
            </ToolTip>
          </div>
        </Fade>
      </div>
    </div>
  );
}
