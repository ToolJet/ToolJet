import React from 'react';
import './Configuration.css';
import Modal from '@/HomePage/Modal';
import { Google } from '@/ManageSSO/Google';
import { Git } from '@/ManageSSO/Git';
import { GoogleSSOModal } from './GoogleSsoModal';
import { GithubSSOModal } from './GithubSsoModal';
import { organizationService } from '@/_services';
import { toast } from 'react-hot-toast'
import { Button, ButtonGroup, Dropdown } from 'react-bootstrap';
import SolidIcon from '@/_ui/Icon/SolidIcons';

class SSOConfiguration extends React.Component {
    constructor(props) {
        console.log(props, 'props');
        super(props);
        this.state = {
          initialState: {},
          showModal: false,
          currentSSO: '',
          ssoOptions: this.props.ssoOptions,
          defaultSSO: this.props.ssoOptions,
          showDropdown: false
        };
    }

    handleSelect = (eventKey) => {
        console.log(`Selected ${eventKey}`);
      };

      CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
        <span
          ref={ref}
          onClick={(e) => {
            e.preventDefault();
            onClick(e);
          }}
          style={{ cursor: 'pointer' }}
        >
          {children}
        </span>
      ));
      

    setShowDropdown = () => {
        this.setState({showDropdown: true});
    }
      

    initializeOptionStates = (ssoOptions) => {
        console.log(ssoOptions, 'kya');
        const initialState = ssoOptions.reduce((acc, option) => {
            console.log(acc, option, 'kuch');
            return {
                ...acc,
                [`${option.sso}Enabled`]: option.enabled,
            };
        }, {});
        console.log('Initialized state:', initialState);
        return initialState;
    }

    componentDidMount() {
        const initialState = this.initializeOptionStates(this.props.ssoOptions);
        this.setState({ ...initialState });
        this.setState({ ssoOptions: this.props.ssoOptions });
        this.setState({ ssoOptions: this.props.ssoOptions });
    }

    componentDidUpdate(prevProps) {
        if (prevProps.ssoOptions !== this.props.ssoOptions) {
            const initialState = this.initializeOptionStates(this.props.ssoOptions);
            this.setState({ ...initialState });
            this.setState({ ssoOptions: this.props.ssoOptions });
        }
    }    

  closeModal = () => {
    this.setState({ showModal: false });
  };

  toggleDefaultSSO = () => {
    this.setState({
      defaultSSO: !this.state.defaultSSO
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
        console.log(updatedSSOOptions, 'update');
        return {
          ssoOptions: updatedSSOOptions,
          showModal: true,
          currentSSO: key,
          [isEnabledKey]: enabledStatus,
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
    const option = this.props.ssoOptions.find(option => option.key === key);
    return option ? option.enabled : false;
  }

  getSSOIcon = (key) => {
    console.log(key, 'see');
    const iconStyles = { width:"20px", height:"20x" }; // Set your desired icon size
    switch (key) {
      case 'google':
        return <img src="/assets/images/Google.png" alt="Google" style={iconStyles}/>;
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
        <div className="sso-option-label">{this.getSSOIcon(key)}{' '+name}</div>
        <label className="switch">
          <input 
            type="checkbox" 
            checked={isEnabled}
            onChange={() => this.handleToggleSSOOption(key)}
          />
          <span className="slider round"></span>
        </label>
      </div>
    );
  }


  render() {
    const { showModal, currentSSO, defaultSSO, initialState, ssoOptions, showDropdown } = this.state;
    console.log(ssoOptions, 'here');
    console.log(this.props.ssoOptions, initialState, 'see 1');

    return (
      <div className="sso-configuration">
        <h4>SSO</h4>
        <div className="sso-option" style={{marginBottom: '0px', justifyContent: 'flex-start'}}>
            <div className="sso-option-label" onClick={() => this.setShowDropdown()}>
                Default SSO (2)
            </div>
            <Dropdown onToggle={() => this.setShowDropdown(!showDropdown)} >
                <Dropdown.Toggle variant="transparent" id="dropdown-custom-toggle" style={{ background: 'none', border: 'none', height: '20px', width: '20px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} bsPrefix="no-caret-dropdown-toggle">
                    <SolidIcon name="cheverondown" style={{ cursor: 'pointer' }} />
                </Dropdown.Toggle>

                <Dropdown.Menu>
                    <Dropdown.Item 
                        eventKey="Google" 
                        onSelect={this.handleSelect}
                        disabled={!this.state.defaultSSO} // Disable the item if defaultSSO is false
                    >
                        {this.getSSOIcon('google')}{' Google'}
                    </Dropdown.Item>
                    <Dropdown.Item 
                        eventKey="GitHub" 
                        onSelect={this.handleSelect}
                        disabled={!this.state.defaultSSO} // Disable the item if defaultSSO is false
                    >
                        {this.getSSOIcon('git')}{' Github'}
                    </Dropdown.Item>
</Dropdown.Menu>

            </Dropdown>

      <label className="switch" style={{marginLeft: '95px'}}>
            <input 
              type="checkbox" 
              checked={defaultSSO} 
              onChange={this.toggleDefaultSSO}
            />
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
