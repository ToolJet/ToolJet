import React from 'react';
import { appService, authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { withTranslation } from 'react-i18next';
import OnboardingNavbar from '@/_components/OnboardingNavbar';
import { ButtonSolid } from '@/_components/AppButton';
import EnterIcon from '../../assets/images/onboardingassets/Icons/Enter';
import Spinner from '@/_ui/Spinner';
import { retrieveWhiteLabelText } from '@/_helpers/utils';
import { withRouter } from '@/_hoc/withRouter';
import { onLoginSuccess } from '@/_helpers/platform/utils/auth.utils';
import { updateCurrentSession } from '@/_helpers/authorizeWorkspace';

class OrganizationInvitationPageComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
    };
    this.formRef = React.createRef(null);
    this.organizationId = new URLSearchParams(props?.location?.search).get('oid');
    this.organizationToken = new URLSearchParams(props?.location?.search).get('organizationToken');
    this.source = new URLSearchParams(props?.location?.search).get('source');
  }

  componentDidMount() {
    authenticationService.deleteLoginOrganizationId();

    if (this.organizationId) {
      authenticationService.saveLoginOrganizationId(this.organizationId);
      this.organizationId &&
        authenticationService.getOrganizationConfigs(this.organizationId).then(
          (configs) => {
            this.setState({ isGettingConfigs: false, configs });
          },
          () => {
            this.setState({ isGettingConfigs: false });
          }
        );
    } else {
      this.setState({ isGettingConfigs: false });
    }

    /* Workspace signup organization token */
    authenticationService
      .verifyOrganizationToken(this.organizationToken)
      .then((data) => {
        this.setState({ userDetails: data });
        if (data?.email !== '') {
          this.setState({ verifiedToken: true });
        }
      })
      .catch((err) => {
        if (err?.data.statusCode == 400) {
          this.setState({ fallBack: true });
        }
      });

    document.addEventListener('keydown', this.handleEnterKey);
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
    const { isLoading } = this.state;
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
                      Join {organizationName ? organizationName : retrieveWhiteLabelText()}
                    </h2>

                    <div className="invite-sub-header" data-cy="invite-page-sub-header">
                      {`You are invited to ${
                        organizationName
                          ? `a workspace ${organizationName}. Accept the invite to join the workspace.`
                          : retrieveWhiteLabelText()
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
                    <p className="text-center-onboard d-block">
                      By signing up you are agreeing to the
                      <br />
                      <span>
                        <a href="https://www.tooljet.com/terms">Terms of Service </a>&
                        <a href="https://www.tooljet.com/privacy"> Privacy Policy</a>
                      </span>
                    </p>
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
