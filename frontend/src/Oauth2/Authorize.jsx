import React from 'react';
import queryString from 'query-string';
import { datasourceService } from '@/_services';
import { TJLoader } from '@/_components';
import { withTranslation } from 'react-i18next';
import { getCookie } from '@/_helpers/cookie';
import { withRouter } from '@/_hoc/withRouter';
class AuthorizeComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
    };
  }

  componentDidMount() {
    const props = this.props;
    const query = props.location.search;
    const params = queryString.parse(query);
    const code = params.code;
    const details = { code };

    const sourceId = localStorage.getItem('sourceWaitingForOAuth');
    const current_organization_id = getCookie('orgIdForOauth');

    if (sourceId !== 'newSource') {
      datasourceService
        .setOauth2Token(sourceId, details, current_organization_id)
        .then(() => {
          this.setState({
            isLoading: false,
            authSuccess: true,
          });
        })
        .catch((error) => {
          this.setState({ isLoading: false, authSuccess: false, error: error?.error });
        });
    } else {
      localStorage.setItem('OAuthCode', code);
      this.setState({ isLoading: false, authSuccess: true });
    }
  }

  render() {
    const { isLoading, authSuccess, error } = this.state;
    return (
      <div>
        {isLoading ? (
          <TJLoader />
        ) : (
          <div>
            {!authSuccess ? (
              <div className="container-tight auth-main px-lg-4">
                <h4 style={{ fontSize: '32px' }}>
                  <span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="icon"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                      <circle cx="12" cy="12" r="9"></circle>
                      <line x1="9" y1="10" x2="9.01" y2="10"></line>
                      <line x1="15" y1="10" x2="15.01" y2="10"></line>
                      <path d="M9.5 15.25a3.5 3.5 0 0 1 5 0"></path>
                    </svg>
                  </span>
                  Error
                </h4>
                <div>
                  <div>Details: {error || ''}</div>
                </div>
              </div>
            ) : (
              <div className="container-tight auth-main px-lg-4">
                <h4 style={{ fontSize: '32px' }}>
                  <span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="icon"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                      <circle cx="12" cy="12" r="9"></circle>
                      <line x1="9" y1="10" x2="9.01" y2="10"></line>
                      <line x1="15" y1="10" x2="15.01" y2="10"></line>
                      <path d="M9.5 15a3.5 3.5 0 0 0 5 0"></path>
                    </svg>
                  </span>
                  Success
                </h4>
                <div>
                  <div>Authorization successful, you can close this tab now.</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}

export const Authorize = withTranslation()(withRouter(AuthorizeComponent));
