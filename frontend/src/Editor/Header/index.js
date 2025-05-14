import React from 'react';
import EditAppName from './EditAppName';
import HeaderActions from './HeaderActions';
import RealtimeAvatars from '../RealtimeAvatars';
import { AppVersionsManager } from '@/Editor/AppVersionsManager/AppVersionsManager';
import { ToolTip } from '@/_components/ToolTip';
import cx from 'classnames';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { LicenseTooltip } from '@/LicenseTooltip';
import { useAppInfo, useCurrentUser } from '@/_stores/appDataStore';
import UpdatePresence from './UpdatePresence';
import { useEditorState } from '@/_stores/editorStore';
import LogoNavDropdown from '@/_components/LogoNavDropdown';
import RightTopHeaderButtons from './RightTopHeaderButtons';
import EnvironmentManager from './EnvironmentManager';
import { useEnvironmentsAndVersionsStore } from '../../_stores/environmentsAndVersionsStore';

export default function EditorHeader({
  canUndo,
  canRedo,
  handleUndo,
  handleRedo,
  saveError,
  onNameChanged,
  appEnvironmentChanged,
  setAppDefinitionFromVersion,
  onVersionRelease,
  toggleGitSyncModal,
  darkMode,
  setCurrentAppVersionPromoted,
  isEditorFreezed,
}) {
  const currentUser = useCurrentUser();
  const { isSaving, appId, appName, isPublic, creationMode } = useAppInfo();
  const { featureAccess } = useEditorState();
  const { selectedEnvironment } = useEnvironmentsAndVersionsStore(
    (state) => ({
      appVersionEnvironment: state?.appVersionEnvironment,
      selectedEnvironment: state?.selectedEnvironment,
    }),
    shallow
  );

  let licenseValid = !featureAccess?.licenseStatus?.isExpired && featureAccess?.licenseStatus?.isLicenseValid;
  const shouldEnableMultiplayer = window.public_config?.ENABLE_MULTIPLAYER_EDITING === 'true';

  const { isVersionReleased, editingVersion } = useAppVersionStore(
    (state) => ({
      isVersionReleased: state.isVersionReleased,
      editingVersion: state.editingVersion,
    }),
    shallow
  );

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
                      multiEnvironmentEnabled={featureAccess?.multiEnvironment}
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
                      isPublic={isPublic ?? false}
                      appCreationMode={creationMode}
                      darkMode={darkMode}
                    />
                  )}
                </div>
                <div
                  onClick={
                    featureAccess?.gitSync &&
                    selectedEnvironment?.priority === 1 &&
                    (creationMode === 'GIT' || !isEditorFreezed) &&
                    toggleGitSyncModal
                  }
                  className={
                    featureAccess?.gitSync &&
                    selectedEnvironment?.priority === 1 &&
                    (creationMode === 'GIT' || !isEditorFreezed)
                      ? 'git-sync-btn'
                      : 'git-sync-btn disabled-action-tooltip'
                  }
                >
                  <LicenseTooltip feature={'GitSync'} limits={featureAccess} placement="bottom">
                    <ToolTip
                      message={`${
                        selectedEnvironment?.priority !== 1 &&
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
            <RightTopHeaderButtons onVersionRelease={onVersionRelease} appEnvironmentChanged={appEnvironmentChanged} />
          </div>
        </div>
      </header>
    </div>
  );
}
