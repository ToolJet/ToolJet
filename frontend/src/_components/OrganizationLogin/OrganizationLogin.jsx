import React from 'react';
import { toast } from 'react-hot-toast';
import { copyToClipboard } from '@/_helpers/appUtils';
import { withTranslation } from 'react-i18next';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { ToolTip } from '@/_components/ToolTip';
import DisablePasswordLoginModal from './DisablePasswordLoginModal';
import { authenticationService, organizationService } from '@/_services';
import SSOConfiguration from './SsoConfiguration';

class OrganizationLogin extends React.Component {
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
      defaultSSO: false,
      instanceSSO: [],
    };
    this.copyFunction = this.copyFunction.bind(this);
  }

  async componentDidMount() {
    await this.setLoginConfigs();
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

  async setLoginConfigs(passwordLogin) {
    const settings = await this.fetchSSOSettings();
    const instanceSSO = this.transformConfigToObject(settings?.instance_configs);
    const organizationSettings = settings?.organization_details;
    const ssoConfigs = organizationSettings?.sso_configs;
    const passwordLoginEnabled = passwordLogin || ssoConfigs?.find((obj) => obj.sso === 'form')?.enabled || false;
    const initialOptions = {
      enableSignUp: organizationSettings?.enable_sign_up || false,
      domain: organizationSettings?.domain,
      passwordLoginEnabled: passwordLoginEnabled,
    };
    this.setState({
      options: { ...initialOptions },
      initialOptions: { ...initialOptions },
      ssoOptions: [...ssoConfigs],
      defaultSSO: organizationSettings?.inherit_s_s_o,
      instanceSSO: [...instanceSSO],
      isAnySSOEnabled:
        ssoConfigs?.some((obj) => obj.sso !== 'form' && obj.enabled) ||
        (organizationSettings?.inherit_s_s_o && instanceSSO?.some((obj) => obj.sso !== 'form' && obj.enabled)),
    });
  }

  updateAnySSOEnabled = async (isAnySSOEnabled) => {
    if (!isAnySSOEnabled) {
      await this.enablePasswordLogin();
    }
    this.setState({ isAnySSOEnabled });
  };

  async fetchSSOSettings() {
    const configs = await organizationService.getSSODetails();
    return configs;
  }

  disablePasswordLogin = async () => {
    this.setState({ isSaving: true });
    const { options } = this.state;
    const passwordLoginData = {
      type: 'form',
      enabled: false,
    };
    try {
      await organizationService.editOrganizationConfigs(passwordLoginData);
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
      await organizationService.editOrganizationConfigs(passwordLoginData);
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
      defaultSSO,
      instanceSSO,
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
              <div className="card-header">
                <div className="card-title" data-cy="card-title">
                  {t('header.organization.menus.manageSSO.workspaceLogin.title', 'Workspace login')}
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
                      <div className="d-flex justify-content-between form-control align-items-center">
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
                  </form>
                </div>
                <div style={{ width: '50%' }}>
                  <SSOConfiguration
                    isAnySSOEnabled={isAnySSOEnabled}
                    ssoOptions={ssoOptions}
                    defaultSSO={defaultSSO}
                    instanceSSO={instanceSSO}
                    onUpdateAnySSOEnabled={this.updateAnySSOEnabled}
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
export default withTranslation()(OrganizationLogin);
