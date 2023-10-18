import React from 'react';
import { appService, appsService, authenticationService } from '@/_services';
import Modal from 'react-bootstrap/Modal';
import { toast } from 'react-hot-toast';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Skeleton from 'react-loading-skeleton';
import _, { debounce } from 'lodash';
import { withTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { getPrivateRoute, replaceEditorURL, getHostURL } from '@/_helpers/routes';
import { validateName } from '@/_helpers/utils';
import SolidIcon from '@/_ui/Icon/SolidIcons';

class ManageAppUsersComponent extends React.Component {
  constructor(props) {
    super(props);
    this.isUserAdmin = authenticationService.currentSessionValue?.admin;

    this.state = {
      showModal: false,
      app: { ...props.app },
      isLoading: true,
      isSlugVerificationInProgress: false,
      addingUser: false,
      newUser: {},
      newSlug: {
        value: null,
        error: '',
      },
      isSlugUpdated: false,
    };
  }

  componentDidMount() {
    const appId = this.props.app.id;
    this.fetchAppUsers();
    this.setState({ appId });
  }

  fetchAppUsers = () => {
    appsService
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
      newSlug: {
        value: this.props.slug,
        error: '',
      },
      isSlugVerificationInProgress: false,
      isSlugUpdated: false,
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
    appsService
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

  delayedSlugChange = debounce((e) => {
    this.handleInputChange(e.target.value, 'slug');
  }, 500);

  handleInputChange = (value, field) => {
    this.setState({
      newSlug: {
        value: this.state.newSlug?.value,
        error: '',
        isSlugUpdated: false,
      },
    });

    const error = validateName(value, `App ${field}`, false, !(field === 'slug'), !(field === 'slug'));

    if (!_.isEmpty(value) && value !== this.props.slug && _.isEmpty(error.errorMsg)) {
      this.setState({
        isSlugVerificationInProgress: true,
      });
      appsService
        .setSlug(this.state.app.id, value)
        .then(() => {
          this.setState({
            newSlug: {
              value: value,
              error: '',
            },
            isSlugVerificationInProgress: false,
            isSlugUpdated: true,
          });
          this.props.handleSlugChange(value);
          replaceEditorURL(value, this.props.pageHandle);
        })
        .catch(({ error }) => {
          this.setState({
            newSlug: {
              value,
              error,
            },
            isSlugVerificationInProgress: false,
            isSlugUpdated: false,
          });
        });
    } else {
      this.setState({
        newSlug: {
          value,
          error: error?.errorMsg,
        },
        isSlugVerificationInProgress: false,
        isSlugUpdated: false,
      });
    }
  };

  render() {
    const { isLoading, app, isSlugVerificationInProgress, newSlug, isSlugUpdated } = this.state;
    const appId = app.id;
    const appLink = `${getHostURL()}/applications/`;
    const shareableLink = appLink + (this.props.slug || appId);
    const slugButtonClass = !_.isEmpty(newSlug.error) ? 'is-invalid' : 'is-valid';
    const embeddableLink = `<iframe width="560" height="315" src="${appLink}${this.props.slug}" title="Tooljet app - ${this.props.slug}" frameborder="0" allowfullscreen></iframe>`;

    return (
      <div title="Share" className="manage-app-users editor-header-icon tj-secondary-btn" data-cy="share-button-link">
        <span className="d-flex" onClick={() => this.setState({ showModal: true })}>
          <SolidIcon name="share" width="14" className="cursor-pointer" fill="#3E63DD" />
        </span>
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
            <span onClick={this.hideModal} data-cy="modal-close-button">
              <SolidIcon name="remove" className="cursor-pointer" aria-label="Close" />
            </span>
          </Modal.Header>
          <Modal.Body>
            {isLoading ? (
              <div style={{ width: '100%' }} className="p-5">
                <Skeleton count={5} />
              </div>
            ) : (
              <div class="shareable-link-container">
                <div className="make-public mb-3">
                  <div className="form-check form-switch d-flex align-items-center">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      onClick={this.toggleAppVisibility}
                      checked={this.state.app.is_public}
                      disabled={this.state.ischangingVisibility}
                      data-cy="make-public-app-toggle"
                    />
                    <span className="form-check-label field-name" data-cy="make-public-app-label">
                      {this.props.t('editor.shareModal.makeApplicationPublic', 'Make application public')}
                    </span>
                  </div>
                </div>

                <div className="shareable-link tj-app-input mb-2">
                  <label data-cy="shareable-app-link-label" className="field-name">
                    {this.props.t('editor.shareModal.shareableLink', 'Shareable app link')}
                  </label>
                  <div className="input-group">
                    <span className="input-group-text applink-text flex-grow-1 slug-ellipsis" data-cy="app-link">
                      {appLink}
                    </span>
                    <div className="input-with-icon">
                      <input
                        type="text"
                        className={`form-control form-control-sm ${slugButtonClass}`}
                        placeholder={this.props.slug}
                        maxLength={50}
                        onChange={(e) => {
                          e.persist();
                          this.delayedSlugChange(e);
                        }}
                        style={{ maxWidth: '150px' }}
                        defaultValue={this.props.slug}
                        data-cy="app-name-slug-input"
                      />
                      {isSlugVerificationInProgress && (
                        <div className="icon-container">
                          <div class="spinner-border text-secondary " role="status">
                            <span class="visually-hidden">Loading...</span>
                          </div>
                        </div>
                      )}

                      <div className="icon-container">
                        {newSlug?.error ? (
                          <svg
                            width="21"
                            height="20"
                            viewBox="0 0 21 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fill-rule="evenodd"
                              clip-rule="evenodd"
                              d="M3.94252 3.61195C4.31445 3.24003 4.91746 3.24003 5.28939 3.61195L10.3302 8.6528L15.3711 3.61195C15.743 3.24003 16.346 3.24003 16.718 3.61195C17.0899 3.98388 17.0899 4.5869 16.718 4.95882L11.6771 9.99967L16.718 15.0405C17.0899 15.4125 17.0899 16.0155 16.718 16.3874C16.346 16.7593 15.743 16.7593 15.3711 16.3874L10.3302 11.3465L5.28939 16.3874C4.91746 16.7593 4.31445 16.7593 3.94252 16.3874C3.57059 16.0155 3.57059 15.4125 3.94252 15.0405L8.98337 9.99967L3.94252 4.95882C3.57059 4.5869 3.57059 3.98388 3.94252 3.61195Z"
                              fill="#E54D2E"
                            />
                          </svg>
                        ) : (
                          isSlugUpdated &&
                          !isSlugVerificationInProgress && (
                            <svg
                              width="21"
                              height="20"
                              viewBox="0 0 21 20"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                fill-rule="evenodd"
                                clip-rule="evenodd"
                                d="M17.5859 5.24408C17.9114 5.56951 17.9114 6.09715 17.5859 6.42259L9.25259 14.7559C8.92715 15.0814 8.39951 15.0814 8.07407 14.7559L3.90741 10.5893C3.58197 10.2638 3.58197 9.73618 3.90741 9.41074C4.23284 9.08531 4.76048 9.08531 5.08592 9.41074L8.66333 12.9882L16.4074 5.24408C16.7328 4.91864 17.2605 4.91864 17.5859 5.24408Z"
                                fill="#46A758"
                              />
                            </svg>
                          )
                        )}
                      </div>
                    </div>
                    <span className="input-group-text">
                      <CopyToClipboard text={shareableLink} onCopy={() => toast.success('Link copied to clipboard')}>
                        <svg
                          className="cursor-pointer"
                          width="17"
                          height="18"
                          viewBox="0 0 17 18"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M9.11154 5.18031H5.88668V4.83302C5.88668 3.29859 7.13059 2.05469 8.66502 2.05469H12.8325C14.3669 2.05469 15.6109 3.29859 15.6109 4.83302V9.00052C15.6109 10.535 14.3669 11.7789 12.8325 11.7789H12.4852V8.554C12.4852 6.69076 10.9748 5.18031 9.11154 5.18031Z"
                            fill="#889096"
                          />
                          <path
                            d="M8.66502 15.9464H4.49752C2.96309 15.9464 1.71918 14.7025 1.71918 13.168V9.00052C1.71918 7.46609 2.96309 6.22219 4.49752 6.22219H8.66502C10.1994 6.22219 11.4434 7.46609 11.4434 9.00052V13.168C11.4434 14.7025 10.1994 15.9464 8.66502 15.9464Z"
                            fill="#889096"
                          />
                        </svg>
                      </CopyToClipboard>
                    </span>
                  </div>
                  {newSlug?.error ? (
                    <label className="label tj-input-error">{newSlug?.error || ''}</label>
                  ) : isSlugUpdated ? (
                    <label className="label label-success">{`Slug accepted!`}</label>
                  ) : (
                    <label className="label label-info">{`URL-friendly 'slug' consists of lowercase letters, numbers, and hyphens`}</label>
                  )}
                </div>
                {(this.state.app.is_public || window?.public_config?.ENABLE_PRIVATE_APP_EMBED === 'true') && (
                  <div className="tj-app-input">
                    <label className="field-name">Embedded app link</label>
                    <span className={`tj-text-input justify-content-between ${this.props.darkMode ? 'dark' : ''}`}>
                      <span>{embeddableLink}</span>
                      <span className="copy-container">
                        <CopyToClipboard text={embeddableLink} onCopy={() => toast.success('Link copied to clipboard')}>
                          <svg
                            className="cursor-pointer"
                            width="17"
                            height="18"
                            viewBox="0 0 17 18"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M9.11154 5.18031H5.88668V4.83302C5.88668 3.29859 7.13059 2.05469 8.66502 2.05469H12.8325C14.3669 2.05469 15.6109 3.29859 15.6109 4.83302V9.00052C15.6109 10.535 14.3669 11.7789 12.8325 11.7789H12.4852V8.554C12.4852 6.69076 10.9748 5.18031 9.11154 5.18031Z"
                              fill="#889096"
                            />
                            <path
                              d="M8.66502 15.9464H4.49752C2.96309 15.9464 1.71918 14.7025 1.71918 13.168V9.00052C1.71918 7.46609 2.96309 6.22219 4.49752 6.22219H8.66502C10.1994 6.22219 11.4434 7.46609 11.4434 9.00052V13.168C11.4434 14.7025 10.1994 15.9464 8.66502 15.9464Z"
                              fill="#889096"
                            />
                          </svg>
                        </CopyToClipboard>
                      </span>
                    </span>
                  </div>
                )}
              </div>
            )}
          </Modal.Body>

          <Modal.Footer className="manage-app-users-footer">
            {this.isUserAdmin && (
              <Link
                to={getPrivateRoute('workspace_settings')}
                target="_blank"
                className={`btn border-0 default-secondary-button float-right1`}
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
