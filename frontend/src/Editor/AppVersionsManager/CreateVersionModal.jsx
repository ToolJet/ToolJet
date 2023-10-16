import React, { useState } from 'react';
import { appVersionService } from '@/_services';
import AlertDialog from '@/_ui/AlertDialog';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Select from '@/_ui/Select';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';

export const CreateVersion = ({
  appId,
  appVersions,
  setAppVersions,
  setAppDefinitionFromVersion,
  showCreateAppVersion,
  setShowCreateAppVersion,
}) => {
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [versionName, setVersionName] = useState('');

  const { t } = useTranslation();
  const { editingVersion } = useAppVersionStore(
    (state) => ({
      editingVersion: state.editingVersion,
    }),
    shallow
  );

  const options = appVersions.map((version) => {
    return { label: version.name, value: version };
  });

  const [selectedVersion, setSelectedVersion] = useState(
    () => options.find((option) => option?.value?.id === editingVersion?.id)?.value
  );

  const createVersion = () => {
    if (versionName.trim().length > 25) {
      toast.error('Version name should not be longer than 25 characters');
      return;
    }
    if (versionName.trim() == '') {
      toast.error('Version name should not be empty');
      return;
    }

    setIsCreatingVersion(true);

    appVersionService
      .create(appId, versionName, selectedVersion.id)
      .then((data) => {
        toast.success('Version Created');
        appVersionService.getAll(appId).then((data) => {
          setVersionName('');
          setIsCreatingVersion(false);
          setAppVersions(data.versions);
          setShowCreateAppVersion(false);
        });

        appVersionService
          .getAppVersionData(appId, data.id)
          .then((data) => {
            setAppDefinitionFromVersion(data);
          })
          .catch((error) => {
            toast.error(error);
          });
      })
      .catch((error) => {
        toast.error(error?.error);
        setIsCreatingVersion(false);
      });
  };

  return (
    <AlertDialog
      show={showCreateAppVersion}
      closeModal={() => {
        setVersionName('');
        setShowCreateAppVersion(false);
      }}
      title={t('editor.appVersionManager.createVersion', 'Create new version')}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createVersion();
        }}
      >
        <div className="mb-3 pb-2">
          <div className="col tj-app-input">
            <label className="form-label" data-cy="version-name-label">
              {t('editor.appVersionManager.versionName', 'Version Name')}
            </label>
            <input
              type="text"
              onChange={(e) => setVersionName(e.target.value)}
              className="form-control"
              data-cy="version-name-input-field"
              placeholder={t('editor.appVersionManager.enterVersionName', 'Enter version name')}
              disabled={isCreatingVersion}
              value={versionName}
              autoFocus={true}
              minLength="1"
              maxLength="25"
            />
          </div>
        </div>

        <div className="mb-4 pb-2 version-select">
          <label className="form-label" data-cy="create-version-from-label">
            {t('editor.appVersionManager.createVersionFrom', 'Create version from')}
          </label>
          <div className="ts-control" data-cy="create-version-from-input-field">
            <Select
              options={options}
              value={selectedVersion}
              onChange={(version) => {
                setSelectedVersion(version);
              }}
              useMenuPortal={false}
              width="100%"
              maxMenuHeight={100}
            />
          </div>
        </div>

        <div className="mb-3">
          <div className="col d-flex justify-content-end">
            <button
              className="btn mx-2"
              data-cy="cancel-button"
              onClick={() => {
                setVersionName('');
                setShowCreateAppVersion(false);
              }}
              type="button"
            >
              {t('globals.cancel', 'Cancel')}
            </button>
            <button
              className={`btn btn-primary ${isCreatingVersion ? 'btn-loading' : ''}`}
              data-cy="create-new-version-button"
              type="submit"
            >
              {t('editor.appVersionManager.createVersion', 'Create Version')}
            </button>
          </div>
        </div>
      </form>
    </AlertDialog>
  );
};
