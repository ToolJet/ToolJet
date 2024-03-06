import React from 'react';
import '@/_components/OrganizationLogin/Configuration.scss';
import { GoogleSSOModal } from '../_components/GoogleSsoModal';
import { GithubSSOModal } from '../_components/GithubSsoModal';
import { OpenIdSSOModal } from '../_components/OpenIdSsoModal';
import { instanceSettingsService } from '@/_services';
import { toast } from 'react-hot-toast';
import { LicenseTooltip } from '@/LicenseTooltip';

class InstanceSSOConfiguration extends React.Component {
  protectedSSO = ['openid', 'ldap', 'saml'];
  constructor(props) {
    super(props);
    this.state = {
      initialState: {},
      showModal: false,
      currentSSO: '',
      ssoOptions: this.props.ssoOptions,
      featureAccess: this.props.featureAccess,
    };
  }

  initializeOptionStates = (ssoOptions) => {
    const initialState = ssoOptions.reduce((acc, option) => {
      return {
        ...acc,
        [`${option.sso}Enabled`]: option.enabled,
      };
    }, {});
    return initialState;
  };

  handleUpdateSSOSettings = async (ssoType, newSettings) => {
    const isEnabledKey = `${ssoType}Enabled`;
    this.setState(
      (prevState) => {
        const exists = prevState.ssoOptions.some((option) => option.sso === ssoType);
        let updatedSSOOptions;

        if (exists) {
          updatedSSOOptions = prevState.ssoOptions.map((option) => {
            if (option.sso === ssoType) {
              return { ...option, ...newSettings };
            }
            return option;
          });
        } else {
          updatedSSOOptions = [...prevState.ssoOptions, { sso: ssoType, ...newSettings }];
        }

        return {
          ssoOptions: updatedSSOOptions,
          [isEnabledKey]: newSettings?.enabled,
        };
      },
      async () => {
        try {
          await this.props.onUpdateAnySSOEnabled(this.checkIfAnySSOEnabled());
        } catch (error) {
          toast.error('Error while updating SSO configuration', { position: 'top-center' });
        }
      }
    );
  };

