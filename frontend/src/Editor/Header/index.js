import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLogo from '@/_components/AppLogo';
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
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';
import { LicenseTooltip } from '@/LicenseTooltip';
import { licenseService } from '@/_services';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import UpdatePresence from './UpdatePresence';

export default function EditorHeader({
  M,
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
  darkMode,
  setCurrentAppVersionPromoted,
}) {
  const { is_maintenance_on } = app;
  const [environments, setEnvironments] = useState([]);
  const [currentEnvironment, setCurrentEnvironment] = useState(null);
  const [promoteModalData, setPromoteModalData] = useState(null);
  const [featureAccess, setFeatureAccess] = useState({});
  const shouldEnableMultiplayer = window.public_config?.ENABLE_MULTIPLAYER_EDITING === 'true';
  const { isVersionReleased, editingVersion, isEditorFreezed } = useAppVersionStore(
    (state) => ({
      isVersionReleased: state.isVersionReleased,
      editingVersion: state.editingVersion,
      isEditorFreezed: state.isEditorFreezed,
    }),
    shallow
  );

  useEffect(() => {
    fetchFeatureAccess();
  }, [currentUser]);
  const handleLogoClick = () => {
    // Force a reload for clearing interval triggers
    window.location.href = '/';
  };

  const handlePromote = () => {
    setPromoteModalData({
      current: currentEnvironment,
      target: environments[currentEnvironment.index + 1],
    });
  };

  const fetchFeatureAccess = () => {
    licenseService.getFeatureAccess().then((data) => {
      setFeatureAccess({ ...data });
    });
  };

  const currentAppEnvironmentId = editingVersion?.current_environment_id || editingVersion?.currentEnvironmentId;
  // a flag to disable the release button if the current environment is not production
  const shouldDisablePromote = currentEnvironment?.id !== currentAppEnvironmentId || isSaving;

  return (
    <div className="header">
      <header className="navbar navbar-expand-md  d-print-none p-0">
        <div className="container-xl header-container">
          <div className="d-flex w-100">
            <h1 className="navbar-brand d-none-navbar-horizontal p-0">
              <Link data-cy="editor-page-logo" onClick={handleLogoClick}>
                <AppLogo isLoadingFromHeader={false} />
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
                  <EditAppName appId={app.id} appName={app.name} onNameChanged={onNameChanged} />
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
                      editingVersion={editingVersion}
                      appEnvironmentChanged={appEnvironmentChanged}
                      environments={environments}
                      setEnvironments={setEnvironments}
                      currentEnvironment={currentEnvironment}
                      multiEnvironmentEnabled={featureAccess?.multiEnvironment}
                      setCurrentEnvironment={setCurrentEnvironment}
                      setCurrentAppVersionPromoted={setCurrentAppVersionPromoted}
                    />
                  )}
                  <div className="navbar-seperator"></div>

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
              </div>
            </div>
            <div
              className="d-flex justify-content-end navbar-right-section"
              style={{ width: '300px', paddingRight: '12px' }}
            >
              <div className="navbar-nav flex-row order-md-last release-buttons ">
                <div className="nav-item">
                  <LicenseTooltip
                    placement="left"
                    limits={featureAccess}
                    customMessage={'Sharing apps is available only in paid plans'}
                    isAvailable={featureAccess?.multiEnvironment}
                    noTooltipIfValid={true}
                  >
                    {app.id && (
                      <ManageAppUsers
                        currentEnvironment={currentEnvironment}
                        multiEnvironmentEnabled={featureAccess?.multiEnvironment}
                        app={app}
                        slug={slug}
                        M={M}
                        handleSlugChange={handleSlugChange}
                        darkMode={darkMode}
                      />
                    )}
                  </LicenseTooltip>
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
                  {featureAccess?.multiEnvironment &&
                    (!isVersionReleased && currentEnvironment?.name !== 'production' ? (
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
                    ) : (
                      app.id && (
                        <ReleaseVersionButton
                          appId={app.id}
                          appName={app.name}
                          onVersionRelease={onVersionRelease}
                          saveEditingVersion={saveEditingVersion}
                        />
                      )
                    ))}

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
