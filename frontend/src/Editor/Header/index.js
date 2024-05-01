import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EditAppName from './EditAppName';
import HeaderActions from './HeaderActions';
import RealtimeAvatars from '../RealtimeAvatars';
import EnvironmentManager from '../EnvironmentsManager';
import { AppVersionsManager } from '@/Editor/AppVersionsManager/AppVersionsManager';
import { ManageAppUsers } from '../ManageAppUsers';
import { ReleaseVersionButton } from '../ReleaseVersionButton';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { ToolTip } from '@/_components/ToolTip';
import PromoteConfirmationModal from '../EnvironmentsManager/PromoteConfirmationModal';
import cx from 'classnames';
import { useAppVersionState, useAppVersionStore } from '@/_stores/appVersionStore';
import { useCurrentStateStore } from '@/_stores/currentStateStore';
import { shallow } from 'zustand/shallow';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { LicenseTooltip } from '@/LicenseTooltip';
import { useAppInfo, useCurrentUser, useAppDataActions } from '@/_stores/appDataStore';
import UpdatePresence from './UpdatePresence';
import { useEditorActions, useEditorState } from '@/_stores/editorStore';
import { isEmpty } from 'lodash';
import queryString from 'query-string';
import LogoNavDropdown from '@/_components/LogoNavDropdown';

