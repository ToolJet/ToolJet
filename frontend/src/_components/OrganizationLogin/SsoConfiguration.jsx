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
import { Color } from '@/Editor/CodeBuilder/Elements/Color';

class SSOConfiguration extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      initialState: {},
      showModal: false,
      currentSSO: '',
      ssoOptions: this.props.ssoOptions,
      defaultSSO: this.props.ssoOptions,
      showDropdown: false,
      enabledWorkspaceSSO: 0,
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

  componentDidMount() {
    const initialState = this.initializeOptionStates(this.props.ssoOptions);
    this.setState({ ...initialState });
    this.setState({ ssoOptions: this.props.ssoOptions });
  }

  componentDidUpdate(prevProps) {
    // Check if ssoOptions have changed
    if (prevProps.ssoOptions !== this.props.ssoOptions) {
      const initialState = this.initializeOptionStates(this.props.ssoOptions);
      const enabledSSOCount = this.getCountOfEnabledSSO();

      // Update state in a single call
      this.setState({
        ...initialState,
        ssoOptions: this.props.ssoOptions,
        enabledWorkspaceSSO: enabledSSOCount,
      });
    }
  }

  closeModal = () => {
    this.setState({ showModal: false });
  };

  toggleDefaultSSO = () => {
    this.setState({
      defaultSSO: !this.state.defaultSSO,
    });
  };

  handleToggleSSOOption = async (key) => {
    const isEnabledKey = `${key}Enabled`;
    const enabledStatus = !this.state[isEnabledKey];

    try {
      await this.changeStatus(key, enabledStatus);
      toast.success(`${enabledStatus ? 'Enabled' : 'Disabled'} ${key} SSO`, { position: 'top-center' });

      this.setState((prevState) => {
        const updatedSSOOptions = prevState.ssoOptions.map((option) => {
          if (option.sso === key) {
            return { ...option, enabled: enabledStatus };
          }
          return option;
        });
        const enabledSSOCount = updatedSSOOptions.filter((option) => option.enabled && option.sso !== 'form').length;
        return {
          ssoOptions: updatedSSOOptions,
          showModal: enabledStatus,
          currentSSO: key,
          [isEnabledKey]: enabledStatus,
          enabledWorkspaceSSO: enabledSSOCount,
        };
      });
    } catch (error) {
      toast.error('Error while updating SSO configuration', { position: 'top-center' });
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

  getCountOfEnabledSSO = () => {
    const enabledOptions = this.props.ssoOptions.filter((option) => option.enabled && option.sso !== 'form');
    return enabledOptions.length;
  };

  getSSOIcon = (key) => {
    const iconStyles = { width: '20px', height: '20x' }; // Set your desired icon size
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
      <div className="sso-option" key={key}>
        <div className="sso-option-label">
          {
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {this.getSSOIcon(key)}
              <span style={{ marginLeft: 8 }}>{name}</span>
            </div>
          }
        </div>
        <label className="switch">
          <input type="checkbox" checked={isEnabled} onChange={() => this.handleToggleSSOOption(key)} />
          <span className="slider round"></span>
        </label>
      </div>
    );
  };

  render() {
    const { showModal, currentSSO, defaultSSO, initialState, ssoOptions, showDropdown } = this.state;

    return (
      <div className="sso-configuration">
        <h4>SSO</h4>
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
                Default SSO {defaultSSO ? `(${2 - this.state.enabledWorkspaceSSO})` : ''}
                <SolidIcon className="option-icon" name={showDropdown ? 'cheveronup' : 'cheverondown'} fill={'grey'} />
              </div>
            </Dropdown.Toggle>

            <Dropdown.Menu style={{ width: '100%' }}>
              <Dropdown.Item
                eventKey="Google"
                onSelect={this.handleSelect}
                disabled={!(defaultSSO && !this.isOptionEnabled('google'))} // Disable the item if defaultSSO is false
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {this.getSSOIcon('google')}
                  <span style={{ marginLeft: 8 }}>Google</span>
                </div>
              </Dropdown.Item>
              <Dropdown.Item
                eventKey="GitHub"
                onSelect={this.handleSelect}
                disabled={!(defaultSSO && !this.isOptionEnabled('git'))} // Disable the item if defaultSSO is false
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
          />
        )}
        {showModal && currentSSO === 'git' && (
          <GithubSSOModal
            settings={this.state.ssoOptions.find((obj) => obj.sso === currentSSO)}
            onClose={() => this.setState({ showModal: false })}
            changeStatus={this.handleToggleSSOOption}
          />
        )}
      </div>
    );
  }
}

export default SSOConfiguration;
