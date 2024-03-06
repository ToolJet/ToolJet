import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { copyToClipboard } from '@/_helpers/appUtils';
import { useTranslation } from 'react-i18next';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { getHostURL } from '@/_helpers/routes';
import Modal from '@/HomePage/Modal';
import { organizationService, instanceSettingsService } from '@/_services';
import WorkspaceSSOEnableModal from './WorkspaceSSOEnableModal';

export function OpenIdSSOModal({
  settings,
  onClose,
  onUpdateSSOSettings,
  isInstanceOptionEnabled,
  instanceLevel = false,
}) {
  const [showModal, setShowModal] = useState(false);
  const [enabled, setEnabled] = useState(settings?.enabled || false);
  const [clientId, setClientId] = useState(settings?.configs?.client_id || '');
  const [clientSecret, setClientSecret] = useState(settings?.configs?.client_secret || '');
  const [name, setName] = useState(settings?.configs?.name || '');
  const [wellKnownUrl, setWellKnownUrl] = useState(settings?.configs?.well_known_url || '');
  const [isSaving, setSaving] = useState(false);
  const [configId, setConfigId] = useState(settings?.id);
  const [hasChanges, setHasChanges] = useState(false);
  const [showEnablingWorkspaceSSOModal, setShowEnablingWorkspaceSSOModal] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setEnabled(settings?.enabled || false);
    setClientId(settings?.configs?.client_id || '');
    setClientSecret(settings?.configs?.client_secret || '');
    setName(settings?.configs?.name || '');
    setWellKnownUrl(settings?.configs?.well_known_url || '');
    setShowModal(true);
  }, [settings]);

  useEffect(() => {
    checkChanges();
  }, [clientId, enabled, clientSecret, name, wellKnownUrl]);

  const handleClientIdChange = (newClientId) => {
    setClientId(newClientId);
    checkChanges();
  };

  const handleClientSecretChange = (newClientSecret) => {
    setClientSecret(newClientSecret);
    checkChanges();
  };

  const handleNameChange = (newName) => {
    setName(newName);
    checkChanges();
  };

  const handleWellKnownUrlChange = (newWellKnownUrl) => {
    setWellKnownUrl(newWellKnownUrl);
    checkChanges();
  };

  const copyFunction = (input) => {
    let text = document.getElementById(input).innerHTML;
    copyToClipboard(text);
  };

  const onToggleChange = () => {
    const newEnabledStatus = !enabled;
    setEnabled(newEnabledStatus);
    checkChanges();
  };

  const checkChanges = () => {
    const hasClientIdChanged = clientId !== (settings?.configs?.client_id || '');
    const hasEnabledChanged = enabled !== (settings?.enabled || false);
    const hasClientSecretChanged = clientSecret !== (settings?.client_secret || '');
    const hasNameChanged = name !== (settings?.configs?.name || '');
    const hasWellKnownURLChanged = wellKnownUrl != (settings?.configs?.well_known_url || '');
    setHasChanges(
      hasClientIdChanged || hasEnabledChanged || hasNameChanged || hasClientSecretChanged || hasWellKnownURLChanged
    );
  };

  const reset = () => {
    setClientId(settings?.configs?.client_id || '');
    setClientSecret(settings?.configs?.client_secret || '');
    setName(settings?.configs?.host_name || '');
    setEnabled(settings?.enabled || false);
    setWellKnownUrl(settings?.configs?.well_known_url || '');
    setHasChanges(false);
  };

  const saveOrganizationSettings = () => {
    setSaving(true);
    organizationService
      .editOrganizationConfigs({
        type: 'openid',
        configs: { name, clientId, clientSecret, wellKnownUrl },
        enabled: enabled,
      })
      .then(
        (data) => {
          setSaving(false);
          data.id && setConfigId(data.id);
          onUpdateSSOSettings('openid', {
            id: data?.id || configId,
            configs: { name: name, client_id: clientId, client_secret: clientSecret, well_known_url: wellKnownUrl },
            enabled: enabled,
          });
          toast.success('Saved OpenID SSO configurations', {
            position: 'top-center',
          });
        },
        () => {
          setSaving(false);
          toast.error('Error while saving OpenID SSO configurations', {
            position: 'top-center',
          });
        }
      );
    setHasChanges(false);
  };

  const saveInstanceSettings = () => {
    setSaving(true);
    instanceSettingsService
      .updateSSOConfigs({
        type: 'openid',
        configs: { name, clientId, clientSecret, wellKnownUrl },
        enabled: enabled,
      })
      .then(
        (data) => {
          setSaving(false);
          data.id && setConfigId(data.id);
          onUpdateSSOSettings('openid', {
            id: data?.id || configId,
            configs: { name: name, client_id: clientId, client_secret: clientSecret, well_known_url: wellKnownUrl },
            enabled: enabled,
          });
          toast.success('Saved OpenID SSO configurations', {
            position: 'top-center',
          });
        },
        () => {
          setSaving(false);
          toast.error('Error while saving OpenID SSO configurations', {
            position: 'top-center',
          });
        }
      );
    setHasChanges(false);
  };

  const initiateSave = () => {
    if (!instanceLevel && enabled != settings?.enabled && enabled === true && isInstanceOptionEnabled('openid')) {
      setShowEnablingWorkspaceSSOModal(true);
    } else {
      if (instanceLevel) {
        saveInstanceSettings();
      } else {
        saveOrganizationSettings();
      }
    }
  };

  // OpenIdHeader Component
  function OpenIdHeader() {
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
          <label className="switch">
            <input type="checkbox" checked={enabled} onChange={onToggleChange} data-cy="openid-toggle-input" />
            <span className="slider round"></span>
          </label>
          <span className="sso-type-header" data-cy="card-title" style={{ marginBottom: '0px', fontWeight: '500' }}>
            {t('header.organization.menus.manageSSO.openid.title', 'OpenID Connect')}
          </span>
        </div>
        <div className="card-title" style={{ marginBottom: '0px' }}>
          <span className={`tj-text-xsm ${enabled ? 'enabled-tag' : 'disabled-tag'}`} data-cy="status-label">
            {enabled
              ? t('header.organization.menus.manageSSO.openid.enabled', 'Enabled')
              : t('header.organization.menus.manageSSO.openid.disabled', 'Disabled')}
          </span>
        </div>
      </div>
    );
  }

  // GoogleFooter Component
  function OpenIdFooter() {
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
    return <OpenIdHeader />;
  };

  const renderFooterContent = () => {
    return <OpenIdFooter />;
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
          <div className="sso-card-wrapper">
            <div className="card-body">
              <form noValidate className="sso-form-wrap">
                <div className="form-group mb-3">
                  <label className="form-label" data-cy="name-label">
                    Name
                  </label>
                  <div>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter Name"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      data-cy="name-input"
                    />
                  </div>
                </div>
                <div className="form-group mb-3">
                  <label className="form-label" data-cy="client-id-label">
                    Client ID
                  </label>
                  <div>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter Client ID"
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
                  <div>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter Client secret"
                      value={clientSecret}
                      onChange={(e) => handleClientSecretChange(e.target.value)}
                      data-cy="client-secret-input"
                    />
                  </div>
                </div>
                <div className="form-group mb-3">
                  <label className="form-label" data-cy="well-known-url-label">
                    Well known URL
                  </label>
                  <div>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter Well known URL"
                      value={wellKnownUrl}
                      onChange={(e) => handleWellKnownUrlChange(e.target.value)}
                      data-cy="well-known-url-input"
                    />
                  </div>
                </div>
                {configId && (
                  <div className="form-group mb-3">
                    <label className="form-label" data-cy="redirect-url-label">
                      {t('header.organization.menus.manageSSO.openid.redirectUrl', 'Redirect URL')}
                    </label>
                    <div className="d-flex justify-content-between form-control align-items-center">
                      <p data-cy="redirect-url" id="redirect-url">{`${getHostURL()}/sso/openid/${configId}`}</p>
                      <SolidIcon name="copy" width="16" onClick={() => copyFunction('redirect-url')} />
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </Modal>
      )}
      {showEnablingWorkspaceSSOModal && (
        <WorkspaceSSOEnableModal
          show={showEnablingWorkspaceSSOModal}
          ssoKey={'OpenID Connect'}
          saveSettings={saveOrganizationSettings}
          setShowModal={setShowEnablingWorkspaceSSOModal}
          reset={reset}
        />
      )}
    </div>
  );
}
