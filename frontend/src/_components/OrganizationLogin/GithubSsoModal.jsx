import React, { useState, useEffect } from 'react';
import Modal from '@/HomePage/Modal';
import { useTranslation } from 'react-i18next';
import { organizationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { copyToClipboard } from '@/_helpers/appUtils';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import WorkspaceSSOEnableModal from './WorkspaceSSOEnableModal';

export function GithubSSOModal({ settings, onClose, onUpdateSSOSettings, isInstanceOptionEnabled }) {
  const [showModal, setShowModal] = useState(false);
  const [ssoSettings, setSettings] = useState(settings);
  const [enabled, setEnabled] = useState(settings?.enabled || false);
  const [isSaving, setSaving] = useState(false);
  const [configId, setConfigId] = useState(settings?.id);
  const [clientId, setClientId] = useState(settings?.configs?.client_id || '');
  const [hostName, setHostName] = useState(settings?.configs?.host_name || '');
  const [clientSecret, setClientSecret] = useState(settings?.configs?.client_secret || '');
  const [hasChanges, setHasChanges] = useState(false);
  const [showEnablingWorkspaceSSOModal, setShowEnablingWorkspaceSSOModal] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setSettings(settings);
    setEnabled(settings?.enabled || false);
    setClientId(settings?.configs?.client_id || '');
    setHostName(settings?.configs?.host_name || '');
    setClientSecret(settings?.configs?.client_secret || '');
    setShowModal(true);
  }, [settings]);

  useEffect(() => {
    checkChanges();
  }, [clientId, enabled, hostName, clientSecret]);

  const handleClientIdChange = (newClientId) => {
    setClientId(newClientId);
    const changesMade = newClientId !== settings?.configs?.client_id;
    checkChanges();
  };

  const handleHostNameChange = (newHostName) => {
    setHostName(newHostName);
    const changesMade = newHostName !== settings?.configs?.host_name;
    checkChanges();
  };

  const handleClientSecretChange = (newClientSecret) => {
    setClientSecret(newClientSecret);
    const changesMade = newClientSecret !== settings?.configs?.client_secret;
    checkChanges();
  };

  const onToggleChange = () => {
    const newEnabledStatus = !enabled;
    setEnabled(newEnabledStatus);
    checkChanges();
  };

  const checkChanges = () => {
    const hasClientIdChanged = clientId !== settings?.configs?.client_id;
    const hasEnabledChanged = enabled !== settings?.enabled;
    const hasHostNameChanged = hostName !== settings?.configs?.host_name;
    const hasClientSecretChanged = clientSecret != settings?.configs?.client_secret;
    setHasChanges(hasClientIdChanged || hasEnabledChanged || hasHostNameChanged || hasClientSecretChanged);
  };

  const reset = () => {
    setClientId(settings?.configs?.client_id || '');
    setClientSecret(settings?.configs?.client_secret || '');
    setHostName(settings?.configs?.host_name || '');
    setEnabled(settings?.enabled || false);
    setHasChanges(false);
  };

  const copyFunction = (input) => {
    let text = document.getElementById(input).innerHTML;
    copyToClipboard(text);
  };

  const saveSettings = () => {
    setSaving(true);
    organizationService
      .editOrganizationConfigs({ type: 'git', configs: { clientId, clientSecret, hostName }, enabled: enabled })
      .then(
        (data) => {
          setSaving(false);
          data.id && setConfigId(data.id);
          onUpdateSSOSettings('git', {
            id: data?.id || configId,
            configs: { client_id: clientId, client_secret: clientSecret, host_name: hostName },
            enabled: enabled,
          });
          setSettings({
            id: data?.id || configId,
            configs: { client_id: clientId, client_secret: clientSecret, host_name: hostName },
          });
          toast.success('Saved Git SSO configurations', {
            position: 'top-center',
          });
        },
        () => {
          setSaving(false);
          toast.error('Error while saving Git SSO configurations', {
            position: 'top-center',
          });
        }
      );
    setHasChanges(false);
  };

  const initiateSave = () => {
    if (enabled != settings?.enabled && enabled === true && isInstanceOptionEnabled('git')) {
      setShowEnablingWorkspaceSSOModal(true);
    } else {
      saveSettings();
    }
  };

  // GitHeader Component
  function GithubHeader() {
    const { t } = useTranslation();
    return (
      <div
        className="d-flex justify-content-between title-with-toggle"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          marginBottom: '0px',
          height: '42px',
        }}
      >
        <div>
          <label className="switch" data-cy="github-toggle-input">
            <input type="checkbox" checked={enabled} onChange={onToggleChange} />
            <span className="slider round"></span>
          </label>
          <span className="sso-type-header" data-cy="card-title" style={{ marginBottom: '0px', fontWeight: '500' }}>
            {t('header.organization.menus.manageSSO.github.title', 'Github')}
          </span>
        </div>
        <div className="card-title" style={{ marginBottom: '0px' }}>
          <span className={`tj-text-xsm ${enabled ? 'enabled-tag' : 'disabled-tag'}`} data-cy="status-label">
            {enabled
              ? t('header.organization.menus.manageSSO.github.enabled', 'Enabled')
              : t('header.organization.menus.manageSSO.github.disabled', 'Disabled')}
          </span>
        </div>
      </div>
    );
  }

  // GitFooter Component
  function GithubFooter() {
    const { t } = useTranslation();
    return (
      <div className="form-footer sso-card-footer" style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
        <ButtonSolid onClick={onClose} data-cy="cancel-button" variant="tertiary" className="sso-footer-cancel-btn">
          {t('globals.cancel', 'Cancel')}
        </ButtonSolid>
        <ButtonSolid
          disabled={!hasChanges || isSaving}
          isLoading={isSaving}
          onClick={initiateSave}
          data-cy="save-button"
          variant="primary"
          className="sso-footer-save-btn"
          leftIcon="floppydisk"
          fill="#fff"
          iconWidth="20"
        >
          {t('globals.savechanges', 'Save changes')}
        </ButtonSolid>
      </div>
    );
  }

  const renderModalTitle = () => {
    return <GithubHeader />;
  };

  const renderFooterContent = () => {
    return <GithubFooter />;
  };

  return (
    <div>
      {showModal && (
        <Modal
          show={showModal}
          closeModal={onClose}
          title={renderModalTitle()}
          footerContent={renderFooterContent()}
          customClassName="modal-custom-height"
          size="lg"
          closeButton={false}
        >
          {showEnablingWorkspaceSSOModal && <div className="overlay-style"></div>}
          {
            <div className="sso-card-wrapper">
              <div className="card-body">
                <form noValidate className="sso-form-wrap">
                  <div className="form-group mb-3">
                    <label className="form-label" data-cy="host-name-label">
                      {'Host name'}
                    </label>
                    <div className="tj-app-input">
                      <input
                        type="text"
                        className="form-control"
                        placeholder={'Enter Host name'}
                        value={hostName}
                        onChange={(e) => handleHostNameChange(e.target.value)}
                        data-cy="host-name-input"
                      />
                    </div>
                    <div>
                      <div data-cy="git-sso-help-text" className=" tj-text-xxsm git-sso-help-text">
                        {t(
                          'header.organization.menus.manageSSO.github.requiredGithub',
                          'Required if GitHub is self hosted'
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="form-group mb-3">
                    <label className="form-label" data-cy="client-id-label">
                      {'Client ID'}
                    </label>
                    <div className="tj-app-input">
                      <input
                        type="text"
                        className="form-control"
                        placeholder={'Enter Client ID'}
                        value={clientId}
                        onChange={(e) => handleClientIdChange(e.target.value)}
                        data-cy="client-id-input"
                      />
                    </div>
                  </div>
                  <div className="form-group mb-3">
                    <label className="form-label" data-cy="client-secret-label">
                      {'Client secret'}
                      <small className="git- mx-2" data-cy="encripted-label">
                        <SolidIcon name="lock" width="16" />
                        {t('header.organization.menus.manageSSO.github.encrypted', 'Encrypted')}
                      </small>
                    </label>
                    <div className="tj-app-input">
                      <input
                        type="text"
                        className="form-control"
                        placeholder={'Enter Client secret'}
                        value={clientSecret}
                        onChange={(e) => handleClientSecretChange(e.target.value)}
                        data-cy="client-secret-input"
                      />
                    </div>
                  </div>
                  {configId && (
                    <div className="form-group mb-3">
                      <label className="form-label" data-cy="redirect-url-label">
                        {t('header.organization.menus.manageSSO.github.redirectUrl', 'Redirect URL')}
                      </label>
                      <div className="d-flex justify-content-between form-control align-items-center">
                        <p data-cy="redirect-url" id="redirect-url">{`${window.public_config?.TOOLJET_HOST}${
                          window.public_config?.SUB_PATH ? window.public_config?.SUB_PATH : '/'
                        }sso/git/${configId}`}</p>
                        <SolidIcon name="copy" width="16" onClick={() => copyFunction('redirect-url')} />
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>
          }
        </Modal>
      )}
      {showEnablingWorkspaceSSOModal && (
        <WorkspaceSSOEnableModal
          show={showEnablingWorkspaceSSOModal}
          ssoKey={'git'}
          saveSettings={saveSettings}
          setShowModal={setShowEnablingWorkspaceSSOModal}
          reset={reset}
        />
      )}
    </div>
  );
}
