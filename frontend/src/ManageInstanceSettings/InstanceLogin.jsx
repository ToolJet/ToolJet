import React from 'react';
import { toast } from 'react-hot-toast';
import { copyToClipboard } from '@/_helpers/appUtils';
import { withTranslation } from 'react-i18next';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { instanceSettingsService, licenseService } from '@/_services';
import { ToolTip } from '@/_components/ToolTip';
import InstanceSSOConfiguration from './InstanceSSOConfiguration';
import DisablePasswordLoginModal from '@/_components/DisablePasswordLoginModal';
import '@/_components/OrganizationLogin/Configuration.scss';

class InstanceLogin extends React.Component {
  protectedSSO = ['openid', 'ldap', 'saml'];
  constructor(props) {
    super(props);
    this.state = {
      isSaving: false,
      showDisablingPasswordConfirmation: false,
      options: {},
      initialOptions: {},
      hasChanges: false,
      isAnySSOEnabled: false,
      ssoOptions: [],
      featureAccess: {},
      isAllowPersonalWorkspaceEnabled: window.public_config?.ALLOW_PERSONAL_WORKSPACE === 'true',
    };
    this.copyFunction = this.copyFunction.bind(this);
  }

  async componentDidMount() {
    await this.setInstanceLoginConfigs();
  }

  reset = () => {
    this.setState({ options: { ...this.state.initialOptions }, hasChanges: false });
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

  async setInstanceLoginConfigs() {
    const featureAccess = await licenseService.getFeatureAccess();
    const ssoConfigs = await instanceSettingsService.fetchSSOConfigs();
    const passwordLoginEnabled = ssoConfigs?.find((obj) => obj.sso === 'form')?.enabled || false;
    const isAnySSOEnabled = ssoConfigs?.some(
      (obj) => obj.sso !== 'form' && obj.enabled && (!this.protectedSSO.includes(obj.sso) || featureAccess?.[obj.sso])
    );
    const initialOptions = {
      enableSignUp: window.public_config?.ENABLE_SIGNUP === 'true',
      allowedDomains: window.public_config?.ALLOWED_DOMAINS || '',
      enableWorkspaceConfiguration: window.public_config?.ENABLE_WORKSPACE_LOGIN_CONFIGURATION === 'true',
      passwordLoginEnabled: passwordLoginEnabled,
      isAnySSOEnabled: isAnySSOEnabled,
    };
    this.setState({
      options: { ...initialOptions },
      initialOptions: { ...initialOptions },
      ssoOptions: [...ssoConfigs],
      isAnySSOEnabled: isAnySSOEnabled,
      featureAccess: featureAccess,
    });
  }

  updateAnySSOEnabled = async (isAnySSOEnabled) => {
    if (!isAnySSOEnabled) {
      await this.enablePasswordLogin();
    }
    this.setState({ isAnySSOEnabled });
  };

  disablePasswordLogin = async () => {
    this.setState({ isSaving: true });
    const { options } = this.state;
    const passwordLoginData = {
      type: 'form',
      enabled: false,
    };
    try {
      await instanceSettingsService.updateSSOConfigs(passwordLoginData);
      this.setState({
        initialOptions: options,
        hasChanges: false,
      });
      toast.success('Password login disabled successfully!', { position: 'top-center' });
    } catch (error) {
      toast.error('Password login could not be disabled. Please try again!', { position: 'top-center' });
    } finally {
      this.setState({ isSaving: false });
    }
  };

  enablePasswordLogin = async () => {
    this.setState({ isSaving: true });
    const { options } = this.state;
    options.passwordLoginEnabled = true;
    const passwordLoginData = {
      type: 'form',
      enabled: true,
    };
    try {
      await instanceSettingsService.updateSSOConfigs(passwordLoginData);
      this.setState({
        initialOptions: options,
        hasChanges: false,
      });
      toast.success('Password login enabled successfully!', { position: 'top-center' });
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
          await instanceSettingsService.updateSSOConfigs(passwordLoginData);
        }

        const { passwordLoginEnabled, ...otherUpdates } = updatedFields;
        if (Object.keys(otherUpdates).length > 0) {
          await instanceSettingsService.updateGeneralConfigs(otherUpdates);
        }

        this.setState({
          initialOptions: options,
          hasChanges: false,
        });

        toast.success('Instance settings have been updated', { position: 'top-center' });
      } else {
        toast.info('No changes to save', { position: 'top-center' });
      }
    } catch (error) {
      toast.error(error.error || 'An error occurred', { position: 'top-center' });
      await this.setInstanceLoginConfigs();
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
      (prevState) => ({
        options: { ...prevState.options, [field]: newValue },
      }),
      this.checkForChanges
    );
    if (field === 'passwordLoginEnabled' && !newValue) {
      this.setState({ showDisablingPasswordConfirmation: true });
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
      featureAccess,
      isAllowPersonalWorkspaceEnabled,
    } = this.state;
    const flexContainerStyle = {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: '140px',
    };

