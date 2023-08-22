import React from 'react';
import { appService, authenticationService } from '@/_services';
import Modal from 'react-bootstrap/Modal';
import { toast } from 'react-hot-toast';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Skeleton from 'react-loading-skeleton';
import { debounce } from 'lodash';
import Textarea from '@/_ui/Textarea';
import { withTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { getPrivateRoute } from '@/_helpers/routes';
import SolidIcon from '@/_ui/Icon/SolidIcons';

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
    const embeddableLink = `<iframe width="560" height="315" src="${appLink}${this.props.slug}" title="Tooljet app - ${this.props.slug}" frameborder="0" allowfullscreen></iframe>`;

    return (
      <div
        title="Share"
        className="editor-header-icon tj-secondary-btn"
        onClick={() => this.setState({ showModal: true })}
      >
        <SolidIcon name="share" width="14" className="cursor-pointer" fill="#3E63DD" />
        <Modal
          show={this.state.showModal}
          size="lg"
          backdrop="static"
          centered={true}
          keyboard={true}
          animation={false}
          onEscapeKeyDown={this.hideModal}
          className={`app-sharing-modal animation-fade ${this.props.darkMode ? 'dark-theme' : ''}`}
          contentClassName={this.props.darkMode ? 'dark-theme' : ''}
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
