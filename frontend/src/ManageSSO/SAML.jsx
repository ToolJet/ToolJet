import React, { useState } from 'react';
import { organizationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { copyToClipboard } from '@/_helpers/appUtils';
import { useTranslation } from 'react-i18next';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import Toggle from '@/_ui/Toggle/index';
import config from 'config';
import { ssoConfMessages } from '@/_helpers';

export function SAML({ settings, updateData }) {
  const [enabled, setEnabled] = useState(settings?.enabled || false);
  const [idpMetadata, setIdpMetadata] = useState(settings?.configs?.idp_metadata || '');
  const [groupAttribute, setGroupAttribute] = useState(settings?.configs?.group_attribute || 'groups');
  const [name, setName] = useState(settings?.configs?.name || '');
  const [isSaving, setSaving] = useState(false);
  const [configId, setConfigId] = useState(settings?.id);
  const { t } = useTranslation();

  const reset = () => {
    setIdpMetadata(settings?.configs?.idp_metadata || '');
    setGroupAttribute(settings?.configs?.group_attribute || '');
    setName(settings?.configs?.name || '');
  };

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

  const saveSettings = () => {
    setSaving(true);
    organizationService
      .editOrganizationConfigs({
        type: 'saml',
        configs: { name, idpMetadata, groupAttribute },
      })
      .then(
        (data) => {
          setSaving(false);
          data.id && setConfigId(data.id);
          updateData('saml', {
            id: data.id,
            configs: {
              name,
              idp_metadata: idpMetadata,
              group_attribute: groupAttribute,
            },
          });
          toast.success(ssoConfMessages('SAML', 'sso_updated'), {
            position: 'top-center',
          });
        },
        () => {
          setSaving(false);
          toast.error(ssoConfMessages('SAML', 'sso_update_failed'), {
            position: 'top-center',
          });
        }
      );
  };

  const changeStatus = () => {
    setSaving(true);
    const enabled_tmp = !enabled;
    organizationService.editOrganizationConfigs({ type: 'saml', enabled: !enabled }).then(
      (data) => {
        setSaving(false);
        setEnabled(enabled_tmp);
        data.id && setConfigId(data.id);
        updateData('saml', { id: data.id, enabled: enabled_tmp });
        toast.success(ssoConfMessages('SAML', 'sso_updated'), {
          position: 'top-center',
        });
      },
      () => {
        setSaving(false);
        toast.error(ssoConfMessages('SAML', 'sso_update_failed'), {
          position: 'top-center',
        });
      }
    );
  };

  return (
    <div className="sso-card-wrapper saml-sso-conf">
      <div className="card-header">
        <div className="d-flex justify-content-between title-with-toggle">
          <div>
            <Toggle
              label={t('header.organization.menus.manageSSO.saml.title', 'SAML')}
              onChange={changeStatus}
              checked={enabled}
              dataCy="saml"
            />
          </div>
          <div className="card-title">
            <span className={` tj-text-xsm ${enabled ? 'enabled-tag' : 'disabled-tag'}`} data-cy="status-label">
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
                placeholder="Enter name"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                placeholder="Enter IdP metadata in XML format"
                value={idpMetadata}
                onChange={(e) => setIdpMetadata(e.target.value)}
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
                onChange={(e) => setGroupAttribute(e.target.value)}
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
      <div className="form-footer sso-card-footer saml-footer">
        <div className="d-flex justify-content-between">
          <a
            className="d-flex align-items-center gap-2 ps-3 text-decoration-none"
            href="https://docs.tooljet.com/docs/user-authentication/sso/saml/"
            target="_blank"
            rel="noreferrer"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M15.4167 9.58333V5H16.6667V9.58333C16.6667 9.92851 16.3869 10.2083 16.0417 10.2083C15.6966 10.2083 15.4167 9.92851 15.4167 9.58333Z"
                fill="#3E63DD"
              />
              <path
                d="M13.3334 8.33331V5.83331H6.66675V8.33331C6.66675 10.1743 8.15913 11.6666 10.0001 11.6666C11.841 11.6666 13.3334 10.1743 13.3334 8.33331Z"
                fill="#3E63DD"
              />
              <path
                d="M3.35682 4.61925L8.98477 2.11794C9.63118 1.83064 10.3691 1.83064 11.0155 2.11794L16.6434 4.61925C16.9733 4.76588 16.9733 5.23413 16.6434 5.38076L11.0155 7.88207C10.3691 8.16937 9.63118 8.16937 8.98477 7.88207L3.35682 5.38076C3.02689 5.23413 3.02689 4.76588 3.35682 4.61925Z"
                fill="#3E63DD"
              />
              <path
                d="M11.9165 12.833L10.5927 14.1715C10.2665 14.5014 9.73381 14.5014 9.40764 14.1715L8.08387 12.833C7.87937 12.6262 7.58084 12.538 7.30183 12.6201C4.96421 13.3075 3.3335 14.8607 3.3335 16.6666C3.3335 17.5871 4.07969 18.3333 5.00016 18.3333H15.0002C15.9206 18.3333 16.6668 17.5871 16.6668 16.6666C16.6668 14.8607 15.0361 13.3075 12.6985 12.6201C12.4195 12.538 12.121 12.6262 11.9165 12.833Z"
                fill="#3E63DD"
              />
            </svg>
            <span className="text-indigo-09 font-weight-600">Read documentation</span>
          </a>
          <div className="d-flex gap-2">
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
      </div>
    </div>
  );
}
