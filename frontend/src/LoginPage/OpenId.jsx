import React from 'react';
import config from 'config';
import { withTranslation } from 'react-i18next';
import { ShowLoading } from '@/_components';
import { authenticationService } from '@/_services';
import { withRouter } from '@/_hoc/withRouter';

class OpenIdLoginPageComponent extends React.Component {
  constructor(props) {
    super(props);
    this.organizationId = props.params.organizationId;
  }

  componentDidMount() {
    authenticationService.getOrganizationConfigs(this.organizationId).then(
      (configs) => {
        const configId = configs?.openid?.config_id;
        fetch(`${config.apiUrl}/oauth/openid/configs${configId ? `/${configId}` : ''}`, {
          method: 'GET',
          credentials: 'include',
        })
          .then((res) => res.json())
          .then((json) => {
            if (json.authorizationUrl) {
              return (window.location.href = json.authorizationUrl);
            }
            return this.props.navigate({
              pathname: '/login',
              state: { errorMessage: 'Error while login, please try again' },
            });
          })
          .catch((reason) => {
            return this.props.navigate({
              pathname: '/login',
              state: { errorMessage: reason || 'Error while login, please try again' },
            });
          });
      },
      () => {
        return this.props.navigate({
          pathname: '/login',
          state: { errorMessage: 'Error while login, please try again' },
        });
      }
    );
  }

  render() {
    return (
      <div className="common-auth-section-whole-wrapper page">
        <div className="common-auth-section-left-wrapper">
          <div className="common-auth-section-left-wrapper-grid">
            <div className="loader-wrapper">
              <ShowLoading />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export const OpenIdLoginPage = withTranslation()(withRouter(OpenIdLoginPageComponent));
