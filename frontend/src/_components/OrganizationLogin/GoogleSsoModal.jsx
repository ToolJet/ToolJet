import React, { useState, useEffect } from 'react';
import Modal from '@/HomePage/Modal';
import { useTranslation } from 'react-i18next';
import { organizationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { copyToClipboard } from '@/_helpers/appUtils';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import WorkspaceSSOEnableModal from './WorkspaceSSOEnableModal';

export function GoogleSSOModal({ settings, onClose, onUpdateSSOSettings, isInstanceOptionEnabled }) {
  const [showModal, setShowModal] = useState(false);
  const [ssoSettings, setSettings] = useState(settings);
  const [enabled, setEnabled] = useState(settings?.enabled || false);
  const [isSaving, setSaving] = useState(false);
  const [configId, setConfigId] = useState(settings?.id);
  const [clientId, setClientId] = useState(settings?.configs?.client_id || '');
  const [hasChanges, setHasChanges] = useState(false);
  const [showEnablingWorkspaceSSOModal, setShowEnablingWorkspaceSSOModal] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setSettings(settings);
    setEnabled(settings?.enabled || false);
    setClientId(settings?.configs?.client_id || '');
    setShowModal(true);
  }, [settings]);

  useEffect(() => {
    checkChanges();
  }, [clientId, enabled]);

  const handleClientIdChange = (newClientId) => {
    setClientId(newClientId);
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
    setHasChanges(hasClientIdChanged || hasEnabledChanged);
  };

  const reset = () => {
    setClientId(settings?.configs?.client_id || '');
    setEnabled(settings?.enabled || false);
    setHasChanges(false);
  };

  const copyFunction = (input) => {
    let text = document.getElementById(input).innerHTML;
    copyToClipboard(text);
  };

  const saveSettings = () => {
    setSaving(true);
    organizationService.editOrganizationConfigs({ type: 'google', configs: { clientId }, enabled: enabled }).then(
      (data) => {
        setSaving(false);
        data.id && setConfigId(data.id);
        onUpdateSSOSettings('google', { id: data?.id || configId, configs: { client_id: clientId }, enabled: enabled });
        setSettings({ id: data?.id || configId, configs: { client_id: clientId }, enabled: enabled });
        toast.success('Saved Google SSO configurations', {
          position: 'top-center',
        });
      },
      () => {
        setSaving(false);
        toast.error('Error while saving Google SSO configurations', {
          position: 'top-center',
        });
      }
    );
    setHasChanges(false);
  };

  const initiateSave = () => {
    if (enabled != settings?.enabled && enabled === true && isInstanceOptionEnabled('google')) {
      setShowEnablingWorkspaceSSOModal(true);
    } else {
      saveSettings();
    }
  };

  // GoogleHeader Component
  function GoogleHeader() {
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
          <label className="switch" data-cy="google-enable-toggle">
            <input type="checkbox" checked={enabled} onChange={onToggleChange} />
            <span className="slider round"></span>
          </label>
          <span className="sso-type-header" data-cy="card-title" style={{ marginBottom: '0px', fontWeight: '500' }}>
            {t('header.organization.menus.manageSSO.google.title', 'Google')}
          </span>
        </div>
        <div className="card-title" style={{ marginBottom: '0px' }}>
          <span className={`tj-text-xsm ${enabled ? 'enabled-tag' : 'disabled-tag'}`} data-cy="status-label">
            {enabled
              ? t('header.organization.menus.manageSSO.google.enabled', 'Enabled')
              : t('header.organization.menus.manageSSO.google.disabled', 'Disabled')}
          </span>
        </div>
      </div>
    );
  }

  // GoogleFooter Component
  function GoogleFooter() {
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
    return <GoogleHeader />;
  };

  const renderFooterContent = () => {
    return <GoogleFooter />;
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
                    <label className="form-label" data-cy="client-id-label">
                      {'Client ID'}
                    </label>
                    <div className="tj-app-input">
                      <input
                        type="text "
                        className="form-control"
                        placeholder={'Enter Client ID'}
                        value={clientId}
                        onChange={(e) => handleClientIdChange(e.target.value)}
                        data-cy="client-id-input"
                      />
                    </div>
                  </div>
                  {configId && (
                    <div className="form-group mb-3">
                      <label className="form-label" data-cy="redirect-url-label">
                        {t('header.organization.menus.manageSSO.google.redirectUrl', 'Redirect URL')}
                      </label>
                      <div className="d-flex justify-content-between form-control align-items-center">
                        <p data-cy="redirect-url" id="redirect-url">{`${window.public_config?.TOOLJET_HOST}${
                          window.public_config?.SUB_PATH ? window.public_config?.SUB_PATH : '/'
                        }sso/google/${configId}`}</p>
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
          ssoKey={'google'}
          saveSettings={saveSettings}
          setShowModal={setShowEnablingWorkspaceSSOModal}
          reset={reset}
        />
      )}
    </div>
  );
}
