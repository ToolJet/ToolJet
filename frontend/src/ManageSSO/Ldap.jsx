import React, { useState } from 'react';
import { organizationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import Toggle from '@/_ui/Toggle/index';
import Select from 'react-select';

export function Ldap({ settings, updateData }) {
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
  const [isSaving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  const [enableSSL, setSSLState] = useState(settings?.configs?.ssl || false);

  const { t } = useTranslation();

  const MAX_NAME_LENGTH = 25;

  const handleNameChange = (e) => {
    const newName = e.target.value;

    if (newName.length > MAX_NAME_LENGTH) {
      setNameError('Name should not exceed 25 characters.');
    } else {
      setNameError(''); // Clear the error message if the name is within the limit
      setName(newName);
    }
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

  const reset = () => {
    setName(settings?.configs?.name || '');
    setHost(settings?.configs?.host || '');
    setPort(settings?.configs?.port || '');
    setSSLOption(settings?.configs?.ssl_certs ? 'Certificates' : 'None');
    setClientKey(settings?.configs?.ssl_certs?.clientKey || '');
    setClientCert(settings?.configs?.ssl_certs?.clientCert || '');
    setServerCert(settings?.configs?.ssl_certs?.serverCert || '');
    setBaseDN(settings?.configs?.basedn || '');
    setSSLState(settings?.configs?.ssl || false);
  };

  const saveSettings = () => {
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
      })
      .then(
        (data) => {
          setSaving(false);
          updateData('ldap', {
            id: data.id,
            configs: {
              name,
              host,
              port,
              ssl: enableSSL,
              ssl_certs: sslCerts,
              basedn,
            },
          });
          toast.success('Updated SSO configurations', {
            position: 'top-center',
          });
        },
        () => {
          setSaving(false);
          toast.error('Error saving SSO configurations', {
            position: 'top-center',
          });
        }
      );
  };

  const changeStatus = () => {
    setSaving(true);
    organizationService.editOrganizationConfigs({ type: 'ldap', enabled: !enabled }).then(
      (data) => {
        setSaving(false);
        const enabled_tmp = !enabled;
        setEnabled(enabled_tmp);
        updateData('ldap', { id: data.id, enabled: enabled_tmp });
        toast.success(`${enabled_tmp ? 'Enabled' : 'Disabled'} LDAP SSO`, {
          position: 'top-center',
        });
      },
      () => {
        setSaving(false);
        toast.error('Error saving SSO configurations', {
          position: 'top-center',
        });
      }
    );
  };

  return (
    <div className="sso-card-wrapper">
      <div className="card-header">
        <div className="d-flex justify-content-between title-with-toggle">
          <div>
            <Toggle
              label={t('header.organization.menus.manageSSO.ldap.title', 'LDAP')}
              onChange={changeStatus}
              checked={enabled}
              data-cy="ldap"
            />
          </div>
          <div className="card-title">
            <span className={`tj-text-xsm ${enabled ? 'enabled-tag' : 'disabled-tag'}`} data-cy="status-label">
              {enabled ? t('globals.enabled', 'Enabled') : t('globals.disabled', 'Disabled')}
            </span>
          </div>
        </div>
      </div>
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
                onChange={handleNameChange}
                onBlur={handleBlur}
                data-cy="name-input"
              />
              {nameError && <div style={customStyles.errorMessage}>{nameError}</div>}
            </div>
          </div>
          <div className="form-group mb-3">
            <label className="form-label" data-cy="host-label">
              Host Name
            </label>
            <div>
              <input
                type="text"
                className="form-control"
                placeholder="Enter Host"
                value={host}
                onChange={(e) => setHost(e.target.value)}
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
                onChange={(e) => setPort(e.target.value)}
                data-cy="port-input"
              />
            </div>
          </div>
          <div className="form-group mb-3">
            <label className="form-label" data-cy="baseDN-label">
              Base DN
            </label>
            <div>
              <input
                type="text"
                className="form-control"
                placeholder="dc=example,dc=com"
                value={basedn}
                onChange={(e) => setBaseDN(e.target.value)}
                data-cy="baseDN-input"
              />
              <small className="form-note" style={{ color: '#6c757d' }}>
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
                onChange={() => setSSLState(!enableSSL)}
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
                    setClientCert('');
                    setClientKey('');
                    setServerCert('');
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
                <label className="form-label" data-cy="clientKey-label">
                  Client Key
                  <small className="git- mx-2" data-cy="encripted-label">
                    <SolidIcon name="lock" width="16" />
                  </small>
                </label>
                <div>
                  <textarea
                    className="form-control"
                    placeholder="Enter Client Key"
                    value={clientKey}
                    onChange={(e) => setClientKey(e.target.value)}
                    data-cy="clientKey-input"
                    style={{ height: '116px' }}
                    autoFocus
                  />
                </div>
              </div>
              <div className="form-group mb-3">
                <label className="form-label" data-cy="clientCert-label">
                  Client Certificate
                  <small className="git- mx-2" data-cy="encripted-label">
                    <SolidIcon name="lock" width="16" />
                  </small>
                </label>
                <div>
                  <textarea
                    className="form-control"
                    placeholder="Enter Client Certificate"
                    value={clientCert}
                    onChange={(e) => setClientCert(e.target.value)}
                    data-cy="clientCert-input"
                    style={{ height: '116px' }}
                    autoFocus
                  />
                </div>
              </div>
              <div className="form-group mb-3">
                <label className="form-label" data-cy="serverCert-label">
                  Server Certificate
                  <small className="git- mx-2" data-cy="encripted-label">
                    <SolidIcon name="lock" width="16" />
                  </small>
                </label>
                <div>
                  <textarea
                    className="form-control"
                    placeholder="Enter Server Certificate"
                    value={serverCert}
                    onChange={(e) => setServerCert(e.target.value)}
                    data-cy="serverCert-input"
                    style={{ height: '116px' }}
                    autoFocus
                  />
                </div>
              </div>
            </>
          )}
        </form>
      </div>
      <div className="form-footer sso-card-footer">
        <ButtonSolid onClick={reset} data-cy="cancel-button" variant="tertiary" className="sso-footer-cancel-btn">
          {t('globals.cancel', 'Cancel')}
        </ButtonSolid>
        <ButtonSolid
          disabled={isSaving}
          isLoading={isSaving}
          onClick={saveSettings}
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
    </div>
  );
}
