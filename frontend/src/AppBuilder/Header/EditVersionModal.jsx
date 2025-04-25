import React, { useState } from 'react';
import AlertDialog from '@/_ui/AlertDialog';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleId } from '@/AppBuilder/_contexts/ModuleContext';

export const EditVersionModal = ({ setShowEditAppVersion, showEditAppVersion }) => {
  const moduleId = useModuleId();
  const [isEditingVersion, setIsEditingVersion] = useState(false);
  const {
    updateVersionNameAction,
    selectedVersion: editingVersion,
    appId,
  } = useStore(
    (state) => ({
      updateVersionNameAction: state.updateVersionNameAction,
      selectedVersion: state.selectedVersion,
      appId: state.appStore.modules[moduleId].app.appId,
    }),
    shallow
  );
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
    updateVersionNameAction(
      appId,
      editingVersion?.id,
      versionName,
      () => {
        toast.success('Version name updated');
        setIsEditingVersion(false);
        setShowEditAppVersion(false);
      },
      (error) => {
        setIsEditingVersion(false);
        toast.error(error?.error);
      }
    );
  };

  return (
    <AlertDialog
      show={showEditAppVersion}
      closeModal={() => {
        setVersionName(editingVersion?.name || '');
        setShowEditAppVersion(false);
      }}
      checkForBackground={true}
      title={t('editor.appVersionManager.editVersion', 'Edit Version')}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          editVersion();
        }}
      >
        <div className="row mb-3">
          <div className="col modal-main tj-app-input">
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
