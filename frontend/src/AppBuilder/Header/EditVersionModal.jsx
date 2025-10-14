import React, { useState } from 'react';
import AlertDialog from '@/_ui/AlertDialog';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';

export const EditVersionModal = ({ setShowEditAppVersion, showEditAppVersion }) => {
  const { moduleId } = useModuleContext();
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
  const [versionDescription, setVersionDescription] = useState('');
  const [nameError, setNameError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const { t } = useTranslation();

  const validateVersionName = (value) => {
    if (value.trim() === '') {
      return t('editor.appVersionManager.emptyNameError', 'Version name should not be empty');
    } else if (value.length > 25) {
      return t('editor.appVersionManager.maxLengthError', 'Version name cannot exceed 25 characters');
    }
    return '';
  };

  const validateVersionDescription = (value) => {
    if (value.length > 500) {
      return t('editor.appVersionManager.maxDescriptionLengthError', 'Description cannot exceed 500 characters');
    }
    return '';
  };

  React.useEffect(() => {
    setVersionName(editingVersion?.name);
    setNameError('');
    setDescriptionError('');
  }, [editingVersion?.name]);

  const editVersion = () => {
    setNameError('');
    setDescriptionError('');

    let hasError = false;
    const error = validateVersionName(versionName);

    if (error) {
      setNameError(error);
      toast.error(error);
      hasError = true;
    }

    if (hasError) return;

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
        const errorMessage = error?.error || t('editor.appVersionManager.updateFailed', 'Failed to update version');
        setNameError(errorMessage);
        toast.error(errorMessage);
      }
    );
  };

  return (
    <AlertDialog
      show={showEditAppVersion}
      closeModal={() => {
        setVersionName(editingVersion?.name || '');
        setNameError('');
        setDescriptionError('');
        setShowEditAppVersion(false);
      }}
      checkForBackground={true}
      title={t('editor.appVersionManager.editVersion', 'Edit Version')}
      customClassName="edit-version-modal"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          editVersion();
        }}
      >
        <div className="row mb-3">
          <div className="col modal-main tj-app-input version-name">
            <label className="form-label" data-cy="version-name-label">
              {t('editor.appVersionManager.versionName', 'Version Name')}
            </label>
            <input
              type="text"
              onChange={(e) => {
                const value = e.target.value;
                setVersionName(value);
                setNameError(validateVersionName(value));
              }}
              className="form-control"
              data-cy="edit-version-name-input-field"
              placeholder={t('editor.appVersionManager.enterVersionName', 'Enter version name')}
              disabled={isEditingVersion}
              value={versionName}
              maxLength={25}
            />
            <small className={`version-description-helper-text ${nameError ? 'text-danger' : ''}`}>
              {nameError
                ? nameError
                : t('editor.appVersionManager.versionNameHelper', 'Version name must be unique and max 25 characters')}
            </small>
          </div>
        </div>
        <div className="row mb-3">
          <div className="col modal-main tj-app-input version-description">
            <label className="form-label" data-cy="version-description-label">
              {t('editor.appVersionManager.versionDescription', 'Version Description')}
            </label>
            <textarea
              type="text"
              onChange={(e) => {
                setVersionDescription(e.target.value);
                setDescriptionError(validateVersionDescription(e.target.value));
              }}
              className="form-control"
              data-cy="edit-version-description-input-field"
              placeholder={t('editor.appVersionManager.enterVersionDescription', 'Enter version description')}
              disabled={isEditingVersion}
              value={versionDescription}
              maxLength={500}
            />
            <small className={`version-description-helper-text ${descriptionError ? 'text-danger' : ''}`}>
              {descriptionError
                ? descriptionError
                : t('editor.appVersionManager.versionDescriptionHelper', 'Description must be max 500 characters')}
            </small>
          </div>
        </div>
        <div className="row">
          <div className="col d-flex justify-content-end">
            <button
              className="btn mx-2"
              data-cy="cancel-button"
              onClick={() => {
                setVersionName(editingVersion?.name || '');
                setNameError('');
                setDescriptionError('');
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
