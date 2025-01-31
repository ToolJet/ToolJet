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
    };
    this.formRef = React.createRef(null);
    this.single_organization = window.public_config?.DISABLE_MULTI_WORKSPACE === 'true';
    this.organizationId = new URLSearchParams(props?.location?.search).get('oid');
    this.organizationToken = new URLSearchParams(props?.location?.search).get('organizationToken');
    this.source = new URLSearchParams(props?.location?.search).get('source');
    this.whiteLabelText = retrieveWhiteLabelText();
    this.whiteLabelFavicon = retrieveWhiteLabelFavicon();
  }

  componentDidMount() {
    this.handleInvitation();
  }

  handleInvitation = async () => {
    this.setState({ isLoading: true });
    try {
      const response = await appService.acceptOrganizationInvitation(this.organizationId);
      if (response.success) {
        toast.success(this.props.t('Invitation accepted successfully'));
        onLoginSuccess(response.data);
        updateCurrentSession(response.data);
        this.props.history.push('/dashboard');
      } else {
        toast.error(this.props.t('Failed to accept the invitation'));
      }
    } catch (error) {
      toast.error(this.props.t('An error occurred while accepting the invitation'));
    } finally {
      this.setState({ isLoading: false });
    }
  };

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleEnterKey);
  }

  render() {
    const { isLoading } = this.state;
    return (
      <div>
        <OnboardingNavbar />
        <div className="invitation-container">
          {isLoading ? (
            <Spinner />
          ) : (
            <div>
              <h1>{this.props.t('Accepting your invitation...')}</h1>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default withRouter(withTranslation()(OrganizationInvitationPageComponent));
