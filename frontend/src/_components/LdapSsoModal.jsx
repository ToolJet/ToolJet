import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { copyToClipboard } from '@/_helpers/appUtils';
import { useTranslation } from 'react-i18next';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import Modal from '@/HomePage/Modal';
import { organizationService, instanceSettingsService } from '@/_services';
import Select from 'react-select';
import WorkspaceSSOEnableModal from './WorkspaceSSOEnableModal';

export function LdapSSOModal({ settings, onClose, onUpdateSSOSettings, isInstanceOptionEnabled, instanceLevel }) {
  const [showModal, setShowModal] = useState(false);
  const [enabled, setEnabled] = useState(settings?.enabled || false);
  const [name, setName] = useState(settings?.configs?.name || '');
  const [host, setHost] = useState(settings?.configs?.host || '');
  const [port, setPort] = useState(settings?.configs?.port || '');
  const [sslOption, setSSLOption] = useState(() => {
    const sslConfig = settings?.configs?.ssl_certs;
    return sslConfig && (sslConfig.client_key || sslConfig.client_cert || sslConfig.server_cert)
      ? 'Certificates'
      : 'None';
  });
  const [clientKey, setClientKey] = useState(settings?.configs?.ssl_certs?.client_key || '');
  const [clientCert, setClientCert] = useState(settings?.configs?.ssl_certs?.client_cert || '');
  const [serverCert, setServerCert] = useState(settings?.configs?.ssl_certs?.server_cert || '');
  const [basedn, setBaseDN] = useState(settings?.configs?.basedn || '');
  const [nameError, setNameError] = useState('');
  const [enableSSL, setSSLState] = useState(settings?.configs?.ssl || false);
  const [isSaving, setSaving] = useState(false);
  const [configId, setConfigId] = useState(settings?.id);
  const [hasChanges, setHasChanges] = useState(false);
  const [showEnablingWorkspaceSSOModal, setShowEnablingWorkspaceSSOModal] = useState(false);
  const { t } = useTranslation();

  const MAX_NAME_LENGTH = 25;

  useEffect(() => {
    setEnabled(settings?.enabled || false);
    setName(settings?.configs?.name || '');
    setHost(settings?.configs?.host || '');
    setPort(settings?.configs?.port || '');
    setSSLOption(
      settings?.configs?.ssl_certs &&
        (settings?.configs?.ssl_certs.client_key ||
          settings?.configs?.ssl_certs.client_cert ||
          settings?.configs?.ssl_certs.server_cert)
        ? 'Certificates'
        : 'None'
    );
    setClientKey(settings?.configs?.ssl_certs?.client_key || '');
    setClientCert(settings?.configs?.ssl_certs?.client_cert || '');
    setServerCert(settings?.configs?.ssl_certs?.server_cert || '');
    setBaseDN(settings?.configs?.basedn || '');
    setSSLState(settings?.configs?.ssl || false);
    setConfigId(settings?.id);
    setShowModal(true);
  }, [settings]);

  useEffect(() => {
    checkChanges();
  }, [name, enabled, host, port, clientKey, clientCert, serverCert, basedn, enableSSL]);

  const handleNameChange = (newName) => {
    if (newName.length > MAX_NAME_LENGTH) {
      setNameError('Name should not exceed 25 characters.');
    } else {
      setNameError(''); // Clear the error message if the name is within the limit
      setName(newName);
    }
    checkChanges();
  };

  const handleHostChange = (newHost) => {
    setHost(newHost);
    checkChanges();
  };

  const handlePortChange = (newPort) => {
    setPort(newPort);
    checkChanges();
  };

  const handleBaseDNChange = (newBaseDN) => {
    setBaseDN(newBaseDN);
    checkChanges();
  };

  const handleClientKeyChange = (newClientKey) => {
    setClientKey(newClientKey);
    checkChanges();
  };

  const handleClientCertChange = (newClientCert) => {
    setClientCert(newClientCert);
    checkChanges();
  };

  const handleServerCertChange = (newServerCert) => {
    setServerCert(newServerCert);
    checkChanges();
  };

  const handleSSLChange = (newSSLState) => {
    setSSLState(newSSLState);
    checkChanges();
  };

  const handleBlur = () => {
    setNameError('');
  };

  const sslOptions = [
    { label: 'None', value: 'None' },
    { label: 'Certificates', value: 'Certificates' },
  ];
  const customStyles = {
    control: (provided) => ({
      ...provided,
      backgroundColor: '#F1F3F5',
      borderColor: '#E5E7EB',
      borderRadius: '4px',
      height: '36px',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#E6E8EB' : state.isFocused ? '#F1F3F5' : 'transparent',
      color: '#000000',
      minHeight: '36px',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: '8px',
      cursor: 'pointer',
    }),
    errorMessage: {
      color: 'var(--tomato9)',
      fontSize: '12px',
      marginTop: '4px',
    },
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
    const hasNameChanged = name !== (settings?.configs?.name || '');
    const hasEnabledChanged = enabled !== (settings?.enabled || false);
    const hasHostChanged = host !== (settings?.configs?.host || '');
    const hasPortChanged = port !== (settings?.configs?.port || '');
    const hasClientKeyChanged = clientKey !== (settings?.configs?.ssl_certs?.client_key || '');
    const hasClientCertChanged = clientCert !== (settings?.configs?.ssl_certs?.client_cert || '');
    const hasServerCertChanged = serverCert !== (settings?.configs?.ssl_certs?.server_cert || '');
    const hasBaseDNChanged = basedn !== (settings?.configs?.basedn || '');
    const hasSSLStateChanged = enableSSL !== (settings?.configs?.ssl || false);
    setHasChanges(
      hasNameChanged ||
        hasEnabledChanged ||
        hasHostChanged ||
        hasPortChanged ||
        hasClientKeyChanged ||
        hasClientCertChanged ||
        hasServerCertChanged ||
        hasBaseDNChanged ||
        hasSSLStateChanged
    );
  };

  const reset = () => {
    setEnabled(settings?.enabled);
    setName(settings?.configs?.name);
    setHost(settings?.configs?.host);
    setPort(settings?.configs?.port);
    setSSLOption(
      settings?.configs?.ssl_certs &&
        (settings?.configs?.ssl_certs.client_key ||
          settings?.configs?.ssl_certs.client_cert ||
          settings?.configs?.ssl_certs.server_cert)
        ? 'Certificates'
        : 'None'
    );
    setClientKey(settings?.configs?.ssl_certs?.client_key);
    setClientCert(settings?.configs?.ssl_certs?.client_cert);
    setServerCert(settings?.configs?.ssl_certs?.server_cert);
    setBaseDN(settings?.configs?.basedn);
    setSSLState(settings?.configs?.ssl);
    setConfigId(settings?.id);
  };

  const saveOrganizationSettings = () => {
    setSaving(true);
    let sslCerts = {};

    if (sslOption === 'Certificates') {
      sslCerts = {
        client_key: clientKey,
        client_cert: clientCert,
        server_cert: serverCert,
      };
    }
    organizationService
      .editOrganizationConfigs({
        type: 'ldap',
        configs: { name, host, port, ssl: enableSSL, sslCerts, basedn },
        enabled: enabled,
      })
      .then(
        (data) => {
          setSaving(false);
          data.id && setConfigId(data.id);
          onUpdateSSOSettings('ldap', {
            id: data?.id || configId,
            configs: {
              name,
              host,
              port,
              ssl: enableSSL,
              ssl_certs: sslCerts,
              basedn,
            },
            enabled: enabled,
          });
          toast.success('Saved LDAP SSO configurations', {
            position: 'top-center',
          });
        },
        () => {
          setSaving(false);
          toast.error('Error while saving LDAP SSO configurations', {
            position: 'top-center',
          });
        }
      );
    setHasChanges(false);
  };

  const saveInstanceSettings = () => {
    setSaving(true);
    let sslCerts = {};

    if (sslOption === 'Certificates') {
      sslCerts = {
        client_key: clientKey,
        client_cert: clientCert,
        server_cert: serverCert,
      };
    }
    instanceSettingsService
      .updateSSOConfigs({
        type: 'ldap',
        configs: { name, host, port, ssl: enableSSL, sslCerts, basedn },
        enabled: enabled,
      })
      .then(
        (data) => {
          setSaving(false);
          data.id && setConfigId(data.id);
          onUpdateSSOSettings('ldap', {
            id: data?.id || configId,
            configs: {
              name,
              host,
              port,
              ssl: enableSSL,
              ssl_certs: sslCerts,
              basedn,
            },
            enabled: enabled,
          });
          toast.success('Saved LDAP SSO configurations', {
            position: 'top-center',
          });
        },
        () => {
          setSaving(false);
          toast.error('Error while saving LDAP SSO configurations', {
            position: 'top-center',
          });
        }
      );
    setHasChanges(false);
  };

  const initiateSave = () => {
    if (!instanceLevel && enabled != settings?.enabled && enabled === true && isInstanceOptionEnabled('ldap')) {
      setShowEnablingWorkspaceSSOModal(true);
    } else {
      if (instanceLevel) {
        saveInstanceSettings();
      } else {
        saveOrganizationSettings();
      }
    }
  };

  // LdapHeader Component
  function LdapHeader() {
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
            <input type="checkbox" checked={enabled} onChange={onToggleChange} data-cy="ldap-toggle-input" />
            <span className="slider round"></span>
          </label>
          <span className="sso-type-header" data-cy="card-title" style={{ marginBottom: '0px', fontWeight: '500' }}>
            {t('header.organization.menus.manageSSO.ldap.title', 'LDAP')}
          </span>
        </div>
        <div className="card-title" style={{ marginBottom: '0px' }}>
          <span className={`tj-text-xsm ${enabled ? 'enabled-tag' : 'disabled-tag'}`} data-cy="status-label">
            {enabled
              ? t('header.organization.menus.manageSSO.ldap.enabled', 'Enabled')
              : t('header.organization.menus.manageSSO.ldap.disabled', 'Disabled')}
          </span>
        </div>
      </div>
    );
  }

  // GoogleFooter Component
  function LdapFooter() {
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
    return <LdapHeader />;
  };

  const renderFooterContent = () => {
    return <LdapFooter />;
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
                      onBlur={handleBlur}
                      data-cy="name-input"
                    />
                    {nameError && <div style={customStyles.errorMessage}>{nameError}</div>}
                  </div>
                </div>
                <div className="form-group mb-3">
                  <label className="form-label" data-cy="host-label">
                    Host name
                  </label>
                  <div>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter Host name"
                      value={host}
                      onChange={(e) => handleHostChange(e.target.value)}
                      data-cy="host-input"
                    />
                  </div>
                </div>
                <div className="form-group mb-3">
                  <label className="form-label" data-cy="port-label">
                    Port
                  </label>
                  <div>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Enter Port"
                      value={port}
                      onChange={(e) => handlePortChange(e.target.value)}
                      data-cy="port-input"
                    />
                  </div>
                </div>
                <div className="form-group mb-3">
                  <label className="form-label" data-cy="base-dn-label">
                    Base DN
                  </label>
                  <div>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="dc=example,dc=com"
                      value={basedn}
                      onChange={(e) => handleBaseDNChange(e.target.value)}
                      data-cy="base-dn-input"
                    />
                    <small className="form-note" style={{ color: '#6c757d' }} data-cy="base-dn-helper-text">
                      {t('Location without UID or CN')}
                    </small>
                  </div>
                </div>
                <div className="form-group mb-3">
                  <label className="form-label" data-cy="ssl-label">
                    SSL
                  </label>
                  <label className={`form-check form-switch`}>
                    <input
                      className="form-check-input tj-toggle-switch"
                      type="checkbox"
                      checked={enableSSL}
                      onChange={() => handleSSLChange(!enableSSL)}
                      data-cy={`ssl-toggle-input`}
                    />
                  </label>
                </div>
                {enableSSL && (
                  <div className="form-group mb-3">
                    <label className="form-label" data-cy="ssl-label">
                      SSL certificate
                    </label>
                    <Select
                      options={sslOptions}
                      value={sslOptions.find((option) => option.value === sslOption)}
                      onChange={(selectedOption) => {
                        setSSLOption(selectedOption.value);
                        if (selectedOption.value === 'None') {
                          /* Reset the cert fields */
                          handleClientCertChange('');
                          handleClientKeyChange('');
                          handleServerCertChange('');
                        }
                      }}
                      data-cy="ssl-type-input"
                      isSearchable={false}
                      styles={customStyles}
                    />
                  </div>
                )}
                {sslOption === 'Certificates' && enableSSL && (
                  <>
                    <div className="form-group mb-3">
                      <label className="form-label" data-cy="client-key-label">
                        Client key
                        <small className="git- mx-2" data-cy="encripted-label">
                          <SolidIcon name="lock" width="16" />
                        </small>
                      </label>
                      <div>
                        <textarea
                          className="form-control"
                          placeholder="Enter Client key"
                          value={clientKey}
                          onChange={(e) => handleClientKeyChange(e.target.value)}
                          data-cy="client-key-input"
                          style={{ height: '116px' }}
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="form-group mb-3">
                      <label className="form-label" data-cy="client-cert-label">
                        Client certificate
                        <small className="git- mx-2" data-cy="encripted-label">
                          <SolidIcon name="lock" width="16" />
                        </small>
                      </label>
                      <div>
                        <textarea
                          className="form-control"
                          placeholder="Enter Client certificate"
                          value={clientCert}
                          onChange={(e) => handleClientCertChange(e.target.value)}
                          data-cy="client-cert-input"
                          style={{ height: '116px' }}
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="form-group mb-3">
                      <label className="form-label" data-cy="server-cert-label">
                        Server certificate
                        <small className="git- mx-2" data-cy="encripted-label">
                          <SolidIcon name="lock" width="16" />
                        </small>
                      </label>
                      <div>
                        <textarea
                          className="form-control"
                          placeholder="Enter Server certificate"
                          value={serverCert}
                          onChange={(e) => handleServerCertChange(e.target.value)}
                          data-cy="server-cert-input"
                          style={{ height: '116px' }}
                          autoFocus
                        />
                      </div>
                    </div>
                  </>
                )}
              </form>
            </div>
          </div>
        </Modal>
      )}
      {showEnablingWorkspaceSSOModal && (
        <WorkspaceSSOEnableModal
          show={showEnablingWorkspaceSSOModal}
          ssoKey={'ldap'}
          saveSettings={saveOrganizationSettings}
          setShowModal={setShowEnablingWorkspaceSSOModal}
          reset={reset}
        />
      )}
    </div>
  );
}
