import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLogo from '@/_components/AppLogo';
import { GlobalSettings } from './GlobalSettings';
import EditAppName from './EditAppName';
import HeaderActions from './HeaderActions';
import RealtimeAvatars from '../RealtimeAvatars';
import EnvironmentManager from '../EnvironmentsManager';
import { AppVersionsManager } from '../AppVersionsManager/List';
import { ManageAppUsers } from '../ManageAppUsers';
import { ReleaseVersionButton } from '../ReleaseVersionButton';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { ToolTip } from '@/_components/ToolTip';
import PromoteConfirmationModal from '../EnvironmentsManager/PromoteConfirmationModal';
import cx from 'classnames';
import config from 'config';
// eslint-disable-next-line import/no-unresolved
import { useUpdatePresence } from '@y-presence/react';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';

export default function EditorHeader({
  darkMode,
  globalSettingsChanged,
  appDefinition,
  toggleAppMaintenance,
  app,
  appVersionPreviewLink,
  slug,
  appId,
  canUndo,
  canRedo,
  handleUndo,
  handleRedo,
  isSaving,
  saveError,
  onNameChanged,
  appEnvironmentChanged,
  setAppDefinitionFromVersion,
  handleSlugChange,
  onVersionRelease,
  saveEditingVersion,
  onVersionDelete,
  currentUser,
  getStoreData,
}) {
  const { is_maintenance_on } = app;
  const [environments, setEnvironments] = useState([]);
  const [currentEnvironment, setCurrentEnvironment] = useState(null);
  const [promoteModalData, setPromoteModalData] = useState(null);
  const { isVersionReleased, editingVersion, isEditorFreezed } = useAppVersionStore(
    (state) => ({
      isVersionReleased: state.isVersionReleased,
      editingVersion: state.editingVersion,
      isEditorFreezed: state.isEditorFreezed,
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

  const handlePromote = () => {
    setPromoteModalData({
      current: currentEnvironment,
      target: environments[currentEnvironment.index + 1],
    });
  };

  const currentAppEnvironmentId = editingVersion?.current_environment_id || editingVersion?.currentEnvironmentId;
  // a flag to disable the release button if the current environment is not production
  const shouldDisablePromote = currentEnvironment?.id !== currentAppEnvironmentId || isSaving;

  return (
    <div className="header">
      <header className="navbar navbar-expand-md navbar-light d-print-none">
        <div className="container-xl header-container">
          <div className="d-flex w-100">
            <h1 className="navbar-brand d-none-navbar-horizontal pe-0 mt-1">
              <Link to={'/'} data-cy="editor-page-logo">
                <AppLogo isLoadingFromHeader={false} />
              </Link>
            </h1>
            <div
              style={{
                maxHeight: '45px',
              }}
              className="flex-grow-1 row px-3"
            >
              <div className="col">
                <div className="row p-2">
                  <div className="col global-settings-app-wrapper">
                    <GlobalSettings
                      globalSettingsChanged={globalSettingsChanged}
                      globalSettings={appDefinition.globalSettings}
                      darkMode={darkMode}
                      toggleAppMaintenance={toggleAppMaintenance}
                      is_maintenance_on={is_maintenance_on}
                      shouldFreeze={isVersionReleased || isEditorFreezed}
                      app={app}
                    />
                    <EditAppName appId={app.id} appName={app.name} onNameChanged={onNameChanged} />
                  </div>

                  <div className="col d-flex">
                    <HeaderActions
                      canUndo={canUndo}
                      canRedo={canRedo}
                      handleUndo={handleUndo}
                      handleRedo={handleRedo}
                    />
                    <div className="my-1 mx-3">
                      <span
                        className={cx('autosave-indicator', {
                          'autosave-indicator-saving': isSaving,
                          'text-danger': saveError,
                          'd-none': isVersionReleased,
                        })}
                        data-cy="autosave-indicator"
                      >
                        {isSaving ? 'Saving...' : saveError ? 'Could not save changes' : 'Saved changes'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-auto d-flex">
                <div className="d-flex version-manager-container">
                  {editingVersion && (
                    <EnvironmentManager
                      editingVersion={editingVersion}
                      appEnvironmentChanged={appEnvironmentChanged}
                      environments={environments}
                      setEnvironments={setEnvironments}
                      currentEnvironment={currentEnvironment}
                      setCurrentEnvironment={setCurrentEnvironment}
                    />
                  )}
                  {editingVersion && (
                    <AppVersionsManager
                      appId={appId}
                      releasedVersionId={app.current_version_id}
                      setAppDefinitionFromVersion={setAppDefinitionFromVersion}
                      onVersionDelete={onVersionDelete}
                      environments={environments}
                      currentEnvironment={currentEnvironment}
                      setCurrentEnvironment={setCurrentEnvironment}
                    />
                  )}
                </div>
                {config.ENABLE_MULTIPLAYER_EDITING && (
                  <div className="mx-2 p-2">
                    <RealtimeAvatars />
                  </div>
                )}
              </div>
              <div className="col-1"></div>
            </div>
            <div className="d-flex">
              <div className="navbar-nav flex-row order-md-last release-buttons p-1">
                <div className="nav-item me-1">
                  {app.id && (
                    <ManageAppUsers app={app} slug={slug} darkMode={darkMode} handleSlugChange={handleSlugChange} />
                  )}
                </div>
                <div className="nav-item me-1">
                  <Link
                    title="Preview"
                    to={appVersionPreviewLink}
                    target="_blank"
                    rel="noreferrer"
                    data-cy="preview-link-button"
                  >
                    <svg
                      className="icon cursor-pointer w-100 h-100"
                      width="33"
                      height="33"
                      viewBox="0 0 33 33"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect x="0.363281" y="0.220703" width="32" height="32" rx="6" fill="#F0F4FF" />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M10.4712 16.2205C12.1364 18.9742 14.1064 20.2205 16.3646 20.2205C18.6227 20.2205 20.5927 18.9742 22.258 16.2205C20.5927 13.4669 18.6227 12.2205 16.3646 12.2205C14.1064 12.2205 12.1364 13.4669 10.4712 16.2205ZM9.1191 15.8898C10.9694 12.6519 13.3779 10.8872 16.3646 10.8872C19.3513 10.8872 21.7598 12.6519 23.6101 15.8898C23.7272 16.0947 23.7272 16.3464 23.6101 16.5513C21.7598 19.7891 19.3513 21.5539 16.3646 21.5539C13.3779 21.5539 10.9694 19.7891 9.1191 16.5513C9.00197 16.3464 9.00197 16.0947 9.1191 15.8898ZM16.3646 15.5539C15.9964 15.5539 15.6979 15.8524 15.6979 16.2205C15.6979 16.5887 15.9964 16.8872 16.3646 16.8872C16.7328 16.8872 17.0312 16.5887 17.0312 16.2205C17.0312 15.8524 16.7328 15.5539 16.3646 15.5539ZM14.3646 16.2205C14.3646 15.116 15.26 14.2205 16.3646 14.2205C17.4692 14.2205 18.3646 15.116 18.3646 16.2205C18.3646 17.3251 17.4692 18.2205 16.3646 18.2205C15.26 18.2205 14.3646 17.3251 14.3646 16.2205Z"
                        fill="#3E63DD"
                      />
                    </svg>
                  </Link>
                </div>
                <div className="nav-item dropdown">
                  {!isVersionReleased && currentEnvironment?.name !== 'production' ? (
                    <ButtonSolid
                      variant="primary"
                      onClick={handlePromote}
                      size="md"
                      disabled={shouldDisablePromote}
                      data-cy="promte-button"
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
                  ) : (
                    app.id && (
                      <ReleaseVersionButton
                        appId={app.id}
                        appName={app.name}
                        onVersionRelease={onVersionRelease}
                        saveEditingVersion={saveEditingVersion}
                      />
                    )
                  )}

                  <PromoteConfirmationModal
                    data={promoteModalData}
                    editingVersion={editingVersion}
                    onClose={() => setPromoteModalData(null)}
                    onEnvChange={(env) => appEnvironmentChanged(env)}
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
