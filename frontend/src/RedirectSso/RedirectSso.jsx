import React from 'react';
import { authenticationService } from '@/_services';

class RedirectSso extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      isGettingConfigs: true,
      configs: undefined,
    };
    // this.single_organization = window.public_config?.DISABLE_MULTI_WORKSPACE === 'true';
  }
  componentDidMount() {
    // authenticationService.getOrganizationConfigs("organizationId").then(
    //   (configs) => {
    //     this.setState({ isGettingConfigs: false, configs });
    //   },
    //   () => this.props.history.push({ pathname: '/', state: { errorMessage: 'Error' } })
    // );
  }

  copyFunction = (input) => {
    let text = document.getElementById(input).innerHTML;
    navigator.clipboard.writeText(text);
  };
  render() {
    return (
      <div className="page page-center">
        <div className=" py-2">
          <div className="text-center mb-4">
            <a href="." className="navbar-brand-autodark">
              <img src="/assets/images/logo-color.svg" height="26" alt="" />
            </a>
          </div>
          <div className="sso-helper-container">
            <h2>SSO Login Information</h2>
            <div>
              <h3>Google SSO</h3>
              <p>
                Please verify Google SSO configuration here :{' '}
                <a href="https://docs.tooljet.com/docs/sso/google">Google SSO configuratios</a>
              </p>
              <div className="flexer">
                <span> Redirect URL : </span>
                <p id="google-url">
                  {`${window.location.protocol}//${window.location.host}/sso/google/${this.state.configs?.google?.config_id}`}
                </p>

                <img
                  onClick={() => this.copyFunction('google-url')}
                  src={`/assets/images/icons/copy.svg`}
                  width="16"
                  height="16"
                  className="sso-copy"
                />
              </div>
            </div>
            <div>
              <h3>GitHub SSO</h3>
              <p>
                Please verify GitHub SSO configuration here :{' '}
                <a href="https://docs.tooljet.com/docs/sso/github">Git SSO configuratios</a>
              </p>
              <div className="flexer">
                <span> Redirect URL :</span>
                <p id="git-url">
                  {`${window.location.protocol}//${window.location.host}/sso/git/${this.state.configs?.google?.config_id}`}
                </p>

                <img
                  onClick={() => this.copyFunction('git-url')}
                  src={`/assets/images/icons/copy.svg`}
                  width="16"
                  height="16"
                  className="sso-copy"
                />
              </div>{' '}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export { RedirectSso };