export default function EditorHeader({
  M,
  canUndo,
  canRedo,
  handleUndo,
  handleRedo,
  saveError,
  onNameChanged,
  appEnvironmentChanged,
  setAppDefinitionFromVersion,
  onVersionRelease,
  saveEditingVersion,
  onVersionDelete,
  slug,
  toggleGitSyncModal,
  darkMode,
  setCurrentAppVersionPromoted,
  fetchEnvironments,
  isEditorFreezed,
}) {
  const currentUser = useCurrentUser();
  const {
    isSaving,
    appId,
    appName,
    app,
    isPublic,
    appVersionPreviewLink,
    environments,
    creationMode,
    currentVersionId,
  } = useAppInfo();
  const { featureAccess, currentAppEnvironment, currentAppEnvironmentId } = useEditorState();
  const { currentAppVersionEnvironment } = useAppVersionState();
  const { setCurrentAppEnvironmentId } = useEditorActions();
  const { setAppPreviewLink } = useAppDataActions();

  const [promoteModalData, setPromoteModalData] = useState(null);

  let licenseValid = !featureAccess?.licenseStatus?.isExpired && featureAccess?.licenseStatus?.isLicenseValid;
  const shouldEnableMultiplayer = featureAccess?.multiPlayerEdit === true;

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

  const handlePromote = () => {
    const curentEnvIndex = environments.findIndex((env) => env.id === currentAppEnvironmentId);

    setPromoteModalData({
      current: currentAppEnvironment,
      target: environments[curentEnvIndex + 1],
    });
  };
  // a flag to disable the release button if the current environment is not production
  const shouldDisablePromote =
    environments.length === 0 || isSaving || currentAppEnvironment.priority < currentAppVersionEnvironment.priority;

  const shouldRenderReleaseButton =
    app?.id &&
    (!featureAccess?.multiEnvironment ||
      (featureAccess?.multiEnvironment && currentAppEnvironment?.name === 'production') ||
      isVersionReleased);

  const shouldRenderPromoteButton =
    featureAccess?.multiEnvironment &&
    !isVersionReleased &&
    currentAppEnvironment &&
    currentAppEnvironment.name !== 'production';

  useEffect(() => {
    const previewQuery = queryString.stringify({
      version: editingVersion?.name,
      ...(featureAccess?.multiEnvironment ? { env: currentAppEnvironment?.name } : {}),
    });
    const appVersionPreviewLink = editingVersion.id
      ? `/applications/${slug || appId}/${pageHandle}${!isEmpty(previewQuery) ? `?${previewQuery}` : ''}`
      : '';
    setAppPreviewLink(appVersionPreviewLink);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, currentVersionId, editingVersion, currentAppEnvironmentId, pageHandle]);
  return (
    <div className={cx('header', { 'dark-theme theme-dark': darkMode })} style={{ width: '100%' }}>
      <header className="navbar navbar-expand-md d-print-none">
        <div className="container-xl header-container">
          <div className="d-flex w-100">
            <h1 className="navbar-brand d-none-navbar-horizontal p-0" data-cy="editor-page-logo">
              <LogoNavDropdown darkMode={darkMode} />
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
                  <EditAppName
                    appId={appId}
                    appName={appName}
                    onNameChanged={onNameChanged}
                    appCreationMode={creationMode}
                  />
                </div>
                <HeaderActions
                  canUndo={canUndo}
                  canRedo={canRedo}
                  handleUndo={handleUndo}
                  handleRedo={handleRedo}
                  showToggleLayoutBtn
                  showUndoRedoBtn
                  darkMode={darkMode}
                />
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
                  {shouldEnableMultiplayer && (
                    <div className="mx-2 p-2">
                      <RealtimeAvatars />
                    </div>
                  )}
                  {shouldEnableMultiplayer && <UpdatePresence currentUser={currentUser} />}
                </div>
              </div>
              <div className="navbar-seperator"></div>
              <div className="d-flex align-items-center p-0" style={{ marginRight: '12px' }}>
                <div className="d-flex version-manager-container p-0  align-items-center ">
                  {editingVersion && (
                    <EnvironmentManager
                      appEnvironmentChanged={appEnvironmentChanged}
                      environments={environments}
                      multiEnvironmentEnabled={featureAccess?.multiEnvironment}
                      setCurrentEnvironment={setCurrentAppEnvironmentId}
                      setCurrentAppVersionPromoted={setCurrentAppVersionPromoted}
                      licenseValid={licenseValid}
                      licenseType={featureAccess?.licenseStatus?.licenseType}
                    />
                  )}
                  <div className="navbar-seperator"></div>

                  {editingVersion && (
                    <AppVersionsManager
                      appId={appId}
                      setAppDefinitionFromVersion={setAppDefinitionFromVersion}
                      onVersionDelete={onVersionDelete}
                      environments={environments}
                      currentEnvironment={currentAppEnvironment}
                      setCurrentEnvironment={setCurrentAppEnvironmentId}
                      isPublic={isPublic ?? false}
                      appCreationMode={creationMode}
                      fetchEnvironments={fetchEnvironments}
                      darkMode={darkMode}
                    />
                  )}
                </div>
                <div
                  onClick={
                    featureAccess?.gitSync &&
                    currentAppEnvironment?.priority === 1 &&
                    (creationMode === 'GIT' || !isEditorFreezed) &&
                    toggleGitSyncModal
                  }
                  className={
                    featureAccess?.gitSync &&
                    currentAppEnvironment?.priority === 1 &&
                    (creationMode === 'GIT' || !isEditorFreezed)
                      ? 'git-sync-btn'
                      : 'git-sync-btn disabled-action-tooltip'
                  }
                >
                  <LicenseTooltip feature={'GitSync'} limits={featureAccess} placement="bottom">
                    <ToolTip
                      message={`${
                        currentAppEnvironment?.priority !== 1 &&
                        'GitSync can only be performed in development environment'
                      }`}
                      show={featureAccess?.gitSync}
                      placement="bottom"
                    >
                      <SolidIcon name="gitsync" />
                    </ToolTip>
                  </LicenseTooltip>
                </div>
              </div>
            </div>
            <div
              className="d-flex justify-content-end navbar-right-section"
              style={{ width: '300px', paddingRight: '12px' }}
            >
              <div className=" release-buttons navbar-nav flex-row">
                <div className="preview-share-wrap navbar-nav flex-row" style={{ gap: '4px' }}>
                  <div className="nav-item">
                    {appId && (
                      <ManageAppUsers
                        currentEnvironment={currentAppEnvironment}
                        multiEnvironmentEnabled={featureAccess?.multiEnvironment}
                        app={app}
                        appId={appId}
                        slug={slug}
                        M={M}
                        pageHandle={pageHandle}
                        darkMode={darkMode}
                        isVersionReleased={isVersionReleased}
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
                </div>
                <div className="nav-item dropdown promote-release-btn">
                  {!isEmpty(featureAccess) && shouldRenderPromoteButton && (
                    <ButtonSolid
                      variant="primary"
                      onClick={handlePromote}
                      size="md"
                      disabled={shouldDisablePromote}
                      data-cy="promote-button"
                    >
                      {' '}
                      <ToolTip
                        message="Promote this version to the next environment"
                        placement="bottom"
                        show={!shouldDisablePromote}
                      >
                        <div style={{ fontSize: '14px' }}>Promote </div>
                      </ToolTip>
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          fill-rule="evenodd"
                          clip-rule="evenodd"
                          d="M0.276332 7.02113C0.103827 7.23676 0.138788 7.55141 0.354419 7.72391C0.57005 7.89642 0.884696 7.86146 1.0572 7.64583L3.72387 4.31249C3.86996 4.12988 3.86996 3.87041 3.72387 3.6878L1.0572 0.354464C0.884696 0.138833 0.57005 0.103872 0.354419 0.276377C0.138788 0.448881 0.103827 0.763528 0.276332 0.979158L2.69312 4.00014L0.276332 7.02113ZM4.27633 7.02113C4.10383 7.23676 4.13879 7.55141 4.35442 7.72391C4.57005 7.89642 4.8847 7.86146 5.0572 7.64583L7.72387 4.31249C7.86996 4.12988 7.86996 3.87041 7.72387 3.6878L5.0572 0.354463C4.8847 0.138832 4.57005 0.103871 4.35442 0.276377C4.13879 0.448881 4.10383 0.763527 4.27633 0.979158L6.69312 4.00014L4.27633 7.02113Z"
                          fill={shouldDisablePromote ? '#C1C8CD' : '#FDFDFE'}
                        />
                      </svg>
                    </ButtonSolid>
                  )}

                  {shouldRenderReleaseButton && (
                    <ReleaseVersionButton
                      appId={appId}
                      appName={app.name}
                      onVersionRelease={onVersionRelease}
                      saveEditingVersion={saveEditingVersion}
                    />
                  )}

                  <PromoteConfirmationModal
                    data={promoteModalData}
                    editingVersion={editingVersion}
                    onClose={() => setPromoteModalData(null)}
                    onEnvChange={(env) => appEnvironmentChanged(env, false)}
                    fetchEnvironments={fetchEnvironments}
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
