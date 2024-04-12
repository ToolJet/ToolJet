import React, { useState, useEffect, useCallback, useRef } from 'react';
import cx from 'classnames';
import { appVersionService, appEnvironmentService } from '@/_services';
import { CustomSelect } from './CustomSelect';
import { toast } from 'react-hot-toast';
import { ToolTip } from '@/_components/ToolTip';
import { shallow } from 'zustand/shallow';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { useEditorStore } from '@/_stores/editorStore';
import { useAppDataStore } from '@/_stores/appDataStore';

export const AppVersionsManager = function ({
  appId,
  setAppDefinitionFromVersion,
  onVersionDelete,
  currentEnvironment,
  environments,
  setCurrentEnvironment,
  appCreationMode,
  isEditable = true,
  isViewer,
  fetchEnvironments,
}) {
  const [appVersions, setAppVersions] = useState([]);
  const [appVersionStatus, setGetAppVersionStatus] = useState('');
  const [deleteVersion, setDeleteVersion] = useState({
    versionId: '',
    versionName: '',
    showModal: false,
  });

  const { editingVersion, releasedVersionId } = useAppVersionStore(
    (state) => ({
      editingVersion: state.editingVersion,
      releasedVersionId: state.releasedVersionId,
    }),
    shallow
  );

  const { currentLayout } = useEditorStore(
    (state) => ({
      currentLayout: state?.currentLayout,
    }),
    shallow
  );
  const darkMode = localStorage.getItem('darkMode') === 'true';

  useEffect(() => {
    setGetAppVersionStatus('loading');
    appEnvironmentService
      .getVersionsByEnvironment(appId)
      .then((data) => {
        setAppVersions(data.appVersions);
        setGetAppVersionStatus('success');
      })
      .catch((error) => {
        toast.error(error);
        setGetAppVersionStatus('failure');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shouldFreezeEditor = (currentEnvironmentId) => {
    if (!currentEnvironmentId) return false;
    const currentPromotedEnvironment = currentEnvironmentId
      ? environments.find((env) => env.id === currentEnvironmentId)
      : environments.find((env) => env.name === 'development');

    if (currentPromotedEnvironment.name === 'production' || currentPromotedEnvironment.name === 'staging') {
      // we don't want to allow editing of production and staging environments
      // so let's freeze the editor
      return true;
    } else return false;
  };

  const setVersionsWithEnvironment = useCallback(() => {
    setGetAppVersionStatus('loading');
    appEnvironmentService
      .getVersionsByEnvironment(appId, currentEnvironment.id)
      .then((data) => {
        setAppVersions(data.appVersions);
        setGetAppVersionStatus('success');
        if (data.appVersions && data.appVersions.length === 0) {
          // if no versions in the current environment, then set the current environment to null
          // it will reset the current selected environment as development.
          fetchEnvironments(appId);
          return;
        }
        // if current selected version is not present in the current environment, then select the first version
        if (!data.appVersions.find((version) => version.id === editingVersion.id)) {
          selectVersion(data.appVersions[0].id, false, false, true);
        }
      })
      .catch((error) => {
        toast.error(error);
        setGetAppVersionStatus('failure');
      });
  }, [currentEnvironment, appId, editingVersion.id]);

  useEffect(() => {
    if (currentEnvironment && appId && editingVersion) {
      setVersionsWithEnvironment();
    }
  }, [currentEnvironment, appId]);

  const selectVersion = (
    id,
    isCurrentVersionNotUpgradedYet = false,
    isUserSwitchedVersion = false,
    canLoadSameEnv = false
  ) => {
    const currentVersionId = useAppDataStore.getState().currentVersionId;

    const isSameVersionSelected = currentVersionId === id;

    if (isSameVersionSelected) {
      return toast('You are already editing this version', {
        icon: '⚠️',
      });
    }

    return appVersionService
      .getAppVersionData(appId, id)
      .then((data) => {
        setAppDefinitionFromVersion(
          data,
          isUserSwitchedVersion,
          isCurrentVersionNotUpgradedYet,
          currentEnvironment?.id,
          { canLoadSameEnv }
        );
      })
      .catch((error) => {
        toast.error(error);
      });
  };

  const resetDeleteModal = () => {
    setDeleteVersion({
      versionId: '',
      versionName: '',
      showModal: false,
    });
  };

  const deleteAppVersion = (versionId, versionName) => {
    const deleteingToastId = toast.loading('Deleting version...');
    appVersionService
      .del(appId, versionId)
      .then(() => {
        onVersionDelete();
        toast.dismiss(deleteingToastId);
        toast.success(`Version - ${versionName} Deleted`);
        resetDeleteModal();
        setVersionsWithEnvironment();
      })
      .catch((error) => {
        toast.dismiss(deleteingToastId);
        toast.error(error?.error ?? 'Oops, something went wrong');
        resetDeleteModal();
      });
  };

  const options = appVersions.map((appVersion) => ({
    value: appVersion.id,
    isReleasedVersion: appVersion.id === releasedVersionId,
    appVersionName: appVersion.name,
    label: (
      <div className="row align-items-center app-version-list-item">
        <div className="col-10">
          <ToolTip message="Current released version" show={appVersion.id === releasedVersionId} placement="right">
            <div
              className={cx('app-version-name text-truncate', {
                'color-light-green': appVersion.id === releasedVersionId,
              })}
              style={{ maxWidth: '100%' }}
            >
              {appVersion.name}
            </div>
          </ToolTip>
        </div>
        {isEditable && appVersion.id !== releasedVersionId && (
          <div
            className="col cursor-pointer m-auto app-version-delete"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteVersion({
                versionId: appVersion.id,
                versionName: appVersion.name,
                showModal: true,
              });
            }}
          >
            <svg
              width="13"
              height="14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              data-cy={`${appVersion.name.toLowerCase().replace(/\s+/g, '-')}-delete-icon`}
            >
              <path
                d="M2.612 13.246c-.355 0-.663-.13-.925-.392a1.265 1.265 0 01-.391-.925V2.596h-.184a.645.645 0 01-.475-.192.645.645 0 01-.191-.475c0-.189.064-.347.191-.475a.645.645 0 01.475-.191h2.884c0-.19.064-.348.191-.475a.645.645 0 01.475-.192H8.03c.189 0 .35.067.483.2a.64.64 0 01.2.467h2.867c.189 0 .347.064.475.191a.645.645 0 01.192.475.645.645 0 01-.192.475.645.645 0 01-.475.192h-.183v9.333c0 .356-.13.664-.392.925-.261.261-.57.392-.925.392H2.612zm0-10.65v9.333h7.467V2.596H2.612zm1.734 7.4c0 .155.055.289.166.4a.545.545 0 00.4.167.565.565 0 00.417-.167.545.545 0 00.167-.4V4.513a.579.579 0 00-.175-.425.56.56 0 00-.409-.175.526.526 0 00-.408.175.61.61 0 00-.158.425v5.483zm2.85 0c0 .155.058.289.175.4a.573.573 0 00.408.167.565.565 0 00.417-.167.545.545 0 00.166-.4V4.513a.579.579 0 00-.175-.425.56.56 0 00-.408-.175.552.552 0 00-.417.175.594.594 0 00-.166.425v5.483zm-4.584-7.4v9.333-9.333z"
                fill="#EB1414"
              ></path>
            </svg>
          </div>
        )}
      </div>
    ),
  }));

  const customSelectProps = {
    appId,
    appVersions,
    setAppVersions,
    setAppDefinitionFromVersion,
    editingVersion,
    setDeleteVersion,
    deleteVersion,
    deleteAppVersion,
    resetDeleteModal,
    appCreationMode,
  };

  const handleOnSelectVersion = (id) => {
    if (editingVersion.id === id) return;

    return selectVersion(id, false, true);
  };

  return (
    <div
      className="d-flex align-items-center p-0"
      style={{ margin: isViewer && currentLayout === 'mobile' ? '0px' : '0 24px' }}
    >
      <div
        className={cx('d-flex version-manager-container p-0', {
          'w-100': isViewer && currentLayout === 'mobile',
        })}
      >
        <div
          className={cx('app-versions-selector', {
            'w-100': isViewer && currentLayout === 'mobile',
          })}
          data-cy="app-version-selector"
        >
          <CustomSelect
            isLoading={appVersionStatus === 'loading'}
            options={options}
            value={editingVersion?.id}
            onChange={(id) => handleOnSelectVersion(id)}
            {...customSelectProps}
            className={` ${darkMode && 'dark-theme'}`}
            isEditable={isEditable}
            currentEnvironment={currentEnvironment}
            onSelectVersion={handleOnSelectVersion}
          />
        </div>
      </div>
    </div>
  );
};
