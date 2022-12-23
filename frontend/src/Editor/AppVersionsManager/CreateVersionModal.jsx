import React, { useState } from 'react';
import { appVersionService } from '@/_services';
import Modal from '../../HomePage/Modal';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useHotkeys } from 'react-hotkeys-hook';
import Select from '@/_ui/Select';

export const CreateVersion = ({
  appId,
  appVersions,
  setAppVersions,
  setAppDefinitionFromVersion,
  editingVersion,
  showCreateAppVersion,
  setShowCreateAppVersion,
  showCreateVersionModalPrompt,
  closeCreateVersionModalPrompt,
}) => {
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [versionName, setVersionName] = useState('');
  const { t } = useTranslation();
  useHotkeys('enter', () => createVersion());

  const createVersion = () => {
    if (versionName.trim().length > 25) {
      toast.error('The version name should not be longer than 25 characters');
      return;
    }
    if (versionName.trim() == '') {
      toast.error('The version name should not be empty');
      return;
    }

    setIsCreatingVersion(true);
    appVersionService
      .create(appId, versionName, editingVersion.id)
      .then(() => {
        toast.success('Version Created');
        appVersionService.getAll(appId).then((data) => {
          setVersionName('');
          setIsCreatingVersion(false);
          setAppVersions(data.versions);
          const latestVersion = data.versions.at(0);
          setAppDefinitionFromVersion(latestVersion);
          setShowCreateAppVersion(false);
          closeCreateVersionModalPrompt();
        });
      })
      .catch((error) => {
        toast.error(error?.error);
        setIsCreatingVersion(false);
      });
  };

  const options = appVersions.map((version) => {
    return { label: version.name, value: version };
  });

  return (
    <Modal
      show={showCreateAppVersion || showCreateVersionModalPrompt}
      closeModal={() => setShowCreateAppVersion(false)}
      title={t('editor.appVersionManager.createVersion', 'Create Version')}
    >
      <div className="mb-3">
        <div className="col">
          <label className="form-label">{t('editor.appVersionManager.versionName', 'Version Name')}</label>
          <input
            type="text"
            onChange={(e) => setVersionName(e.target.value)}
            className="form-control"
            placeholder={t('editor.appVersionManager.enterVersionName', 'Enter version name')}
            disabled={isCreatingVersion}
            value={versionName}
            autoFocus={true}
            minLength="1"
            maxLength="25"
          />
        </div>
      </div>

      <div className="mb-3" style={{ padding: '2rem 0' }}>
        <label className="form-label">{t('editor.appVersionManager.createVersionFrom', 'Create version from')}</label>
        <div className="ts-control">
          <Select
            options={options}
            defaultValue={options[options.length - 1]}
            onChange={(version) => {
              setAppDefinitionFromVersion(version);
            }}
            useMenuPortal={false}
            width="100%"
            maxMenuHeight={100}
          />
        </div>
      </div>

      {showCreateVersionModalPrompt && (
        <div className="mb-3">
          <div className="light border rounded">
            <div className="container">
              <div className="row py-3">
                <div className="col-1 py-2">
                  <span className="pe-1">
                    <img src={'assets/images/icons/editor/bulb-sharp.svg'} />
                  </span>
                </div>
                <div className="col">
                  <span>
                    {t(
                      'editor.appVersionManager.versionAlreadyReleased',
                      `Version already released. Kindly create a new version or switch to a different version to continue
                      making changes.`
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-3">
        <div className="col d-flex modal-footer-btn">
          <button
            className="btn btn-light"
            onClick={() => {
              closeCreateVersionModalPrompt();
              setShowCreateAppVersion(false);
            }}
          >
            {t('globals.cancel', 'Cancel')}
          </button>
          <button
            className={`btn btn-primary ${isCreatingVersion ? 'btn-loading' : ''}`}
            onClick={() => createVersion()}
          >
            {t('editor.appVersionManager.createVersion', 'Create Version')}
          </button>
        </div>
      </div>
    </Modal>
  );
};
