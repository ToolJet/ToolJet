import React from 'react';
import queryString from 'query-string';
import { datasourceService } from '@/_services';
import { TJLoader } from '@/_ui/TJLoader/TJLoader';
import { withTranslation } from 'react-i18next';
import { getCookie } from '@/_helpers/cookie';
import { withRouter } from '@/_hoc/withRouter';
import VerifiedShield from '@/_ui/Icon/solidIcons/VerifiedShield';
import WarningOctagon from '@/_ui/Icon/solidIcons/WarningOctagon';
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
          this.setState({
            isLoading: false,
            authSuccess: false,
            error: error?.error,
          });
        });
    } else {
      localStorage.setItem('OAuthCode', code);
      this.setState({ isLoading: false, authSuccess: true });
    }

    this.timer = setTimeout(() => {
      window.close();
    }, 2000);
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  render() {
    const { isLoading, authSuccess, error } = this.state;
    return (
      <div
        style={{
          width: '100%',
          height: '100vh',
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isLoading ? (
          <TJLoader />
        ) : (
          <div>
            {!authSuccess ? (
              <div
                style={{
                  width: '580px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '24px',
                }}
              >
                <div
                  style={{
                    backgroundColor: '#fff0ee',
                    padding: '12px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <WarningOctagon fill="#d72d39" width="32" height="32" />
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    textAlign: 'center',
                    width: '100%',
                  }}
                >
                  <h4
                    style={{
                      fontSize: '36px',
                      fontFamily: 'IBM Plex Sans, sans-serif',
                      fontWeight: '500',
                      lineHeight: '44px',
                      margin: '0',
                      color: '#000000',
                    }}
                  >
                    Error
                  </h4>
                  <div
                    style={{
                      fontSize: '20px',
                      fontFamily: 'IBM Plex Sans, sans-serif',
                      fontWeight: '400',
                      lineHeight: '32px',
                      color: '#000000',
                    }}
                  >
                    {error || 'An error occurred during authorization'}
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  width: '580px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '24px',
                }}
              >
                <div
                  style={{
                    backgroundColor: '#E8F3EB',
                    padding: '12px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <VerifiedShield fill="#1E823B" width="32" height="32" />
                </div>
                <div
                  style={{
                    width: '580px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <h4
                    style={{
                      fontSize: '36px',
                      fontFamily: 'IBM Plex Sans, sans-serif',
                      fontWeight: '500',
                      lineHeight: '44px',
                      margin: '0',
                      color: '#000000',
                    }}
                  >
                    Authorisation successful!
                  </h4>
                  <div
                    style={{
                      fontSize: '20px',
                      fontFamily: 'IBM Plex Sans, sans-serif',
                      fontWeight: '400',
                      lineHeight: '32px',
                      color: '#000000',
                      textAlign: 'center',
                    }}
                  >
                    <div>
                      Authorization successful! You will be redirected in a few seconds. Don’t want to wait?{' '}
                      <span
                        style={{ textDecoration: 'underline', color: '#000000', cursor: 'pointer' }}
                        onClick={() => window.close()}
                      >
                        Click here
                      </span>{' '}
                      to go now.
                    </div>
                  </div>
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
