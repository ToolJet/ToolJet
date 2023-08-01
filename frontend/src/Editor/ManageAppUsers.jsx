import React from 'react';
import { appService, authenticationService } from '@/_services';
import Modal from 'react-bootstrap/Modal';
import { toast } from 'react-hot-toast';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Skeleton from 'react-loading-skeleton';
import { debounce } from 'lodash';
import Textarea from '@/_ui/Textarea';
import posthog from 'posthog-js';
import { retrieveWhiteLabelText } from '@/_helpers/utils';
import { withTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { getPrivateRoute } from '@/_helpers/routes';

class ManageAppUsersComponent extends React.Component {
  constructor(props) {
    super(props);
    this.isUserAdmin = authenticationService.currentSessionValue?.admin;

    this.state = {
      showModal: false,
      app: { ...props.app },
      slugError: null,
      isLoading: true,
      isSlugVerificationInProgress: false,
      addingUser: false,
      newUser: {},
    };
  }

  componentDidMount() {
    const appId = this.props.app.id;
    this.fetchAppUsers();
    this.setState({ appId });
  }

  fetchAppUsers = () => {
    appService
      .getAppUsers(this.props.app.id)
      .then((data) =>
        this.setState({
          users: data.users,
          isLoading: false,
        })
      )
      .catch((error) => {
        this.setState({ isLoading: false });
        toast.error(error);
      });
  };

  hideModal = () => {
    this.setState({
      showModal: false,
    });
  };

  addUser = () => {
    this.setState({
      addingUser: true,
    });

    const { organizationUserId, role } = this.state.newUser;

    appService
      .createAppUser(this.state.app.id, organizationUserId, role)
      .then(() => {
        this.setState({ addingUser: false, newUser: {} });
        toast.success('Added user successfully');
        this.fetchAppUsers();
      })
      .catch(({ error }) => {
        this.setState({ addingUser: false });
        toast.error(error);
      });
  };

  toggleAppVisibility = () => {
    const newState = !this.state.app.is_public;
    this.setState({
      ischangingVisibility: true,
    });

    // eslint-disable-next-line no-unused-vars
    appService
      .setVisibility(this.state.app.id, newState)
      .then(() => {
        this.setState({
          ischangingVisibility: false,
          app: {
            ...this.state.app,
            is_public: newState,
          },
        });

        if (newState) {
          toast('Application is now public.');
        } else {
          toast('Application visibility set to private');
        }
      })
      .catch((error) => {
        this.setState({
          ischangingVisibility: false,
        });
        toast.error(error);
      });
  };

  handleSetSlug = (event) => {
    const newSlug = event.target.value || this.props.app.id;
    this.setState({ isSlugVerificationInProgress: true });

    appService
      .setSlug(this.state.app.id, newSlug)
      .then(() => {
        this.setState({
          slugError: null,
          isSlugVerificationInProgress: false,
        });
        this.props.handleSlugChange(newSlug);
      })
      .catch(({ error }) => {
        this.setState({
          slugError: error,
          isSlugVerificationInProgress: false,
        });
      });
  };

  delayedSlugChange = debounce((e) => {
    this.handleSetSlug(e);
  }, 500);

  render() {
    const { isLoading, app, slugError, isSlugVerificationInProgress } = this.state;
    const appId = app.id;
    const appLink = `${window.public_config?.TOOLJET_HOST}/applications/`;
    const shareableLink = appLink + (this.props.slug || appId);
    const slugButtonClass = isSlugVerificationInProgress ? '' : slugError !== null ? 'is-invalid' : 'is-valid';
    const embeddableLink = `<iframe width="560" height="315" src="${appLink}${
      this.props.slug
    }" title="${retrieveWhiteLabelText()} app - ${this.props.slug}" frameborder="0" allowfullscreen></iframe>`;

    return (
      <div title="Share">
        <svg
          className="w-100 h-100 cursor-pointer icon"
          onClick={() => {
            posthog.capture('click_share', { appId }); //posthog event
            this.setState({ showModal: true });
          }}
          width="33"
          height="33"
          viewBox="0 0 33 33"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          data-cy="share-button-link"
        >
          <rect x="0.363281" y="0.220703" width="32" height="32" rx="6" fill="#F0F4FF" />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M20.362 10.8875C19.6256 10.8875 19.0286 11.4845 19.0286 12.2209C19.0286 12.4112 19.0685 12.5922 19.1404 12.756C19.1453 12.7646 19.15 12.7733 19.1546 12.7822C19.1647 12.8019 19.1738 12.8217 19.1818 12.8418C19.4051 13.2654 19.8498 13.5542 20.362 13.5542C21.0984 13.5542 21.6953 12.9572 21.6953 12.2209C21.6953 11.4845 21.0984 10.8875 20.362 10.8875ZM18.3354 13.9542C18.8245 14.5255 19.551 14.8875 20.362 14.8875C21.8347 14.8875 23.0286 13.6936 23.0286 12.2209C23.0286 10.7481 21.8347 9.5542 20.362 9.5542C18.8892 9.5542 17.6953 10.7481 17.6953 12.2209C17.6953 12.4043 17.7138 12.5834 17.7491 12.7564L14.3886 14.4876C13.8995 13.9163 13.173 13.5542 12.362 13.5542C10.8892 13.5542 9.69531 14.7481 9.69531 16.2209C9.69531 17.6936 10.8892 18.8875 12.362 18.8875C13.173 18.8875 13.8995 18.5255 14.3886 17.9542L17.7491 19.6854C17.7138 19.8584 17.6953 20.0375 17.6953 20.2209C17.6953 21.6936 18.8892 22.8875 20.362 22.8875C21.8347 22.8875 23.0286 21.6936 23.0286 20.2209C23.0286 18.7481 21.8347 17.5542 20.362 17.5542C19.551 17.5542 18.8245 17.9163 18.3354 18.4876L14.9749 16.7564C15.0101 16.5834 15.0286 16.4043 15.0286 16.2209C15.0286 16.0375 15.0101 15.8584 14.9749 15.6854L18.3354 13.9542ZM13.5422 15.5999C13.5502 15.62 13.5592 15.6399 13.5693 15.6595C13.5739 15.6684 13.5787 15.6771 13.5836 15.6857C13.6554 15.8495 13.6953 16.0305 13.6953 16.2209C13.6953 16.4112 13.6554 16.5922 13.5836 16.756C13.5787 16.7646 13.5739 16.7733 13.5693 16.7822C13.5592 16.8019 13.5502 16.8217 13.5422 16.8418C13.3188 17.2654 12.8741 17.5542 12.362 17.5542C11.6256 17.5542 11.0286 16.9572 11.0286 16.2209C11.0286 15.4845 11.6256 14.8875 12.362 14.8875C12.8741 14.8875 13.3188 15.1763 13.5422 15.5999ZM19.1404 19.6857C19.1453 19.6771 19.15 19.6684 19.1546 19.6595C19.1647 19.6399 19.1738 19.62 19.1818 19.5999C19.4051 19.1763 19.8498 18.8875 20.362 18.8875C21.0984 18.8875 21.6953 19.4845 21.6953 20.2209C21.6953 20.9572 21.0984 21.5542 20.362 21.5542C19.6256 21.5542 19.0286 20.9572 19.0286 20.2209C19.0286 20.0305 19.0685 19.8495 19.1404 19.6857Z"
            fill="#3E63DD"
          />
        </svg>
        <Modal
          show={this.state.showModal}
          size="lg"
          backdrop="static"
          centered={true}
          keyboard={true}
          animation={false}
          onEscapeKeyDown={this.hideModal}
          className="app-sharing-modal animation-fade"
          contentClassName={this.props.darkMode ? 'theme-dark' : ''}
        >
          <Modal.Header>
            <Modal.Title data-cy="modal-header">{this.props.t('editor.share', 'Share')}</Modal.Title>
            <button className="btn-close" aria-label="Close" onClick={this.hideModal} data-cy="modal-close-button" />
          </Modal.Header>
          <Modal.Body>
            {isLoading ? (
              <div style={{ width: '100%' }} className="p-5">
                <Skeleton count={5} />
              </div>
            ) : (
              <div>
                <div className="make-public mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      onClick={this.toggleAppVisibility}
                      checked={this.state.app.is_public}
                      disabled={this.state.ischangingVisibility}
                      data-cy="make-public-app-toggle"
                    />
                    <span className="form-check-label" data-cy="make-public-app-label">
                      {this.props.t('editor.shareModal.makeApplicationPublic', 'Make application public?')}
                    </span>
                  </div>
                </div>

                <div className="shareable-link mb-3">
                  <label className="form-label" data-cy="shareable-app-link-label">
                    <small>
                      {this.props.t('editor.shareModal.shareableLink', 'Get shareable link for this application')}
                    </small>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text" data-cy="app-link">
                      {appLink}
                    </span>
                    <div className="input-with-icon">
                      <input
                        type="text"
                        className={`form-control form-control-sm ${slugButtonClass}`}
                        placeholder={appId}
                        onChange={(e) => {
                          e.persist();
                          this.delayedSlugChange(e);
                        }}
                        defaultValue={this.props.slug}
                        data-cy="app-name-slug-input"
                      />
                      {isSlugVerificationInProgress && (
                        <div className="icon-container">
                          <div className="spinner-border text-azure spinner-border-sm" role="status"></div>
                        </div>
                      )}
                    </div>
                    <span className="input-group-text">
                      <CopyToClipboard text={shareableLink} onCopy={() => toast.success('Link copied to clipboard')}>
                        <button className="btn btn-secondary btn-sm" data-cy="copy-app-link-button">
                          {this.props.t('editor.shareModal.copy', 'copy')}
                        </button>
                      </CopyToClipboard>
                    </span>
                    <div className="invalid-feedback">{slugError}</div>
                  </div>
                </div>
                <hr />
                {(this.state.app.is_public || window?.public_config?.ENABLE_PRIVATE_APP_EMBED === 'true') && (
                  <div className="shareable-link mb-3">
                    <label className="form-label" data-cy="iframe-link-label">
                      <small>
                        {this.props.t('editor.shareModal.embeddableLink', 'Get embeddable link for this application')}
                      </small>
                    </label>
                    <div className="input-group">
                      <Textarea
                        disabled
                        className={`input-with-icon ${this.props.darkMode && 'text-light'}`}
                        rows={5}
                        value={embeddableLink}
                        data-cy="iframe-link"
                      />
                      <span className="input-group-text">
                        <CopyToClipboard
                          text={embeddableLink}
                          onCopy={() => toast.success('Embeddable link copied to clipboard')}
                        >
                          <button className="btn btn-secondary btn-sm" data-cy="iframe-link-copy-button">
                            {this.props.t('editor.shareModal.copy', 'copy')}
                          </button>
                        </CopyToClipboard>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Modal.Body>

          <Modal.Footer>
            {this.isUserAdmin && (
              <Link
                to={getPrivateRoute('workspace_settings')}
                target="_blank"
                className="btn color-primary mt-3"
                data-cy="manage-users-button"
              >
                Manage users
              </Link>
            )}
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}

export const ManageAppUsers = withTranslation()(ManageAppUsersComponent);
