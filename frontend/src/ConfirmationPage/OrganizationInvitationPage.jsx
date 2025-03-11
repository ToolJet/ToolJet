import React from 'react';
import { appService, authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { withTranslation } from 'react-i18next';
import OnboardingNavbar from '@/_components/OnboardingNavbar';
import { ButtonSolid } from '@/_components/AppButton';
import EnterIcon from '../../assets/images/onboardingassets/Icons/Enter';
import Spinner from '@/_ui/Spinner';
import { withRouter } from '@/_hoc/withRouter';
import { onLoginSuccess } from '@/_helpers/platform/utils/auth.utils';
import { updateCurrentSession } from '@/_helpers/authorizeWorkspace';
import {
  retrieveWhiteLabelText,
  setFaviconAndTitle,
  retrieveWhiteLabelFavicon,
  checkWhiteLabelsDefaultState,
} from '@white-label/whiteLabelling';
class OrganizationInvitationPageComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      defaultState: false,
    };
    this.formRef = React.createRef(null);
    this.organizationId = new URLSearchParams(props?.location?.search).get('oid');
    this.organizationToken = new URLSearchParams(props?.location?.search).get('organizationToken');
    this.source = new URLSearchParams(props?.location?.search).get('source');
    this.whiteLabelText = retrieveWhiteLabelText();
    this.whiteLabelFavicon = retrieveWhiteLabelFavicon();
  }

  componentDidMount() {
    authenticationService.deleteLoginOrganizationId();
    setFaviconAndTitle(this.whiteLabelText, this.whiteLabelFavicon, this.props?.location);
    checkWhiteLabelsDefaultState(this.organizationId).then((res) => {
      this.setState({ defaultState: res });
      this.whiteLabelText = retrieveWhiteLabelText();
      this.whiteLabelFavicon = retrieveWhiteLabelFavicon();
    });
    document.addEventListener('keydown', this.handleEnterKey);
    this.setState({ defaultState: checkWhiteLabelsDefaultState() });
  }

  handleEnterKey = (e) => {
    if (e.key === 'Enter') {
      this.acceptInvite(e);
    }
  };

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleEnterKey);
  }

  acceptInvite = (e) => {
    e.preventDefault();

    const token = this.props?.params?.token;
    this.setState({ isLoading: true });

    appService
      .acceptInvite({
        token,
      })
      .then((data) => {
        toast.success(`Added to the workspace successfully.`);
        updateCurrentSession({
          isUserLoggingIn: true,
        });
        onLoginSuccess(data, this.props.navigate);
      })
      .catch(() => {
        toast.error('Error while setting up your account.', { position: 'top-center' });
        this.setState({ isLoading: false });
      });
  };

  render() {
    const { isLoading, defaultState } = this.state;
    const { name, email, invitedOrganizationName: organizationName } = this.props;
    return (
      <div className="page" ref={this.formRef}>
        <div>
          <div className="page common-auth-section-whole-wrapper">
            <div className="common-auth-section-left-wrapper">
              <OnboardingNavbar darkMode={this.props.darkMode} />
              <div className="common-auth-section-left-wrapper-grid">
                <form action="." method="get" autoComplete="off">
                  <div className="common-auth-container-wrapper">
                    <h2 className="common-auth-section-header org-invite-header" data-cy="invite-page-header">
                      Join {organizationName ? organizationName : this.whiteLabelText}
                    </h2>

                    <div className="invite-sub-header" data-cy="invite-page-sub-header">
                      {`You are invited to ${
                        organizationName
                          ? `a workspace ${organizationName}. Accept the invite to join the workspace.`
                          : this.whiteLabelText
                      }`}
                    </div>

                    <div className="org-page-inputs-wrapper">
                      <label className="tj-text-input-label" data-cy="name-label">
                        Name
                      </label>
                      <p className="tj-text-input onbaording-disabled-field" data-cy="invited-user-name">
                        {name}
                      </p>
                    </div>

                    <div className="signup-inputs-wrap">
                      <label className="tj-text-input-label" data-cy="email-label">
                        Email
                      </label>
                      <p className="tj-text-input onbaording-disabled-field" data-cy="invited-user-email">
                        {email}
                      </p>
                    </div>

                    <div>
                      <ButtonSolid
                        className="org-btn login-btn"
                        onClick={(e) => this.acceptInvite(e)}
                        data-cy="accept-invite-button"
                      >
                        {isLoading ? (
                          <div className="spinner-center">
                            <Spinner />
                          </div>
                        ) : (
                          <>
                            <span>{this.props.t('confirmationPage.acceptInvite', 'Accept invite')}</span>
                            <EnterIcon className="enter-icon-onboard" fill={'#fff'} />
                          </>
                        )}
                      </ButtonSolid>
                    </div>
                    {defaultState && (
                      <p className="text-center-onboard d-block" data-cy="signup-terms-helper">
                        By signing up you are agreeing to the
                        <br />
                        <span>
                          <a href="https://www.tooljet.com/terms" data-cy="terms-of-service-link">
                            Terms of Service{' '}
                          </a>
                          &
                          <a href="https://www.tooljet.com/privacy" data-cy="privacy-policy-link">
                            {' '}
                            Privacy Policy
                          </a>
                        </span>
                      </p>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export const OrganizationInvitationPage = withTranslation()(withRouter(OrganizationInvitationPageComponent));
