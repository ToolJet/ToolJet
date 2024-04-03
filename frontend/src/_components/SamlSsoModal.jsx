import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { copyToClipboard } from '@/_helpers/appUtils';
import { useTranslation } from 'react-i18next';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import Modal from '@/HomePage/Modal';
import { organizationService, instanceSettingsService } from '@/_services';
import config from 'config';
import WorkspaceSSOEnableModal from './WorkspaceSSOEnableModal';

export function SamlSSOModal({
  settings,
  onClose,
  onUpdateSSOSettings,
  isInstanceOptionEnabled,
  instanceLevel = false,
}) {
  const [showModal, setShowModal] = useState(false);
  const [enabled, setEnabled] = useState(settings?.enabled || false);
  const [idpMetadata, setIdpMetadata] = useState(settings?.configs?.idp_metadata || '');
  const [groupAttribute, setGroupAttribute] = useState(settings?.configs?.group_attribute || 'groups');
  const [name, setName] = useState(settings?.configs?.name || '');
  const [isSaving, setSaving] = useState(false);
  const [configId, setConfigId] = useState(settings?.id);
  const [hasChanges, setHasChanges] = useState(false);
  const [showEnablingWorkspaceSSOModal, setShowEnablingWorkspaceSSOModal] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setEnabled(settings?.enabled || false);
    setShowModal(true);
    setIdpMetadata(settings?.configs?.idp_metadata || '');
    setGroupAttribute(settings?.configs?.group_attribute || '');
    setName(settings?.configs?.name || '');
    setConfigId(settings?.id);
  }, [settings]);

  useEffect(() => {
    checkChanges();
  }, [name, enabled, idpMetadata, groupAttribute]);

  const copyFunction = (input) => {
    let text = document.getElementById(input).innerHTML;
    copyToClipboard(text);
  };

  const getServerUrl = () => {
    const SERVER_URL = config.TOOLJET_SERVER_URL || window.public_config?.TOOLJET_HOST;
    const apiUrl = config.apiUrl;
    try {
      new URL(apiUrl);
      return apiUrl;
    } catch (error) {
      return `${SERVER_URL}${apiUrl}`;
    }
  };

  const handleNameChange = (newName) => {
    setName(newName);
    checkChanges();
  };

  const handleIdpMetadataChange = (newIdpMetadat) => {
    setIdpMetadata(newIdpMetadat);
    checkChanges();
  };

  const handleGroupAttributeChange = (newGroupAttribute) => {
    setGroupAttribute(newGroupAttribute);
    checkChanges();
  };

  const checkChanges = () => {
    const hasNameChanged = name !== (settings?.configs?.name || '');
    const hasEnabledChanged = enabled !== (settings?.enabled || false);
    const hasIdpMetadataChanged = idpMetadata !== (settings?.configs?.idp_metadata || '');
    const hasGroupAttributeChanged = groupAttribute !== (settings?.configs?.group_attribute || '');
    setHasChanges(hasNameChanged || hasEnabledChanged || hasIdpMetadataChanged || hasGroupAttributeChanged);
  };

  const onToggleChange = () => {
    const newEnabledStatus = !enabled;
    setEnabled(newEnabledStatus);
    checkChanges();
  };

  const reset = () => {
    setName(settings?.configs?.name || '');
    setIdpMetadata(settings?.configs?.idp_metadata || '');
    setGroupAttribute(settings?.configs?.group_attribute || '');
    setEnabled(settings?.enabled || false);
    setHasChanges(false);
  };

  const saveOrganizationSettings = () => {
    setSaving(true);
    organizationService
      .editOrganizationConfigs({ type: 'saml', configs: { name, idpMetadata, groupAttribute }, enabled: enabled })
      .then(
        (data) => {
          setSaving(false);
          data.id && setConfigId(data.id);
          onUpdateSSOSettings('saml', {
            id: data?.id || configId,
            configs: { name, idp_metadata: idpMetadata, group_attribute: groupAttribute },
            enabled: enabled,
          });
          toast.success('Saved SAML SSO configurations', {
            position: 'top-center',
          });
        },
        () => {
          setSaving(false);
          toast.error('Error while saving SAML SSO configurations', {
            position: 'top-center',
          });
        }
      );
    setHasChanges(false);
  };

  const saveInstanceSettings = () => {
    setSaving(true);
    instanceSettingsService
      .updateSSOConfigs({ type: 'saml', configs: { name, idpMetadata, groupAttribute }, enabled: enabled })
      .then(
        (data) => {
          setSaving(false);
          data.id && setConfigId(data.id);
          onUpdateSSOSettings('saml', {
            id: data?.id || configId,
            configs: { name, idp_metadata: idpMetadata, group_attribute: groupAttribute },
            enabled: enabled,
          });
          toast.success('Saved SAML SSO configurations', {
            position: 'top-center',
          });
        },
        () => {
          setSaving(false);
          toast.error('Error while saving SAML SSO configurations', {
            position: 'top-center',
          });
        }
      );
    setHasChanges(false);
  };

  const initiateSave = () => {
    if (!instanceLevel && enabled != settings?.enabled && enabled === true && isInstanceOptionEnabled('saml')) {
      setShowEnablingWorkspaceSSOModal(true);
    } else {
      if (instanceLevel) {
        saveInstanceSettings();
      } else {
        saveOrganizationSettings();
      }
    }
  };

  // SamlHeader Component
  function SamlHeader() {
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
          <label className="switch" data-cy="saml-toggle-input">
            <input type="checkbox" checked={enabled} onChange={onToggleChange} />
            <span className="slider round"></span>
          </label>
          <span
            className="sso-type-header"
            data-cy="saml-toggle-label"
            style={{ marginBottom: '0px', fontWeight: '500' }}
          >
            {t('header.organization.menus.manageSSO.saml.title', 'SAML')}
          </span>
        </div>
        <div className="card-title" style={{ marginBottom: '0px' }}>
          <span className={`tj-text-xsm ${enabled ? 'enabled-tag' : 'disabled-tag'}`} data-cy="status-label">
            {enabled
              ? t('header.organization.menus.manageSSO.saml.enabled', 'Enabled')
              : t('header.organization.menus.manageSSO.saml.disabled', 'Disabled')}
          </span>
        </div>
      </div>
    );
  }

  // SamlFooter Component
  function SamlFooter() {
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
    return <SamlHeader />;
  };

  const renderFooterContent = () => {
    return <SamlFooter />;
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
                  <label className="form-label" data-cy="idp-metadata-label">
                    Identity provider metadata
                  </label>
                  <div>
                    <textarea
                      className="form-control"
                      placeholder="Enter IDP metadata in XML format"
                      value={idpMetadata}
                      onChange={(e) => handleIdpMetadataChange(e.target.value)}
                      data-cy="dp-metadata-input"
                      style={{ height: '116px' }}
                    />
                    <small className="form-note" style={{ color: '#6c757d' }} data-cy="base-dn-helper-text">
                      {t(
                        'header.organization.menus.manageSSO.saml.idpHelperText',
                        "Ensure the Identity provider metadata is in XML format. You can download it from your IdP's site"
                      )}
                    </small>
                  </div>
                </div>
                <div className="form-group mb-3">
                  <label className="form-label" data-cy="group-attribute-label">
                    {t('header.organization.menus.manageSSO.saml.groupAttribute', 'Group attribute')}
                  </label>
                  <div>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter group attribute"
                      value={groupAttribute}
                      onChange={(e) => handleGroupAttributeChange(e.target.value)}
                      data-cy="group-attribute-input"
                    />
                    <small className="form-note" style={{ color: '#6c757d' }} data-cy="group-attribute-helper-text">
                      {t(
                        'header.organization.menus.manageSSO.saml.groupAttributeHelper',
                        'Define attribute for user-to-group mapping based on the IdP'
                      )}
                    </small>
                  </div>
                </div>
                {configId && (
                  <div className="form-group mb-3">
                    <label className="form-label" data-cy="redirect-url-label">
                      {t('header.organization.menus.manageSSO.saml.redirectUrl', 'Redirect URL')}
                    </label>
                    <div className="d-flex justify-content-between form-control align-items-center">
                      <p data-cy="redirect-url" id="redirect-url">
                        {`${getServerUrl()}/sso/saml/${configId}`}
                      </p>
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
          ssoKey={'saml'}
          saveSettings={saveOrganizationSettings}
          setShowModal={setShowEnablingWorkspaceSSOModal}
          reset={reset}
        />
      )}
    </div>
  );
}
