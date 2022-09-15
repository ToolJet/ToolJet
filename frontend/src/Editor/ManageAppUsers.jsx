import React from 'react';
import { appService } from '@/_services';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { toast } from 'react-hot-toast';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Skeleton from 'react-loading-skeleton';
import { debounce } from 'lodash';
import Textarea from '@/_ui/Textarea';
import { withTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

class ManageAppUsersComponent extends React.Component {
  constructor(props) {
    super(props);

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
    appService.getAppUsers(this.props.app.id).then((data) =>
      this.setState({
        users: data.users,
        isLoading: false,
      })
    );
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
    appService.setVisibility(this.state.app.id, newState).then((data) => {
      this.setState({
        ischangingVisibility: false,
        app: {
          ...this.state.app,
          is_public: newState,
        },
      });

      if (newState) {
        toast.success('Application is now public.');
      } else {
        toast.success('Application visibility set to private');
      }
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
      <div>
        <button className="btn font-500 color-primary btn-sm" onClick={() => this.setState({ showModal: true })}>
          {this.props.t('editor.share', 'Share')}
        </button>

        <Modal
          show={this.state.showModal}
          size="lg"
          backdrop="static"
          centered={true}
          keyboard={true}
          animation={false}
          onEscapeKeyDown={this.hideModal}
          className="app-sharing-modal"
          contentClassName={this.props.darkMode ? 'theme-dark' : ''}
        >
          <Modal.Header>
            <Modal.Title>{this.props.t('editor.share', 'Share')}</Modal.Title>
            <div>
              <Button variant={this.props.darkMode ? 'secondary' : 'light'} size="sm" onClick={() => this.hideModal()}>
                x
              </Button>
            </div>
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
                      onClick={() => this.toggleAppVisibility()}
                      checked={this.state.app.is_public}
                      disabled={this.state.ischangingVisibility}
                    />
                    <span className="form-check-label">
                      {this.props.t('editor.shareModal.makeApplicationPublic', 'Make application public ?')}
                    </span>
                  </div>
                </div>
                <div className="shareable-link mb-3">
                  <label className="form-label">
                    <small>
                      {this.props.t('editor.shareModal.shareableLink', 'Get shareable link for this application')}
                    </small>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">{appLink}</span>
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
                      />
                      {isSlugVerificationInProgress && (
                        <div className="icon-container">
                          <div className="spinner-border text-azure spinner-border-sm" role="status"></div>
                        </div>
                      )}
                    </div>
                    <span className="input-group-text">
                      <CopyToClipboard text={shareableLink} onCopy={() => toast.success('Link copied to clipboard')}>
                        <button className="btn btn-secondary btn-sm">
                          {this.props.t('editor.shareModal.copy', 'copy')}
                        </button>
                      </CopyToClipboard>
                    </span>
                    <div className="invalid-feedback">{slugError}</div>
                  </div>
                </div>
                <hr />
                <div className="shareable-link mb-3">
                  <label className="form-label">
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
                    />
                    <span className="input-group-text">
                      <CopyToClipboard
                        text={embeddableLink}
                        onCopy={() =>
                          toast.success('Link copied to clipboard', {
                            hideProgressBar: true,
                            position: 'bottom-center',
                          })
                        }
                      >
                        <button className="btn btn-secondary btn-sm">
                          {this.props.t('editor.shareModal.copy', 'copy')}
                        </button>
                      </CopyToClipboard>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Link to="/users" target="_blank" className="btn color-primary mt-3">
              {this.props.t('editor.shareModal.manageUsers', 'Manage Users')}
            </Link>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}

export const ManageAppUsers = withTranslation()(ManageAppUsersComponent);
