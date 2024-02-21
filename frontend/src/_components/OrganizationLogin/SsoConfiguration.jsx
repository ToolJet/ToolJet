import React from 'react';
import './Configuration.css';
import Modal from '@/HomePage/Modal';
import { Google } from '@/ManageSSO/Google';
import { Git } from '@/ManageSSO/Git';
import { GoogleSSOModal } from './GoogleSsoModal';
import { GithubSSOModal } from './GithubSsoModal';
import { organizationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { Button, ButtonGroup, Dropdown } from 'react-bootstrap';
import SolidIcon from '@/_ui/Icon/SolidIcons';

class SSOConfiguration extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      initialState: {},
      showModal: false,
      currentSSO: '',
      ssoOptions: this.props.ssoOptions,
      defaultSSO: this.props.defaultSSO,
      isAnySSOEnabled: this.props.isAnySSOEnabled,
      instanceSSO: this.props.instanceSSO,
      showDropdown: false,
      inheritedInstanceSSO: 0,
      showEnablingWorkspaceSSOModal: false,
    };
  }

  handleSelect = (eventKey) => {
    console.log(`Selected ${eventKey}`);
  };

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

  handleUpdateSSOSettings = (ssoType, newSettings) => {
    console.log(`Updating settings for ${ssoType}:`, newSettings);

    this.setState((prevState) => {
      const updatedSSOOptions = prevState.ssoOptions.map((option) => {
        if (option.sso === ssoType) {
          return { ...option, ...newSettings };
        }
        return option;
      });
      return {
        ssoOptions: updatedSSOOptions,
      };
    });
  };

  componentDidMount() {
    const initialState = this.initializeOptionStates(this.props.ssoOptions);
    this.setState({ ...initialState });
    this.setState({ ssoOptions: this.props.ssoOptions });
    this.setState({ defaultSSO: this.props.defaultSSO });
    this.setState({ isAnySSOEnabled: this.props.isAnySSOEnabled });
    this.setState({ instanceSSO: this.props.instanceSSO });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.ssoOptions !== this.props.ssoOptions) {
      const initialState = this.initializeOptionStates(this.props.ssoOptions);

      this.setState({
        ...initialState,
        ssoOptions: this.props.ssoOptions,
        defaultSSO: this.props.defaultSSO,
        isAnySSOEnabled: this.props.isAnySSOEnabled,
        instanceSSO: this.props.instanceSSO,
      },() => {
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
      await organizationService.editOrganization({ inheritSSO: !this.state.defaultSSO });
      this.props.onUpdateAnySSOEnabled(
        this.state.ssoConfigs?.some((obj) => obj.sso !== 'form' && obj.enabled) || !this.state.defaultSSO
      );
      this.setState({
        defaultSSO: !this.state.defaultSSO,
      });
      toast.success('Updated default sso settings');
    } catch (e) {
      toast.error('Default sso settings could not be updated');
    }
  };

  handleToggleSSOOption = async (key) => {
    const isEnabledKey = `${key}Enabled`;
    const enabledStatus = !this.state[isEnabledKey];
    try {
      await this.changeStatus(key, enabledStatus);

      this.setState((prevState) => {
        const updatedSSOOptions = prevState.ssoOptions.map((option) => {
          if (option.sso === key) {
            return { ...option, enabled: enabledStatus };
          }
          return option;
        });
        this.props.onUpdateAnySSOEnabled(
          updatedSSOOptions?.some((obj) => obj.sso !== 'form' && obj.enabled) || this.state.defaultSSO
        );
        return {
          ssoOptions: updatedSSOOptions,
          showModal: enabledStatus,
          currentSSO: key,
          [isEnabledKey]: enabledStatus,
        };
      }, () => {
        const enabledSSOCount = this.getCountOfEnabledSSO();
        this.setState({ inheritedInstanceSSO: enabledSSOCount });
      });
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
        toast.success(`${enabledStatus ? 'Enabled' : 'Disabled'} ${key} SSO`, { position: 'top-center' });
      } catch (error) {
      }
    } else {
      this.setState({ currentSSO: key, showModal: true });
    }
  };
  

  changeStatus = async (key, enabledStatus) => {
    try {
      const response = await organizationService.editOrganizationConfigs({ type: key, enabled: enabledStatus });
    } catch (error) {
      console.error(error);
    }
  };

  renderSSOConfigComponent = () => {
    const { currentSSO } = this.state;
    switch (currentSSO) {
      case 'google':
        return <Google />;
      case 'git':
        return <Git />;
      default:
        return null;
    }
  };

  isOptionEnabled = (key) => {
    const option = this.state.ssoOptions.find((option) => option.sso === key);
    return option ? option.enabled : false;
  };

  isInstanceOptionEnabled = (key) => {
    const option = this.state.instanceSSO.find((option) => option.sso === key);
    return option ? option.enabled : false;
  };

  getCountOfEnabledSSO = () => {
    const instanceEnabledSSOs = this.state.instanceSSO
      .filter((sso) => sso.enabled === true && sso.sso != 'form')
      .map((sso) => sso.sso);
    console.log(this.state.instanceSSO, instanceEnabledSSOs, 'instace we');

    let enabledSSOCount = 0;

    this.state.ssoOptions.forEach((ssoOption) => {
      if (ssoOption.enabled === true && instanceEnabledSSOs.includes(ssoOption.sso)) {
        enabledSSOCount += 1;
      }
    });
    return instanceEnabledSSOs.length - enabledSSOCount;
  };

  getSSOIcon = (key) => {
    const iconStyles = { width: '20px', height: '20x' };
    switch (key) {
      case 'google':
        return <img src="/assets/images/Google.png" alt="Google" style={iconStyles} />;
      case 'git':
        return <img src="/assets/images/Github.png" alt="GitHub" style={iconStyles} />;
      default:
        return null;
    }
  };

  renderSSOOption = (key, name) => {
    const isEnabledKey = `${key}Enabled`;
    const isEnabled = this.state[isEnabledKey];

    return (
      <div className="sso-option" key={key} onClick={() => this.openModal(key)}>
        <div className="sso-option-label">
          {
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {this.getSSOIcon(key)}
              <span style={{ marginLeft: 8 }}>{name}</span>
              {
                <img
                  src="/assets/images/EditIcon.png"
                  className="option-icon"
                  style={{ width: '14px', height: '14px', marginLeft: '8px' }}
                />
              }
            </div>
          }
        </div>
        <label className="switch" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={isEnabled} onChange={() => this.toggleSSOOption(key)} />
          <span className="slider round"></span>
        </label>
      </div>
    );
  };

  render() {
    const { showModal, currentSSO, defaultSSO, initialState, ssoOptions, showDropdown } = this.state;
    console.log(defaultSSO, 'check too');

    return (
      <div className="sso-configuration">
        <h4 style={{ fontSize: '12px' }}>SSO</h4>
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
              >
                Default SSO {defaultSSO ? `(${this.state.inheritedInstanceSSO})` : ''}
                <SolidIcon className="option-icon" name={showDropdown ? 'cheveronup' : 'cheverondown'} fill={'grey'} />
              </div>
            </Dropdown.Toggle>

            <Dropdown.Menu style={{ width: '100%' }}>
              <Dropdown.Item
                eventKey="Google"
                onSelect={this.handleSelect}
                disabled={!defaultSSO || this.isOptionEnabled('google') || !this.isInstanceOptionEnabled('google')} // Disable the item if defaultSSO is false
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {this.getSSOIcon('google')}
                  <span style={{ marginLeft: 8 }}>Google</span>
                </div>
              </Dropdown.Item>
              <Dropdown.Item
                eventKey="GitHub"
                onSelect={this.handleSelect}
                disabled={!defaultSSO || this.isOptionEnabled('git') || !this.isInstanceOptionEnabled('git')} // Disable the item if defaultSSO is false
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {this.getSSOIcon('git')}
                  <span style={{ marginLeft: 8 }}>Github</span>
                </div>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          <label className="switch" style={{ marginLeft: '95px' }}>
            <input type="checkbox" checked={defaultSSO} onChange={this.toggleDefaultSSO} />
            <span className="slider round"></span>
          </label>
        </div>
        <p className="sso-note">Display default SSO for workspace URL login</p>
        {this.renderSSOOption('google', 'Google')}
        {this.renderSSOOption('git', 'GitHub')}
        {showModal && currentSSO === 'google' && (
          <GoogleSSOModal
            settings={this.state.ssoOptions.find((obj) => obj.sso === currentSSO)}
            onClose={() => this.setState({ showModal: false })}
            changeStatus={this.handleToggleSSOOption}
            onUpdateSSOSettings={this.handleUpdateSSOSettings}
            isInstanceOptionEnabled={this.isInstanceOptionEnabled}
          />
        )}
        {showModal && currentSSO === 'git' && (
          <GithubSSOModal
            settings={this.state.ssoOptions.find((obj) => obj.sso === currentSSO)}
            onClose={() => this.setState({ showModal: false })}
            changeStatus={this.handleToggleSSOOption}
            onUpdateSSOSettings={this.handleUpdateSSOSettings}
            isInstanceOptionEnabled={this.isInstanceOptionEnabled}
          />
        )}
      </div>
    );
  }
}

export default SSOConfiguration;
