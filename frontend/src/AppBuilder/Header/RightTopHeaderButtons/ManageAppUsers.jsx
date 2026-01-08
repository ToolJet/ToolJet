import React from 'react';
import { appService, appsService, authenticationService } from '@/_services';
import Modal from 'react-bootstrap/Modal';
import { toast } from 'react-hot-toast';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import _, { debounce, isEmpty } from 'lodash';
import { validateName } from '@/_helpers/utils';
import { withTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { getPrivateRoute, replaceEditorURL, getHostURL } from '@/_helpers/routes';
import { ToolTip } from '@/_components/ToolTip';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { TOOLTIP_MESSAGES } from '@/_helpers/constants';
import { retrieveWhiteLabelText } from '@white-label/whiteLabelling';
import useStore from '@/AppBuilder/_stores/store';
import { Button } from '@/components/ui/Button/Button';
import InputComponent from '@/components/ui/Input/Index';
import { MousePointerClick, Share2 } from 'lucide-react';
import queryString from 'query-string';

class ManageAppUsersComponent extends React.Component {
  constructor(props) {
    super(props);
    this.isUserAdmin = authenticationService.currentSessionValue?.admin;
    this.whiteLabelText = retrieveWhiteLabelText();

    this.state = {
      showModal: false,
      appId: null,
      isSlugVerificationInProgress: false,
      addingUser: false,
      newUser: {},
      newSlug: {
        value: null,
        error: '',
      },
      isHovered: false,
      isSlugUpdated: false,
    };
  }

  /* 
    Only will fail for existed apps before the app/workspace url revamp which has 
    special chars or spaces in their app slugs 
  */
  validateThePreExistingSlugs = () => {
    const existedSlugErrors = validateName(this.props.slug, 'App slug', true, false, false, false);
    this.setState({
      newSlug: {
        value: this.props.slug,
        error: existedSlugErrors.errorMsg,
      },
    });
  };

  componentDidMount() {
    const appId = this.props.appId;
    this.setState({ appId });
  }

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
      .createAppUser(this.state.appId, organizationUserId, role)
      .then(() => {
        this.setState({ addingUser: false, newUser: {} });
        toast.success('Added user successfully');
      })
      .catch(({ error }) => {
        this.setState({ addingUser: false });
        toast.error(error);
      });
  };
  toggleAppVisibility = () => {
    const newState = !this.props.isPublic;
    this.setState({
      ischangingVisibility: true,
    });
    useStore.getState().setIsPublic(newState);

    // eslint-disable-next-line no-unused-vars
    appsService
      .setVisibility(this.state.appId, newState)
      .then(() => {
        this.setState({
          ischangingVisibility: false,
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

    const error = validateName(value, `App ${field}`, true, false, !(field === 'slug'), !(field === 'slug'));

    if (!_.isEmpty(value) && value !== this.props.slug && _.isEmpty(error.errorMsg)) {
      this.setState({
        isSlugVerificationInProgress: true,
      });
      appsService
        .setSlug(this.state.appId, value)
        .then(() => {
          this.setState({
            newSlug: {
              value: value,
              error: '',
            },
            isSlugVerificationInProgress: false,
            isSlugUpdated: true,
          });

          replaceEditorURL(value, this.props.pageHandle);
          useStore.getState().setSlug(value);
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
  handleMouseEnter = () => {
    this.setState({ isHovered: true });
  };

  handleMouseLeave = () => {
    this.setState({ isHovered: false });
  };
  render() {
    const { appId, isSlugVerificationInProgress, newSlug, isSlugUpdated } = this.state;

    const appLink = `${getHostURL()}/applications/`;
    const shareableLink = appLink + (this.props.slug || appId);
    const slugButtonClass = !_.isEmpty(newSlug.error) ? 'is-invalid' : 'is-valid';
    const embeddableLink = `<iframe width="560" height="315" src="${appLink}${this.props.slug}" title="${this.whiteLabelText} app - ${this.props.slug}" frameborder="0" allowfullscreen></iframe>`;
    const { isHovered } = this.state.isHovered;
    const previewQuery = queryString.stringify({
      version: this.props.selectedVersion?.name,
      ...(this.props.multiEnvironmentEnabled ? { env: this.props.currentEnvironment?.name } : {}),
    });
    const appPreviewLink = this.props.editingVersion
      ? `${shareableLink}/${this.props.pageHandle}${!isEmpty(previewQuery) ? `?${previewQuery}` : ''}`
      : '';

    return (
      <div className="manage-app-users" data-cy="share-button-link">
        <ToolTip message="Share" placement="bottom">
          <Button
            variant="ghost"
            iconOnly
            onClick={() => {
              this.validateThePreExistingSlugs();
              this.setState({ showModal: true });
            }}
          >
            <Share2 width="16" height="16" className="tw-text-icon-strong" />
          </Button>
        </ToolTip>

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
            <Modal.Title className="tw-font-medium" data-cy="modal-header">
              {this.props.t('editor.share', 'Share')} {this.props.appName}
            </Modal.Title>
            <span onClick={this.hideModal} data-cy="modal-close-button">
              <SolidIcon name="remove" fill="var(--icon-strong)" className="cursor-pointer" aria-label="Close" />
            </span>
          </Modal.Header>
          <Modal.Body>
            {
              <div className="shareable-link-container">
                {this.props.isVersionReleased ? (
                  <div className="shareable-link tj-app-input tw-mb-[16px]">
                    <label data-cy="shareable-app-link-label" className="field-name">
                      {this.props.t('editor.shareModal.shareableLink', 'App link')}
                    </label>
                    <div className="input-group">
                      <InputComponent
                        aria-label="App link base url"
                        data-cy="app-link"
                        disabled
                        onChange={() => {}}
                        readOnly={appLink}
                        value=""
                      />
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
                          defaultValue={this.props.slug}
                          data-cy="app-name-slug-input"
                          disabled={!this.props.isVersionReleased}
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
                    </div>
                    {newSlug?.error ? (
                      <label className="label tj-input-error" data-cy="app-slug-error-label">
                        {newSlug?.error || ''}
                      </label>
                    ) : isSlugUpdated ? (
                      <label
                        className="label label-success"
                        data-cy="app-slug-accepted-label"
                      >{`Slug accepted!`}</label>
                    ) : (
                      <label
                        className="label label-info"
                        data-cy="app-slug-info-label"
                      >{`URL-friendly 'slug' consists of lowercase letters, numbers, and hyphens`}</label>
                    )}
                    <div className="tw-flex tw-justify-between">
                      <div className="make-public d-flex align-items-center">
                        <div className="form-check form-switch d-flex align-items-center tw-mb-0">
                          {this.props.isVersionReleased ? (
                            <div>
                              <input
                                className="form-check-input"
                                type="checkbox"
                                onClick={this.toggleAppVisibility}
                                checked={this?.props?.isPublic}
                                disabled={this.state.ischangingVisibility}
                                data-cy="make-public-app-toggle"
                              />
                              <span className="form-check-label field-name !tw-ml-0" data-cy="make-public-app-label">
                                {this.props.t('editor.shareModal.makeApplicationPublic', 'Make application public')}
                              </span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'left', gap: '8px' }}>
                              <ToolTip
                                message={TOOLTIP_MESSAGES.RELEASE_VERSION_URL_UNAVAILABLE}
                                placement={'top'}
                                show={isHovered}
                              >
                                <div
                                  onMouseEnter={this.handleMouseEnter}
                                  onMouseLeave={this.handleMouseLeave}
                                  style={{
                                    width: '32px',
                                    height: '18px',
                                    marginLeft: '-40px',
                                  }}
                                >
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    disabled
                                    style={{
                                      opacity: 0.3,
                                      cursor: 'default',
                                      margin: 0,
                                      padding: 0,
                                    }}
                                  />
                                </div>
                              </ToolTip>

                              <span
                                className="form-check-label field-name"
                                data-cy="make-public-app-label"
                                style={{ opacity: 0.6 }}
                              >
                                {this.props.t('editor.shareModal.makeApplicationPublic', 'Make application public')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <CopyToClipboard text={shareableLink} onCopy={() => toast.success('Link copied to clipboard')}>
                        <Button isLucid leadingIcon="copy">
                          Copy link
                        </Button>
                      </CopyToClipboard>
                    </div>
                  </div>
                ) : (
                  <div className="shareable-link tj-app-input mb-2">
                    <label data-cy="shareable-app-link-label" className="field-name">
                      {this.props.t('editor.shareModal.shareableLink', 'App link')}
                    </label>
                    <div className="empty-version">
                      <div className="tw-h-[32px] tw-w-[32px] tw-rounded-[8px] tw-p-[6px] tw-bg-[var(--background-surface-layer-02)]">
                        <MousePointerClick size={20} color="var(--icon-default)" />
                      </div>
                      <p className="tw-m-0 tw-text-[var(--text-default)] tw-text-[12px]/[18px] tw-font-medium">
                        Version not released
                      </p>
                      <span className="tw-text-[var(--text-placeholder)] tw-text-[12px]/[18px] tw-font-normal">
                        Release to get a shareable link
                      </span>
                    </div>
                  </div>
                )}

                {this?.props?.isVersionReleased &&
                  (this?.props?.isPublic || window?.public_config?.ENABLE_PRIVATE_APP_EMBED === 'true') && (
                    <div className="tj-app-input">
                      <label className="field-name" data-cy="iframe-link-label">
                        Embed app
                      </label>
                      <span className={`iframe-link-container tj-text-input justify-content-between`}>
                        <span data-cy="iframe-link">{embeddableLink}</span>
                        <span className="copy-container">
                          <CopyToClipboard
                            text={embeddableLink}
                            onCopy={() => toast.success('Link copied to clipboard')}
                          >
                            <Button iconOnly isLucid leadingIcon="copy" size="medium" variant="outline" />
                          </CopyToClipboard>
                        </span>
                      </span>
                    </div>
                  )}
              </div>
            }
          </Modal.Body>

          <Modal.Footer className="manage-app-users-footer">
            <CopyToClipboard text={appPreviewLink} onCopy={() => toast.success('Link copied to clipboard')}>
              <Button isLucid leadingIcon="eye" variant="outline">
                Copy preview link
              </Button>
            </CopyToClipboard>
            {this.isUserAdmin && (
              <Link to={getPrivateRoute('workspace_settings')} target="_blank">
                <Button variant="secondary" isLucid leadingIcon="users" data-cy="manage-users-button">
                  Manage users
                </Button>
              </Link>
            )}
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}

export const ManageAppUsers = withTranslation()(ManageAppUsersComponent);
