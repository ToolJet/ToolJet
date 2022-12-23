import React, { useState } from 'react';
import { appVersionService } from '@/_services';
import Modal from '../../HomePage/Modal';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useHotkeys } from 'react-hotkeys-hook';

export const EditVersion = ({
  appId,
  value: editingVersionId,
  setAppVersions,
  setShowEditAppVersion,
  showEditAppVersion,
}) => {
  const [isEditingVersion, setIsEditingVersion] = useState(false);
  const [versionName, setVersionName] = useState('');
  const { t } = useTranslation();
  useHotkeys('enter', () => editVersion());

  const editVersion = () => {
    if (versionName.trim() === '') {
      toast.error('The version name should not be empty');
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
    <Modal
      show={showEditAppVersion}
      destr
      closeModal={() => showEditAppVersion(false)}
      title={t('editor.appVersionManager.editVersion', 'Edit Version')}
    >
      <div className="row">
        <div className="col modal-main">
          <input
            type="text"
            onChange={(e) => setVersionName(e.target.value)}
            className="form-control"
            placeholder={t('editor.appVersionManager.versionName', 'Version name')}
            disabled={isEditingVersion}
            value={versionName}
            maxLength={25}
          />
        </div>
      </div>
      <div className="row">
        <div className="col d-flex modal-footer-btn">
          <button className="btn btn-light" onClick={() => setShowEditAppVersion(false)}>
            {t('globals.cancel', 'Cancel')}
          </button>
          <button className={`btn btn-primary ${isEditingVersion ? 'btn-loading' : ''}`} onClick={editVersion}>
            {t('globals.save', 'Save')}
          </button>
        </div>
      </div>
    </Modal>
  );
};
