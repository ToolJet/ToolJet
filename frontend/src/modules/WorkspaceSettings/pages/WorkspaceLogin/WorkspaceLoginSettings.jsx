import React from 'react';
import { toast } from 'react-hot-toast';
import { copyToClipboard } from '@/_helpers/appUtils';
import { withTranslation } from 'react-i18next';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { ToolTip } from '@/_components/ToolTip';
import { authenticationService, organizationService, instanceSettingsService, licenseService } from '@/_services';
import DisablePasswordLoginModal from '@/modules/common/components/DisablePasswordLoginModal';
import EnableAutomaticSSOLoginModal from '@/_components/EnableAutomaticSSOLoginModal';
import '@/modules/WorkspaceSettings/components/BaseSSOConfigurationList/Configuration.scss';
import Skeleton from 'react-loading-skeleton';
import Spinner from 'react-bootstrap/Spinner';
import ConfirmDisableAutoSSOModal from '@/_components/ConfirmDisableAutoSSOLoginModal';
import { AutoSSOLogin, SSOConfigurationList } from './components';
class OrganizationLogin extends React.Component {
  protectedSSO = ['openid', 'ldap', 'saml'];
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      isSaving: false,
      showDisablingPasswordConfirmation: false,
      showEnablingAutoSSOLoginConfirmation: false,
      options: {},
      initialOptions: {},
      hasChanges: false,
      isAnySSOEnabled: false,
      ssoOptions: [],
      defaultSSO: false,
      instanceSSO: [],
      featureAccess: {},
      isBasicPlan: false,
      canToggleAutomaticSSOLogin: false,
      showDisableAutoSSOModal: false,
    };
    this.copyFunction = this.copyFunction.bind(this);
  }

  async componentDidMount() {
    await this.setLoginConfigs();
    this.setState({ isLoading: false });
  }

  updateDefaultSSO = (newDefaultSSO) => {
    this.setState({ defaultSSO: newDefaultSSO });
  };

  reset = () => {
    this.setState((prevState) => {
      const canToggle = !prevState.initialOptions.passwordLoginEnabled;

      return {
        options: { ...prevState.initialOptions },
        hasChanges: false,
        canToggleAutomaticSSOLogin: canToggle,
      };
    });
  };

  normalizeValue = (value) => {
    return value === undefined || value === null ? '' : value.toString().trim();
  };

  checkForChanges = () => {
    const { options, initialOptions } = this.state;
    const hasChanges = Object.keys(options).some(
      (key) => this.normalizeValue(options[key]) !== this.normalizeValue(initialOptions[key])
    );
    this.setState({ hasChanges });
  };

  copyFunction = (input) => {
    let text = document.getElementById(input).innerHTML;
    copyToClipboard(text);
  };

  handleAutomaticSSOLoginChange = async (updatedInstanceSso, updatedOrganizationSso, defaultSso) => {
    const ssoMap = new Map();
    const prevAutomaticSSOLoginStatus = this.state.options.automaticSsoLogin;

    if (defaultSso) {
      updatedInstanceSso.forEach((sso) => {
        if (sso.enabled && sso.sso != 'form') {
          ssoMap.set(sso.sso, sso);
        }
      });
    }

    updatedOrganizationSso.forEach((sso) => {
      if (sso.enabled && sso.sso != 'form') {
        ssoMap.set(sso.sso, sso);
      }
    });

    // Convert the map back to an array to get the combined and deduplicated SSO configs
    const combinedSSOConfigs = Array.from(ssoMap.values());

    // Filter enabled SSOs
    const enabledSSOs = combinedSSOConfigs.filter(
      (obj) =>
        obj.enabled &&
        obj.sso !== 'form' &&
        (!this.protectedSSO.includes(obj.sso) || this.state.featureAccess?.[obj.sso])
    );
    // Determine if automatic SSO login can be toggled
    const canToggleAutomaticSSOLogin = !this.state.options.passwordLoginEnabled && enabledSSOs.length === 1;

    // Update state options and disable automatic SSO login if necessary
    this.setState((prevState) => {
      const updatedOptions = { ...prevState.options };

      if (!canToggleAutomaticSSOLogin) {
        updatedOptions.automaticSsoLogin = false; // Disable automatic SSO login if conditions aren't met
      }

      return {
        canToggleAutomaticSSOLogin,
        options: updatedOptions,
      };
    });

    // If automatic SSO login cannot be toggled, update the organization config
    if (!canToggleAutomaticSSOLogin) {
      try {
        if (prevAutomaticSSOLoginStatus !== false) {
          await organizationService.editOrganization({ automaticSsoLogin: false });
          toast.success('Automatic SSO login has been disabled', { position: 'top-center' });
        }
      } catch (error) {
        console.error('Error updating automatic SSO login configuration', error);
        toast.error('Failed to update automatic SSO login setting', { position: 'top-center' });
      }
    }
  };

  transformConfigToObject(config) {
    const result = [];
    Object.keys(config).forEach((key) => {
      // Exclude the 'enable_sign_up' key or any other keys you wish to exclude
      if (key !== 'enable_sign_up') {
        result.push({
          sso: key,
          enabled: config[key].enabled,
          configs: config[key].configs || {},
        });
      }
    });
    return result;
  }

  async setLoginConfigs() {
    const featureAccess = await licenseService.getFeatureAccess();
    const isBasicPlan = !featureAccess?.licenseStatus?.isLicenseValid || featureAccess?.licenseStatus?.isExpired;
    const settings = await this.fetchSSOSettings();
    const instanceSSOResult = await instanceSettingsService.fetchSSOConfigs();
    const instanceSSO = !Array.isArray(instanceSSOResult)
      ? this.transformConfigToObject(instanceSSOResult)
      : instanceSSOResult;
    const organizationSettings = settings?.organization_details;
    const ssoConfigs = organizationSettings?.sso_configs;
    const ssoMap = new Map();

    if (organizationSettings?.inherit_s_s_o) {
      instanceSSO.forEach((sso) => {
        if (sso.enabled) {
          ssoMap.set(sso.sso, sso);
        }
      });
    }

    ssoConfigs.forEach((sso) => {
      if (sso.enabled) {
        ssoMap.set(sso.sso, sso);
      }
    });

    const combinedSSOConfigs = Array.from(ssoMap.values());

    const enabledSSOs = combinedSSOConfigs.filter(
      (obj) => obj.enabled && obj.sso !== 'form' && (!this.protectedSSO.includes(obj.sso) || featureAccess?.[obj.sso])
    );
    let passwordLoginEnabled = isBasicPlan ? true : ssoConfigs?.find((obj) => obj.sso === 'form')?.enabled || false;

    if (enabledSSOs.length === 0) {
      try {
        const passwordLoginData = {
          type: 'form',
          enabled: true,
        };
        await organizationService.editOrganizationConfigs(passwordLoginData);

        passwordLoginEnabled = true;
      } catch (error) {
        toast.error('Unable to set password login. Please try again!', { position: 'top-center' });
      }
    }

    const canToggleAutomaticSSOLogin = !passwordLoginEnabled && enabledSSOs.length === 1;
    const initialOptions = {
      enableSignUp: organizationSettings?.enable_sign_up || false,
      domain: organizationSettings?.domain,
      passwordLoginEnabled: passwordLoginEnabled,
      automaticSsoLogin: organizationSettings?.automatic_sso_login || false,
    };
    this.setState({
      options: { ...initialOptions },
      initialOptions: { ...initialOptions },
      ssoOptions: [...ssoConfigs],
      defaultSSO: organizationSettings?.inherit_s_s_o,
      instanceSSO: [...instanceSSO],
      featureAccess: featureAccess,
      isBasicPlan: isBasicPlan,
      canToggleAutomaticSSOLogin: canToggleAutomaticSSOLogin,
      isAnySSOEnabled:
        ssoConfigs?.some(
          (obj) =>
            obj.sso !== 'form' && obj.enabled && (!this.protectedSSO.includes(obj.sso) || featureAccess?.[obj.sso])
        ) ||
        (organizationSettings?.inherit_s_s_o &&
          instanceSSO?.some(
            (obj) =>
              obj.sso !== 'form' && obj.enabled && (!this.protectedSSO.includes(obj.sso) || featureAccess?.[obj.sso])
          )),
    });
  }

  updateAnySSOEnabled = async (isAnySSOEnabled) => {
    if (!isAnySSOEnabled) {
      await this.enablePasswordLogin();
    }
    this.setState({ isAnySSOEnabled });
  };

  updateSSOOptions = (updatedSSOOptions, updatedInstanceSSO) => {
    this.setState({ ssoOptions: updatedSSOOptions, instanceSSO: updatedInstanceSSO });
  };

  async fetchSSOSettings() {
    const configs = await organizationService.getSSODetails();
    return configs;
  }

  disablePasswordLogin = async () => {
    this.setState({ isSaving: true });
    const { options, ssoOptions, defaultSSO, instanceSSO } = this.state;
    const passwordLoginData = {
      type: 'form',
      enabled: false,
    };
    try {
      await organizationService.editOrganizationConfigs(passwordLoginData);
      const ssoMap = new Map();

      if (defaultSSO) {
        instanceSSO.forEach((sso) => {
          if (sso.enabled && sso.sso != 'form') {
            ssoMap.set(sso.sso, sso);
          }
        });
      }

      ssoOptions.forEach((sso) => {
        if (sso.enabled && sso.sso != 'form') {
          ssoMap.set(sso.sso, sso);
        }
      });

      const combinedSSOConfigs = Array.from(ssoMap.values());

      const enabledSSOs = combinedSSOConfigs.filter(
        (obj) =>
          obj.enabled &&
          obj.sso !== 'form' &&
          (!this.protectedSSO.includes(obj.sso) || this.state.featureAccess?.[obj.sso])
      );

      const canToggleAutomaticSSOLogin = enabledSSOs.length === 1;
      this.setState({
        initialOptions: options,
        hasChanges: false,
        canToggleAutomaticSSOLogin: canToggleAutomaticSSOLogin,
      });
      toast.success('Password login disabled successfully!', { position: 'top-center' });
    } catch (error) {
      toast.error('Password login could not be disabled. Please try again!', { position: 'top-center' });
    } finally {
      this.setState({ isSaving: false });
    }
  };

  enableAutomaticSSOLogin = async () => {
    this.setState({ isSaving: true });
    try {
      await organizationService.editOrganization({ automaticSsoLogin: true });
      const { options } = this.state;
      this.setState({
        initialOptions: options,
        hasChanges: false,
        canToggleAutomaticSSOLogin: true,
      });
      toast.success('Automatic SSO login enabled successfully!', { position: 'top-center' });
    } catch (error) {
      toast.error('Automatic SSO login could not be enabled. Please try again!', { position: 'top-center' });
    } finally {
      this.setState({ isSaving: false });
    }
  };

  enablePasswordLogin = async () => {
    this.setState({ isSaving: true });
    const { options } = this.state;
    options.passwordLoginEnabled = true;
    options.automaticSsoLogin = false;
    const passwordLoginData = {
      type: 'form',
      enabled: true,
    };
    try {
      await organizationService.editOrganizationConfigs(passwordLoginData);
      await organizationService.editOrganization({ automaticSsoLogin: false });
      this.setState({
        initialOptions: options,
        hasChanges: false,
        canToggleAutomaticSSOLogin: false,
      });
      toast.success('Password login enabled successfully!', { position: 'top-center' });
      toast.success('Automatic SSO login has been disabled!', { position: 'top-center' });
    } catch (error) {
      toast.error('Password login could not be enabled. Please try again!', { position: 'top-center' });
    } finally {
      this.setState({ isSaving: false });
    }
  };

  saveSettings = async () => {
    this.setState({ isSaving: true });

    try {
      let updatedFields = {};
      const { options, initialOptions } = this.state;

      for (const [key, value] of Object.entries(options)) {
        if (options[key] !== initialOptions[key]) {
          updatedFields[key] = value;
        }
      }

      if (Object.keys(updatedFields).length > 0) {
        if (updatedFields.passwordLoginEnabled !== undefined) {
          const passwordLoginData = {
            type: 'form',
            enabled: updatedFields.passwordLoginEnabled,
          };
          await organizationService.editOrganizationConfigs(passwordLoginData);
        }

        const { passwordLoginEnabled, ...otherUpdates } = updatedFields;
        if (Object.keys(otherUpdates).length > 0) {
          await organizationService.editOrganization(otherUpdates);
        }

        this.setState({
          initialOptions: options,
          hasChanges: false,
        });

        toast.success('Organization settings have been updated', { position: 'top-center' });
      } else {
        toast.info('No changes to save', { position: 'top-center' });
      }
    } catch (error) {
      toast.error(error.message || 'An error occurred', { position: 'top-center' });
      this.setState({ options: { ...this.state.initialOptions } });
    } finally {
      this.setState({ isSaving: false });
    }
  };

  ssoButtons = (type) => {
    return (
      <div className={`d-flex`}>
        <img width="35px" src={`assets/images/sso-buttons/${type}.svg`} />
      </div>
    );
  };

  handleSaveButtonClick = async () => {
    await this.saveSettings();
    this.setState({ hasChanges: false });
  };

  handleInputChange = (field, event) => {
    const newValue = event.target.value;

    this.setState(
      (prevState) => ({
        options: { ...prevState.options, [field]: newValue },
      }),
      this.checkForChanges
    );
  };

  handleCheckboxChange = (field) => {
    const newValue = !this.state.options[field];
    this.setState(
      (prevState) => {
        const updatedOptions = { ...prevState.options, [field]: newValue };

        if (field === 'passwordLoginEnabled' && newValue) {
          if (this.state.options['automaticSsoLogin']) {
            this.setState({ showDisableAutoSSOModal: true });
          }
          return {
            options: { ...updatedOptions, automaticSsoLogin: false },
            canToggleAutomaticSSOLogin: false,
          };
        }

        return { options: updatedOptions };
      },
      () => {
        this.checkForChanges();

        if (field === 'passwordLoginEnabled' && !newValue) {
          this.setState({ showDisablingPasswordConfirmation: true });
        }
        if (field === 'automaticSsoLogin' && newValue) {
          this.setState({ showEnablingAutoSSOLoginConfirmation: true });
        }
      }
    );
    if (field === 'automaticSsoLogin' && newValue === false) {
      toast.success('Automatic SSO login has been disabled!', { position: 'top-center' });
    }
  };

  render() {
    const { t, darkMode } = this.props;
    const {
      options,
      isSaving,
      showDisablingPasswordConfirmation,
      isAnySSOEnabled,
      ssoOptions,
      defaultSSO,
      instanceSSO,
      featureAccess,
      isBasicPlan,
      canToggleAutomaticSSOLogin,
    } = this.state;
    const flexContainerStyle = {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: '140px',
    };

    return (
      <div className="wrapper workspace-settings-page animation-fade">
        <div className="page-wrapper">
          <div className="container-xl">
            <div className="card">
              <div className="card-header" style={{ justifyContent: 'space-between' }}>
                {this.state.isLoading ? (
                  <Skeleton count={1} height={20} width={90} className="mb-1" />
                ) : (
                  <div className="card-title" data-cy="card-title">
                    {t('header.organization.menus.manageSSO.workspaceLogin.title', 'Workspace login')}
                  </div>
                )}
                <span
                  className={`tj-text-xsm ${
                    window.public_config?.ENABLE_WORKSPACE_LOGIN_CONFIGURATION === 'true'
                      ? 'enabled-tag'
                      : 'inherited-tag'
                  }`}
                  data-cy="workspace-login-status-label"
                >
                  {window.public_config?.ENABLE_WORKSPACE_LOGIN_CONFIGURATION === 'true'
                    ? t('header.organization.menus.manageSSO.github.enabled', 'Enabled')
                    : t('header.organization.menus.manageSSO.github.inherited', 'Inherited')}
                </span>
              </div>
              <div className="card-body" style={flexContainerStyle}>
                {this.state.isLoading ? (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '100%',
                      width: '100%',
                    }}
                  >
                    <Spinner variant="primary" />
                  </div>
                ) : (
                  <div style={{ width: '50%' }}>
                    <form noValidate className="sso-form-wrap" style={{ width: '472px' }}>
                      <div className="form-group tj-app-input">
                        <label className="form-label bold-text" data-cy="allowed-domain-label">
                          {t('header.organization.menus.manageSSO.generalSettings.domain', `Allowed domains`)}
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder={t(`Enter allowed domains`)}
                          name="domain"
                          value={options.domain || ''}
                          onChange={(e) => this.handleInputChange('domain', e)}
                          data-cy="allowed-domains"
                        />
                      </div>
                      <div className="tj-text-xxsm mb-3">
                        <div data-cy="allowed-domain-helper-text">
                          {t(
                            'header.organization.menus.manageSSO.generalSettings.supportMultidomains',
                            `Support multiple domains. Enter domain names separated by comma. example: tooljet.com,tooljet.io,yourorganization.com`
                          )}
                        </div>
                      </div>
                      <div className="form-group mb-3">
                        <label className="form-label bold-text" data-cy="workspace-login-url-label">
                          {t('header.organization.menus.manageSSO.generalSettings.loginUrl', `Login URL`)}
                        </label>
                        <div
                          className="d-flex justify-content-between form-control align-items-center"
                          style={{ backgroundColor: '#F1F3F5', color: '#889096' }}
                        >
                          <p id="login-url" data-cy="workspace-login-url">
                            {`${window.public_config?.TOOLJET_HOST}${
                              window.public_config?.SUB_PATH ? window.public_config?.SUB_PATH : '/'
                            }login/${
                              authenticationService?.currentSessionValue?.current_organization_slug ||
                              authenticationService?.currentSessionValue?.current_organization_id
                            }`}
                          </p>
                          <SolidIcon name="copy" width="16" onClick={() => this.copyFunction('login-url')} />
                        </div>
                        <div className="mt-1 tj-text-xxsm">
                          <div data-cy="workspace-login-help-text">
                            {t(
                              'header.organization.menus.manageSSO.generalSettings.workspaceLogin',
                              `Use this URL to login directly to this workspace`
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="form-group mb-3">
                        <label className="form-check form-switch" style={{ marginBottom: '0px' }}>
                          <input
                            id="enableSignUp"
                            className="form-check-input"
                            type="checkbox"
                            onChange={() => this.handleCheckboxChange('enableSignUp')}
                            checked={options?.enableSignUp === true}
                            data-cy="enable-sign-up-toggle"
                          />
                          <label className="form-check-label bold-text" data-cy="enable-sign-up-label">
                            {'Enable signup'}
                          </label>
                        </label>
                        <div className="help-text danger-text-login">
                          <div data-cy="enable-sign-up-helper-text">
                            Users will be able to sign up without being invited
                          </div>
                        </div>
                      </div>
                      <div className="form-group mb-3">
                        <ToolTip
                          message={
                            <>
                              Password login cannot be disabled
                              <br /> unless SSO is configured
                            </>
                          }
                          placement="left"
                          show={!isAnySSOEnabled}
                        >
                          <label className="form-check form-switch" style={{ marginBottom: '0px' }}>
                            <div>
                              <input
                                id="passwordLogin"
                                className="form-check-input"
                                type="checkbox"
                                onChange={() => this.handleCheckboxChange('passwordLoginEnabled')}
                                data-cy="password-enable-toggle"
                                checked={options?.passwordLoginEnabled === true}
                                disabled={isBasicPlan ? true : !isAnySSOEnabled}
                              />
                              <label className="form-check-label bold-text" data-cy="label-password-login">
                                Password login
                              </label>
                            </div>
                          </label>
                        </ToolTip>
                        <div className="help-text tj-text-xsm danger-text-login">
                          <div data-cy="disable-password-helper-text">
                            Disable password login only if your SSO is configured otherwise you will get locked out
                          </div>
                        </div>
                      </div>
                      <AutoSSOLogin
                        t={t}
                        options={options}
                        canToggleAutomaticSSOLogin={canToggleAutomaticSSOLogin}
                        handleCheckboxChange={this.handleCheckboxChange}
                      />
                    </form>
                  </div>
                )}
                <div style={{ width: '50%' }}>
                  <SSOConfigurationList
                    isAnySSOEnabled={isAnySSOEnabled}
                    ssoOptions={ssoOptions}
                    defaultSSO={defaultSSO}
                    instanceSSO={instanceSSO}
                    onUpdateAnySSOEnabled={this.updateAnySSOEnabled}
                    featureAccess={featureAccess}
                    handleAutomaticSSOLoginChange={this.handleAutomaticSSOLoginChange}
                    updateSSOOptions={this.updateSSOOptions}
                    updateDefaultSSO={this.updateDefaultSSO}
                  />
                </div>
              </div>
              <div className="card-footer">
                <ButtonSolid
                  onClick={this.reset}
                  data-cy="cancel-button"
                  variant="tertiary"
                  className="sso-footer-cancel-btn"
                >
                  {t('globals.cancel', 'Cancel')}
                </ButtonSolid>
                <ButtonSolid
                  disabled={!this.state.hasChanges || this.state.isSaving}
                  isLoading={this.state.isSaving}
                  onClick={this.handleSaveButtonClick}
                  data-cy="save-button"
                  variant="primary"
                  className="sso-footer-save-btn"
                  leftIcon="floppydisk"
                  fill="#fff"
                  iconWidth="20"
                >
                  {t('globals.savechanges', 'Save')}
                </ButtonSolid>
              </div>
              {this.state.showDisablingPasswordConfirmation && (
                <DisablePasswordLoginModal
                  show={this.state.showDisablingPasswordConfirmation}
                  disablePasswordLogin={this.disablePasswordLogin}
                  setShowModal={(show) => this.setState({ showDisablingPasswordConfirmation: show })}
                  reset={this.reset}
                />
              )}
              {this.state.showEnablingAutoSSOLoginConfirmation && (
                <EnableAutomaticSSOLoginModal
                  show={this.state.showEnablingAutoSSOLoginConfirmation}
                  enableAutomaticSSOLogin={this.enableAutomaticSSOLogin}
                  setShowModal={(show) => this.setState({ showEnablingAutoSSOLoginConfirmation: show })}
                  reset={this.reset}
                />
              )}
              <ConfirmDisableAutoSSOModal
                show={this.state.showDisableAutoSSOModal}
                onConfirm={async () => {
                  this.setState({ showDisableAutoSSOModal: false });
                  await this.enablePasswordLogin();
                }}
                onCancel={() => {
                  this.setState((prevState) => ({
                    showDisableAutoSSOModal: false,
                    options: {
                      ...prevState.options,
                      passwordLoginEnabled: false,
                      automaticSsoLogin: true,
                    },
                    hasChanges: false,
                    canToggleAutomaticSSOLogin: true,
                  }));
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
export default withTranslation()(OrganizationLogin);