    return (
      <div className="wrapper instance-settings-page animation-fade">
        <div className="page-wrapper">
          <div className="container-xl">
            <div className="card">
              <div className="card-header">
                <div className="card-title" data-cy="card-title">
                  {t('header.organization.menus.manageSSO.instanceLogin.title', 'Instance login')}
                </div>
              </div>
              <div className="card-body" style={flexContainerStyle}>
                <div style={{ width: '50%' }}>
                  <form noValidate className="sso-form-wrap" style={{ width: '472px' }}>
                    <div className="form-group tj-app-input">
                      <label className="form-label bold-text" data-cy="allowed-domain-label">
                        {t('header.organization.menus.manageSSO.generalSettings.domain', `Allowed domains`)}
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder={`Enter allowed domains`}
                        name="domain"
                        value={options.allowedDomains || ''}
                        onChange={(e) => this.handleInputChange('allowedDomains', e)}
                        data-cy="allowed-domains"
                      />
                    </div>
                    <div className="tj-text-xxsm mb-3">
                      <div data-cy="allowed-allowedDomains-helper-text">
                        {t(
                          'header.organization.menus.manageSSO.generalSettings.supportMultiallowedDomainss',
                          `Support multiple domains. Enter allowed domains names separated by comma. example: tooljet.com,tooljet.io,yourorganization.com`
                        )}
                      </div>
                    </div>
                    <div className="form-group mb-3">
                      <label className="form-label bold-text" data-cy="workspace-login-url-label">
                        {t(
                          'header.organization.menus.manageSSO.generalSettings.superadminloginUrl',
                          `Super admin login URL`
                        )}
                      </label>
                      <div
                        className="d-flex justify-content-between form-control align-items-center"
                        style={{ backgroundColor: '#F1F3F5', color: '#889096' }}
                      >
                        <p id="login-url" data-cy="workspace-login-url">
                          {`${window.public_config?.TOOLJET_HOST}${
                            window.public_config?.SUB_PATH ? window.public_config?.SUB_PATH : '/'
                          }login/super-admin`}
                        </p>
                        <SolidIcon name="copy" width="16" onClick={() => this.copyFunction('login-url')} />
                      </div>
                      <div className="mt-1 tj-text-xxsm">
                        <div data-cy="workspace-login-help-text">
                          Use this URL for super admin to login via password
                        </div>
                      </div>
                    </div>
                    <div className="form-group mb-3">
                      <ToolTip
                        message="Enable personal workspace to enable sign up"
                        placement="left"
                        show={!isAllowPersonalWorkspaceEnabled}
                      >
                        <label className="form-check form-switch" style={{ marginBottom: '0px' }}>
                          <input
                            className="form-check-input"
                            type="checkbox"
                            onChange={() => this.handleCheckboxChange('enableSignUp')}
                            checked={options?.enableSignUp === true}
                            disabled={!isAllowPersonalWorkspaceEnabled}
                            data-cy="enable-sign-up-toggle"
                          />
                          <label className="form-check-label bold-text" data-cy="enable-sign-up-label">
                            {t('header.organization.menus.manageSSO.generalSettings.enableSignup', 'Enable signup')}
                          </label>
                        </label>
                      </ToolTip>
                      <div className="help-text danger-text-login">
                        <div data-cy="enable-sign-up-helper-text">
                          Users will be able to sign up without being invited
                        </div>
                      </div>
                    </div>
                    <div className="form-group mb-3">
                      <ToolTip
                        message="Password login cannot be disabled unless SSO is configured"
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
                              disabled={!isAnySSOEnabled}
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
                    <div className="form-group mb-3">
                      <label className="form-check form-switch" style={{ marginBottom: '0px' }}>
                        <input
                          className="form-check-input"
                          type="checkbox"
                          onChange={() => this.handleCheckboxChange('enableWorkspaceConfiguration')}
                          checked={options?.enableWorkspaceConfiguration === true}
                          data-cy="enable-workspace-configuration-toggle"
                        />
                        <label className="form-check-label bold-text" data-cy="enable-workspace-configuration-label">
                          {t(
                            'header.organization.menus.manageSSO.generalSettings.enableWorkspaceConfiguration',
                            'Enable workspace configuration'
                          )}
                        </label>
                      </label>
                      <div className="help-text danger-text-login">
                        <div data-cy="enable-workspace-configuration-helper-text">
                          {t(
                            'header.organization.menus.manageSSO.generalSettings.enableWorkspaceConfiguration',
                            `Allow workspace admin to configure their workspace’s login differently`
                          )}
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
                <div style={{ width: '50%' }}>
                  <InstanceSSOConfiguration
                    isAnySSOEnabled={isAnySSOEnabled}
                    ssoOptions={ssoOptions}
                    onUpdateAnySSOEnabled={this.updateAnySSOEnabled}
                    featureAccess={featureAccess}
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
            </div>
          </div>
        </div>
      </div>
    );
  }
}
export default withTranslation()(InstanceLogin);
