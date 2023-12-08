import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLogo from '@/_components/AppLogo';
import EditAppName from './EditAppName';
import HeaderActions from './HeaderActions';
import RealtimeAvatars from '../RealtimeAvatars';
import { AppVersionsManager } from '../AppVersionsManager/List';
import { ManageAppUsers } from '../ManageAppUsers';
import { ReleaseVersionButton } from '../ReleaseVersionButton';
import cx from 'classnames';
import config from 'config';
// eslint-disable-next-line import/no-unresolved
import { useUpdatePresence } from '@y-presence/react';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { useCurrentStateStore } from '@/_stores/currentStateStore';
import { shallow } from 'zustand/shallow';
import { useAppDataActions, useAppInfo, useCurrentUser } from '@/_stores/appDataStore';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { redirectToDashboard } from '@/_helpers/routes';
import queryString from 'query-string';
import { isEmpty } from 'lodash';

export default function EditorHeader({
  M,
  canUndo,
  canRedo,
  handleUndo,
  handleRedo,
  saveError,
  onNameChanged,
  setAppDefinitionFromVersion,
  onVersionRelease,
  saveEditingVersion,
  onVersionDelete,
  slug,
  darkMode,
}) {
  const currentUser = useCurrentUser();

  const { isSaving, appId, appName, app, isPublic, appVersionPreviewLink, currentVersionId } = useAppInfo();
  const { setAppPreviewLink } = useAppDataActions();
  const { isVersionReleased, editingVersion } = useAppVersionStore(
    (state) => ({
      isVersionReleased: state.isVersionReleased,
      editingVersion: state.editingVersion,
    }),
    shallow
  );
  const { pageHandle } = useCurrentStateStore(
    (state) => ({
      pageHandle: state?.page?.handle,
    }),
    shallow
  );

  const updatePresence = useUpdatePresence();

  useEffect(() => {
    const initialPresence = {
      firstName: currentUser?.first_name ?? '',
      lastName: currentUser?.last_name ?? '',
      email: currentUser?.email ?? '',
      image: '',
      editingVersionId: '',
      x: 0,
      y: 0,
      color: '',
    };
    updatePresence(initialPresence);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleLogoClick = (e) => {
    e.preventDefault();
    // Force a reload for clearing interval triggers
    redirectToDashboard();
  };

  useEffect(() => {
    const previewQuery = queryString.stringify({ version: editingVersion.name });
    const appVersionPreviewLink = editingVersion.id
      ? `/applications/${slug || appId}/${pageHandle}${!isEmpty(previewQuery) ? `?${previewQuery}` : ''}`
      : '';
    setAppPreviewLink(appVersionPreviewLink);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, currentVersionId, editingVersion]);

  return (
    <div className="header" style={{ width: '100%' }}>
      <header className="navbar navbar-expand-md d-print-none">
        <div className="container-xl header-container">
          <div className="d-flex w-100">
            <h1 className="navbar-brand d-none-navbar-horizontal p-0">
              <Link data-cy="editor-page-logo" onClick={handleLogoClick}>
                <AppLogo isLoadingFromHeader={true} />
              </Link>
            </h1>
            <div
              style={{
                maxHeight: '48px',
                margin: '0px',
                padding: '0px',
                width: 'calc(100% - 348px)',
                justifyContent: 'space-between',
              }}
              className="flex-grow-1 d-flex align-items-center"
            >
              <div
                className="p-0 m-0 d-flex align-items-center"
                style={{
                  padding: '0px',
                  width: '100%',
                  justifyContent: 'space-between',
                }}
              >
                <div className="global-settings-app-wrapper p-0 m-0 ">
                  <EditAppName appId={appId} appName={appName} onNameChanged={onNameChanged} />
                </div>
                <HeaderActions canUndo={canUndo} canRedo={canRedo} handleUndo={handleUndo} handleRedo={handleRedo} />
                <div className="d-flex align-items-center">
                  <div style={{ width: '100px', marginRight: '20px' }}>
                    <span
                      className={cx('autosave-indicator tj-text-xsm', {
                        'autosave-indicator-saving': isSaving,
                        'text-danger': saveError,
                        'd-none': isVersionReleased,
                      })}
                      data-cy="autosave-indicator"
                    >
                      {isSaving ? (
                        'Saving...'
                      ) : saveError ? (
                        <div className="d-flex align-items-center" style={{ gap: '4px' }}>
                          <SolidIcon name="cloudinvalid" width="14" />
                          <p className="mb-0 text-center tj-text-xxsm">Could not save changes</p>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center" style={{ gap: '4px' }}>
                          <SolidIcon name="cloudvalid" width="14" />
                          <p className="mb-0 text-center">Changes saved</p>
                        </div>
                      )}
                    </span>
                  </div>
                  {config.ENABLE_MULTIPLAYER_EDITING && <RealtimeAvatars />}
                </div>
              </div>
              <div className="navbar-seperator"></div>
              <div className="d-flex align-items-center p-0" style={{ marginRight: '12px' }}>
                <div className="d-flex version-manager-container p-0">
                  {editingVersion && (
                    <AppVersionsManager
                      appId={appId}
                      setAppDefinitionFromVersion={setAppDefinitionFromVersion}
                      onVersionDelete={onVersionDelete}
                      isPublic={isPublic ?? false}
                    />
                  )}
                </div>
              </div>
            </div>
            <div
              className="d-flex justify-content-end navbar-right-section"
              style={{ width: '300px', paddingRight: '12px' }}
            >
              <div className="navbar-nav flex-row order-md-last release-buttons ">
                <div className="nav-item">
                  {appId && (
                    <ManageAppUsers
                      app={app}
                      appId={appId}
                      slug={slug}
                      darkMode={darkMode}
                      isVersionReleased={isVersionReleased}
                      pageHandle={pageHandle}
                      M={M}
                      isPublic={isPublic ?? false}
                    />
                  )}
                </div>
                <div className="nav-item">
                  <Link
                    title="Preview"
                    to={appVersionPreviewLink}
                    target="_blank"
                    rel="noreferrer"
                    data-cy="preview-link-button"
                    className="editor-header-icon tj-secondary-btn"
                  >
                    <SolidIcon name="eyeopen" width="14" fill="#3E63DD" />
                  </Link>
                </div>
                <div className="nav-item dropdown">
                  <ReleaseVersionButton
                    appId={appId}
                    appName={appName}
                    onVersionRelease={onVersionRelease}
                    saveEditingVersion={saveEditingVersion}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
