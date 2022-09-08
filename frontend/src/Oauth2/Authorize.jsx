import React from 'react';
import queryString from 'query-string';
import { datasourceService } from '@/_services';
import { withTranslation } from 'react-i18next';
class AuthorizeComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    const props = this.props;
    const query = props.location.search;
    const params = queryString.parse(query);
    const code = params.code;

    const details = { code };

    let _self = this;

    this.setState({
      details,
      isLoading: true,
    });

    const sourceId = localStorage.getItem('sourceWaitingForOAuth');

    if (sourceId !== 'newSource') {
      datasourceService
        .setOauth2Token(sourceId, details)
        .then(() => {
          this.setState({
            isLoading: false,
            authSucess: true,
          });
        })
        .catch(function (error) {
          _self.setState({ isLoading: false, authFailure: true });
          console.log(error);
        });
    } else {
      localStorage.setItem('OAuthCode', code);
      _self.setState({ isLoading: false, authSucess: true });
    }
  }

  render() {
    const { isLoading, authSucess, authFailure } = this.state;

    return (
      <div>
        {isLoading && <div>{this.props.t('oAuth2.pleaseWait', 'Please wait...')}</div>}

        {authSucess && <div>{this.props.t('oAuth2.authSuccess', 'Auth successful, you can close this tab now.')}</div>}

        {authFailure && <div>{this.props.t('oAuth2.authFailed', 'Auth failed')}</div>}
      </div>
    );
  }
}

export const Authorize = withTranslation()(AuthorizeComponent);
