import React, { useState } from 'react';
import { appVersionService } from '@/_services';
import AlertDialog from '@/_ui/AlertDialog';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export const EditVersion = ({
  appId,
  value: editingVersionId,
  setAppVersions,
  setShowEditAppVersion,
  showEditAppVersion,
  editingVersion,
}) => {
  const [isEditingVersion, setIsEditingVersion] = useState(false);
  const [versionName, setVersionName] = useState(editingVersion?.name || '');
  const { t } = useTranslation();

  React.useEffect(() => {
    setVersionName(editingVersion?.name);
  }, [editingVersion?.name]);

  const editVersion = () => {
    if (versionName.trim() === '') {
      toast.error('Version name should not be empty');
      return;
    }

    setIsEditingVersion(true);
    appVersionService
      .save(appId, editingVersionId, { name: versionName })
      .then(() => {
        toast.success('Version name updated');
        appVersionService.getAll(appId).then((data) => {
          const versions = data.versions;
          setAppVersions(versions);
        });
        setIsEditingVersion(false);
        setShowEditAppVersion(false);
      })
      .catch((error) => {
        setIsEditingVersion(false);
        toast.error(error?.error);
      });
  };

  return (
    <AlertDialog
      show={showEditAppVersion}
      closeModal={() => {
        setVersionName(editingVersion?.name || '');
        setShowEditAppVersion(false);
      }}
      title={t('editor.appVersionManager.editVersion', 'Edit Version')}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          editVersion();
        }}
      >
        <div className="row mb-3">
          <div className="col modal-main">
            <input
              type="text"
              onChange={(e) => setVersionName(e.target.value)}
              className="form-control"
              data-cy="edit-version-name-input-field"
              placeholder={t('editor.appVersionManager.enterVersionName', 'Enter version name')}
              disabled={isEditingVersion}
              value={versionName}
              maxLength={25}
            />
          </div>
        </div>
        <div className="row">
          <div className="col d-flex justify-content-end">
            <button
              className="btn mx-2"
              data-cy="cancel-button"
              onClick={() => {
                setVersionName(editingVersion?.name || '');
                setShowEditAppVersion(false);
              }}
              type="button"
            >
              {t('globals.cancel', 'Cancel')}
            </button>
            <button
              className={`btn btn-primary ${isEditingVersion ? 'btn-loading' : ''}`}
              data-cy="save-button"
              type="submit"
            >
              {t('globals.save', 'Save')}
            </button>
          </div>
        </div>
      </form>
    </AlertDialog>
  );
};
