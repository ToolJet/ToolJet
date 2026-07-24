import React, { useState } from 'react';
import AlertDialog from '@/_ui/AlertDialog';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

export const EditVersionModal = ({ setShowEditAppVersion, showEditAppVersion }) => {
  const { moduleId } = useModuleContext();
  const [isEditingVersion, setIsEditingVersion] = useState(false);
  const textareaRef = React.useRef(null);

  const handleDescriptionInput = (e) => {
    const textarea = textareaRef.current || (e && e.target);
    if (!textarea) return;
    textarea.style.height = 'auto';
    const lineHeight = 24;
    const maxLines = 4;
    const maxHeight = lineHeight * maxLines;
    textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  };

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
  const [versionDescription, setVersionDescription] = useState(editingVersion?.description || '');
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
    setVersionDescription(editingVersion?.description || '');
    setNameError('');
    setDescriptionError('');
  }, [editingVersion?.name, editingVersion]);

  const editVersion = () => {
    setNameError('');
    setDescriptionError('');

    let hasError = false;
    const hasNameError = validateVersionName(versionName);
    const hasDescriptionError = validateVersionDescription(versionDescription);

    if (hasDescriptionError) {
      setDescriptionError(hasDescriptionError);
      toast.error(hasDescriptionError);
      hasError = true;
    }
    if (hasNameError) {
      setNameError(hasNameError);
      toast.error(hasNameError);
      hasError = true;
    }

    if (hasError) return;

    setIsEditingVersion(true);
    updateVersionNameAction(
      appId,
      editingVersion?.id,
      versionName,
      versionDescription,
      () => {
        toast.success('Version details updated successfully!');
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
        setVersionDescription(editingVersion?.description || '');
        setNameError('');
        setDescriptionError('');
        setShowEditAppVersion(false);
      }}
      checkForBackground={true}
      title={'Edit version'}
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
              {t('editor.appVersionManager.versionDescription', 'Version description')}
            </label>
            <textarea
              type="text"
              ref={textareaRef}
              onInput={handleDescriptionInput}
              onChange={(e) => {
                setVersionDescription(e.target.value);
                setDescriptionError(validateVersionDescription(e.target.value));
              }}
              className="form-control edit-version-description"
              data-cy="edit-version-description-input-field"
              placeholder={t('editor.appVersionManager.enterVersionDescription', 'Enter version description')}
              disabled={isEditingVersion}
              value={versionDescription}
              maxLength={500}
              rows={1}
            />
            <small className={`version-description-helper-text ${descriptionError ? 'text-danger' : ''}`}>
              {descriptionError
                ? descriptionError
                : t('editor.appVersionManager.versionDescriptionHelper', 'Description must be max 500 characters')}
            </small>
          </div>
        </div>

        <div className="edit-version-footer">
          <hr className="section-divider" style={{ marginLeft: '-1.5rem', marginRight: '-1.5rem' }} />

          <div className="col d-flex justify-content-end">
            <ButtonSolid
              size="lg"
              data-cy="cancel-button"
              type="button"
              variant="tertiary"
              className="mx-2"
              onClick={() => {
                setVersionName(editingVersion?.name || '');
                setVersionDescription(editingVersion?.description || '');
                setNameError('');
                setDescriptionError('');
                setShowEditAppVersion(false);
              }}
            >
              {t('globals.cancel', 'Cancel')}{' '}
            </ButtonSolid>

            <ButtonSolid size="lg" data-cy="save-button" type="submit" variant="primary">
              {t('editor.update', 'Update')}
            </ButtonSolid>
          </div>
        </div>
      </form>
    </AlertDialog>
  );
};
