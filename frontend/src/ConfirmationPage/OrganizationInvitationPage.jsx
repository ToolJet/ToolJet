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
class OrganizationInvitationPageComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
    };
    this.formRef = React.createRef(null);
    this.single_organization = window.public_config?.DISABLE_MULTI_WORKSPACE === 'true';
    this.organizationId = new URLSearchParams(props?.location?.search).get('oid');
    this.source = new URLSearchParams(props?.location?.search).get('source');
  }

  componentDidMount() {
    authenticationService.deleteLoginOrganizationId();
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
        onLoginSuccess(data, this.props.navigate, `/${data.current_organization_slug}`);
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
                    <h2 className="common-auth-section-header org-invite-header" data-cy="workspace-invite-page-header">
                      Join {organizationName ? organizationName : 'ToolJet'}
                    </h2>

                    <div className="invite-sub-header" data-cy="workspace-invite-page-sub-header">
                      {`You are invited to ${
                        organizationName
                          ? `a workspace ${organizationName}. Accept the invite to join the workspace.`
                          : 'ToolJet.'
                      }`}
                    </div>

                    <div className="org-page-inputs-wrapper">
                      <label className="tj-text-input-label">Name</label>
                      <p className="tj-text-input">{name}</p>
                    </div>

                    <div className="signup-inputs-wrap">
                      <label className="tj-text-input-label">Email</label>
                      <p className="tj-text-input">{email}</p>
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
                            <EnterIcon className="enter-icon-onboard" />
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