  componentDidMount() {
    const initialState = this.initializeOptionStates(this.props.ssoOptions);
    this.setState({ ...initialState });
    this.setState({ ssoOptions: this.props.ssoOptions });
    this.setState({ featureAccess: this.props.featureAccess });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.ssoOptions !== this.props.ssoOptions) {
      const initialState = this.initializeOptionStates(this.props.ssoOptions);

      this.setState({
        ...initialState,
      });
      this.setState({ ssoOptions: this.props.ssoOptions });
    }
    if (prevProps.featureAccess !== this.props.featureAccess) {
      this.setState({ featureAccess: this.props.featureAccess });
    }
  }

  openModal = (ssoType) => {
    this.setState({
      showModal: true,
      currentSSO: ssoType,
    });
  };

  closeModal = () => {
    this.setState({ showModal: false });
  };

  handleToggleSSOOption = async (key) => {
    const isEnabledKey = `${key}Enabled`;
    const enabledStatus = !this.state[isEnabledKey];
    try {
      await this.changeStatus(key, enabledStatus);
      this.setState(
        (prevState) => {
          const updatedSSOOptions = prevState.ssoOptions.map((option) => {
            if (option.sso === key) {
              return { ...option, enabled: enabledStatus };
            }
            return option;
          });

          return {
            ssoOptions: updatedSSOOptions,
            showModal: enabledStatus,
            currentSSO: key,
            [isEnabledKey]: enabledStatus,
          };
        },
        async () => {
          try {
            await this.props.onUpdateAnySSOEnabled(this.checkIfAnySSOEnabled());
          } catch (error) {
            toast.error('Error while updating SSO configuration', { position: 'top-center' });
          }
        }
      );
    } catch (error) {
      toast.error('Error while updating SSO configuration', { position: 'top-center' });
    }
  };

  toggleSSOOption = async (key) => {
    const isEnabledKey = `${key}Enabled`;
    const enabledStatus = !this.state[isEnabledKey];

    if (enabledStatus === false) {
      try {
        await this.handleToggleSSOOption(key);
        toast.success(
          `${key.charAt(0).toUpperCase() + key.slice(1)} SSO ${enabledStatus ? 'enabled' : 'disabled'} successfully!`,
          { position: 'top-center' }
        );
      } catch (error) {
        console.error(error);
      }
    } else {
      this.setState({ currentSSO: key, showModal: true });
    }
  };

  changeStatus = async (key, enabledStatus) => {
    try {
      await instanceSettingsService.updateSSOConfigs({ type: key, enabled: enabledStatus });
    } catch (error) {
      console.error(error);
    }
  };

  checkIfAnySSOEnabled = () => {
    return this.state.ssoOptions?.some(
      (obj) =>
        obj.sso !== 'form' &&
        obj.enabled &&
        (!this.protectedSSO.includes(obj.sso) || this.state.featureAccess?.[obj.sso])
    );
  };

  getSSOIcon = (key) => {
    const iconStyles = { width: '20px', height: '20x' };
    switch (key) {
      case 'google':
        return <img src="assets/images/Google.png" alt="Google" style={iconStyles} />;
      case 'git':
        return <img src="assets/images/Github.png" alt="GitHub" style={iconStyles} />;
      case 'openid':
        return <img src="assets/images/OpenId.png" alt="OpenId" style={iconStyles} />;
      default:
        return null;
    }
  };

  renderSSOOption = (key, name) => {
    const isEnabledKey = `${key}Enabled`;
    const isEnabled = this.state[isEnabledKey];
    const isFeatureAvailable = !this.protectedSSO.includes(key) || this.state.featureAccess?.[key];

    return (
      <LicenseTooltip
        key={key}
        limits={this.state.featureAccess}
        feature={name}
        isAvailable={isFeatureAvailable}
        noTooltipIfValid={true}
        placement="left"
      >
        <div
          className="sso-option"
          key={key}
          onClick={isFeatureAvailable ? () => this.openModal(key) : (e) => e.preventDefault()}
          data-cy="sso-card"
        >
          <div className="sso-option-label">
            {
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                data-cy={`${name.toLowerCase().replace(/\s+/g, '-')}-icon`}
              >
                {this.getSSOIcon(key)}
                <span style={{ marginLeft: 8 }} data-cy={`${name.toLowerCase().replace(/\s+/g, '-')}-label`}>
                  {name}
                </span>
                {
                  <img
                    src="assets/images/EditIcon.png"
                    className="option-icon"
                    style={{
                      width: '14px',
                      height: '14px',
                      marginLeft: '8px',
                      ...(isFeatureAvailable ? {} : { visibility: 'hidden' }),
                    }}
                    data-cy={`${name.toLowerCase().replace(/\s+/g, '-')}-edit-icon`}
                  />
                }
              </div>
            }
          </div>
          <label className="switch" onClick={isFeatureAvailable && ((e) => e.stopPropagation())}>
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={isFeatureAvailable ? () => this.toggleSSOOption(key) : (e) => e.preventDefault()}
              data-cy={`${name.toLowerCase().replace(/\s+/g, '-')}-toggle`}
            />
            <span className="slider round"></span>
          </label>
        </div>
      </LicenseTooltip>
    );
  };

  render() {
    const { showModal, currentSSO, defaultSSO, initialState, ssoOptions, showDropdown } = this.state;

    return (
      <div className="sso-configuration">
        <h4 style={{ fontSize: '12px' }} data-cy="sso-header">
          SSO
        </h4>
        {this.renderSSOOption('google', 'Google')}
        {this.renderSSOOption('git', 'GitHub')}
        {this.renderSSOOption('openid', 'OpenID Connect')}
        {showModal && currentSSO === 'google' && (
          <GoogleSSOModal
            settings={this.state.ssoOptions.find((obj) => obj.sso === currentSSO)}
            onClose={() => this.setState({ showModal: false })}
            onUpdateSSOSettings={this.handleUpdateSSOSettings}
            instanceLevel={true}
          />
        )}
        {showModal && currentSSO === 'git' && (
          <GithubSSOModal
            settings={this.state.ssoOptions.find((obj) => obj.sso === currentSSO)}
            onClose={() => this.setState({ showModal: false })}
            onUpdateSSOSettings={this.handleUpdateSSOSettings}
            instanceLevel={true}
          />
        )}
        {showModal && currentSSO === 'openid' && (
          <OpenIdSSOModal
            settings={this.state.ssoOptions.find((obj) => obj.sso === currentSSO)}
            onClose={() => this.setState({ showModal: false })}
            onUpdateSSOSettings={this.handleUpdateSSOSettings}
            instanceLevel={true}
          />
        )}
      </div>
    );
  }
}

export default InstanceSSOConfiguration;
