import React from 'react';
import './Configuration.scss';
import { organizationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { Dropdown } from 'react-bootstrap';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { LicenseTooltip } from '@/LicenseTooltip';
import { DefaultSSOList, DefaultSSOModal } from '@/modules/common/components';
class BaseSSOConfigurationList extends React.Component {
  protectedSSO = ['openid', 'ldap', 'saml'];
  constructor(props) {
    super(props);
    this.state = {
      initialState: {},
      showModal: false,
      currentSSO: '',
      ssoOptions: this.props.ssoOptions,
      defaultSSO: this.props.defaultSSO,
      isAnySSOEnabled: this.props.isAnySSOEnabled,
      updateSSOOptions: this.props.updateSSOOptions,
      instanceSSO: this.props.instanceSSO,
      showDropdown: false,
      inheritedInstanceSSO: 0,
      showEnablingWorkspaceSSOModal: false,
      ssoHelperText: this.props.ssoHelperText || 'Display default SSO for workspace URL login',
      featureAccess: this.props.featureAccess,
    };
  }
  setShowDropdown = (show) => {
    this.setState({ showDropdown: show });
  };

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
    try {
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
            this.props.updateSSOOptions(this.state.ssoOptions, this.state.instanceSSO);
            await this.props.onUpdateAnySSOEnabled(this.checkIfAnySSOEnabled());
            this.props.handleAutomaticSSOLoginChange(
              this.state.instanceSSO,
              this.state.ssoOptions,
              this.state.defaultSSO
            );
            const enabledSSOCount = this.getCountOfEnabledSSO();
            this.setState({ inheritedInstanceSSO: enabledSSOCount });
          } catch (error) {
            toast.error('Error while updating SSO configuration', { position: 'top-center' });
          }
        }
      );
    } catch (error) {
      toast.error('Error while updating SSO configuration', { position: 'top-center' });
    }
  };

  componentDidMount() {
    const initialState = this.initializeOptionStates(this.props.ssoOptions);
    const enabledSSOCount = this.getCountOfEnabledSSO();
    this.setState({ ...initialState });
    this.setState({ ssoOptions: this.props.ssoOptions });
    this.setState({ defaultSSO: this.props.defaultSSO });
    this.setState({ isAnySSOEnabled: this.props.isAnySSOEnabled });
    this.setState({ instanceSSO: this.props.instanceSSO });
    this.setState({ featureAccess: this.props.featureAccess });
    this.setState({ inheritedInstanceSSO: enabledSSOCount });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.ssoOptions !== this.props.ssoOptions) {
      const initialState = this.initializeOptionStates(this.props.ssoOptions);

      this.setState(
        {
          ...initialState,
          ssoOptions: this.props.ssoOptions,
          defaultSSO: this.props.defaultSSO,
          isAnySSOEnabled: this.props.isAnySSOEnabled,
          instanceSSO: this.props.instanceSSO,
        },
        () => {
          const enabledSSOCount = this.getCountOfEnabledSSO();
          this.setState({ inheritedInstanceSSO: enabledSSOCount });
        }
      );
    }
    if (prevProps.featureAccess !== this.props.featureAccess) {
      this.setState({ featureAccess: this.props.featureAccess }, () => {
        const enabledSSOCount = this.getCountOfEnabledSSO();
        this.setState({ inheritedInstanceSSO: enabledSSOCount });
      });
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

  toggleDefaultSSO = async () => {
    try {
      const currentDefaultSSO = !this.state.defaultSSO;
      await organizationService.editOrganization({ inheritSSO: currentDefaultSSO });
      this.setState(
        {
          defaultSSO: currentDefaultSSO,
        },
        async () => {
          this.props.updateDefaultSSO(currentDefaultSSO);
          this.props.updateSSOOptions(this.state.ssoOptions, this.state.instanceSSO);
          await this.props.onUpdateAnySSOEnabled(this.checkIfAnySSOEnabled());
          this.props.handleAutomaticSSOLoginChange(this.state.instanceSSO, this.state.ssoOptions, currentDefaultSSO);
          toast.success('Updated default sso settings');
        }
      );
    } catch (e) {
      toast.error('Default sso settings could not be updated');
    }
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
            this.props.updateSSOOptions(this.state.ssoOptions, this.state.instanceSSO);
            await this.props.onUpdateAnySSOEnabled(this.checkIfAnySSOEnabled());
            this.props.handleAutomaticSSOLoginChange(
              this.state.instanceSSO,
              this.state.ssoOptions,
              this.state.defaultSSO
            );
            const enabledSSOCount = this.getCountOfEnabledSSO();
            this.setState({ inheritedInstanceSSO: enabledSSOCount });
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

    if (!enabledStatus) {
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
      await organizationService.editOrganizationConfigs({ type: key, enabled: enabledStatus });
    } catch (error) {
      console.error(error);
    }
  };

  isOptionEnabled = (key) => {
    const option = this.state.ssoOptions.find((option) => option.sso === key);
    return option ? option.enabled : false;
  };

  checkIfAnySSOEnabled = () => {
    return (
      this.state.ssoOptions?.some(
        (obj) =>
          obj.sso !== 'form' &&
          obj.enabled &&
          (!this.protectedSSO.includes(obj.sso) || this.state.featureAccess?.[obj.sso])
      ) ||
      (this.state.defaultSSO &&
        this.state.instanceSSO?.some(
          (obj) =>
            obj.sso !== 'form' &&
            obj.enabled &&
            (!this.protectedSSO.includes(obj.sso) || this.state.featureAccess?.[obj.sso])
        ))
    );
  };

  isInstanceOptionEnabled = (key) => {
    const option = this.state.instanceSSO.find((option) => option.sso === key);
    return option && this.state.defaultSSO ? option.enabled : false;
  };

  getCountOfEnabledSSO = () => {
    const instanceEnabledSSOs = this.state.instanceSSO
      .filter((sso) => sso.enabled === true && sso.sso != 'form' && !(this.state.featureAccess?.[sso.sso] === false))
      .map((sso) => sso.sso);

    let enabledSSOCount = 0;

    this.state.ssoOptions.forEach((ssoOption) => {
      if (ssoOption.enabled === true && instanceEnabledSSOs.includes(ssoOption.sso)) {
        enabledSSOCount += 1;
      }
    });
    return instanceEnabledSSOs.length - enabledSSOCount;
  };

  determineDefaultSSOs = () => {
    let instanceSSO = this.props.instanceSSO;
    if (instanceSSO.length > 0) {
      instanceSSO = instanceSSO.filter((sso) => sso.enabled && sso.sso != 'form');
    }
    return instanceSSO;
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
      case 'ldap':
        return <img src="assets/images/Ldap.png" alt="LDAP" style={iconStyles} />;
      case 'saml':
        return <img src="assets/images/Saml.png" alt="SAML" style={iconStyles} />;
      default:
        return null;
    }
  };

  renderSSOOption = (key, name) => {
    const isEnabledKey = `${key}Enabled`;
    const isEnabled = this.state[isEnabledKey] || false;
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
          data-cy={`${name.toLowerCase().replace(/\s+/g, '-')}-sso-card`}
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
    const { showModal, currentSSO, defaultSSO, initialState, ssoOptions, showDropdown, featureAccess } = this.state;
    const { enterpriseSSOList: EnterpriseSSOList = () => null } = this.props;
    const { enterpriseSSOModals: EnterpriseSSOModals = () => null } = this.props;
    const defaultSSOModals = this.props.defaultSSOModals;
    return (
      <div className="sso-configuration">
        <h4 style={{ fontSize: '12px' }} data-cy="sso-header">
          SSO
        </h4>
        <div
          className={`sso-option ${showDropdown ? 'clicked' : ''}`}
          style={{ paddingLeft: '0px', marginBottom: '1px' }}
        >
          <Dropdown onToggle={() => this.setShowDropdown(!showDropdown)}>
            <Dropdown.Toggle
              variant="transparent"
              id="dropdown-custom-toggle"
              style={{
                background: 'none',
                border: 'none',
                height: '20px',
                width: '20px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
              }}
              bsPrefix="no-caret-dropdown-toggle"
              data-cy="dropdown-custom-toggle"
            >
              <div
                className="sso-option-label"
                style={{
                  paddingLeft: '12px',
                  width: '270px',
                  paddingRight: '220px',
                  paddingTop: '6px',
                  paddingBottom: '6px',
                  height: '34px',
                }}
                data-cy="instance-sso-card"
              >
                Instance SSO {defaultSSO ? `(${this.state.inheritedInstanceSSO})` : ''}
                <SolidIcon className="option-icon" name={showDropdown ? 'cheveronup' : 'cheverondown'} fill={'grey'} />
              </div>
            </Dropdown.Toggle>

            <Dropdown.Menu style={{ width: '100%' }}>
              {this.determineDefaultSSOs().map((sso) => (
                <Dropdown.Item
                  key={sso.sso}
                  eventKey={sso.sso}
                  disabled={
                    !defaultSSO ||
                    this.isOptionEnabled(sso.sso) ||
                    !this.isInstanceOptionEnabled(sso.sso) ||
                    (sso.sso === 'openid' && !featureAccess?.openid)
                  } // Disable the item if defaultSSO is false
                  data-cy={`dropdown-options-${sso.sso}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {this.getSSOIcon(sso.sso)}
                    <span style={{ marginLeft: 8 }}>{sso.sso.charAt(0).toUpperCase() + sso.sso.slice(1)}</span>
                  </div>
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>

          <label className="switch" style={{ marginLeft: '95px' }} data-cy="instance-sso-toggle">
            <input type="checkbox" checked={defaultSSO} onChange={this.toggleDefaultSSO} />
            <span className="slider round"></span>
          </label>
        </div>

        <p className="sso-note" data-cy="instance-sso-helper-text">
          {this.state.ssoHelperText}
        </p>
        <DefaultSSOList renderSSOOption={this.renderSSOOption} />
        <EnterpriseSSOList renderSSOOption={this.renderSSOOption} />
        <DefaultSSOModal
          showModal={this.state.showModal}
          currentSSO={this.state.currentSSO}
          settings={this.state.ssoOptions.find((obj) => obj.sso === currentSSO)}
          onClose={() => this.setState({ showModal: false })}
          onUpdateSSOSettings={this.handleUpdateSSOSettings}
          isInstanceOptionEnabled={this.isInstanceOptionEnabled}
          defaultSSOModals={defaultSSOModals}
        />
        <EnterpriseSSOModals
          showModal={this.state.showModal}
          currentSSO={this.state.currentSSO}
          settings={this.state.ssoOptions.find((obj) => obj.sso === currentSSO)}
          onClose={() => this.setState({ showModal: false })}
          onUpdateSSOSettings={this.handleUpdateSSOSettings}
          isInstanceOptionEnabled={this.isInstanceOptionEnabled}
        />
      </div>
    );
  }
}

export default BaseSSOConfigurationList;
