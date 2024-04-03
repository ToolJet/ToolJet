import React, { Component } from 'react';
import Toggle from '@/_ui/Toggle';
import Button from '@/_ui/Button';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { withTranslation } from 'react-i18next';
import { gitSyncService } from '@/_services/git_sync.service';
import { authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { licenseService } from '@/_services/license.service';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { ConfirmDialog } from '@/_components';
import { LicenseBanner } from '@/LicenseBanner';
import { Spinner } from 'react-bootstrap';
import './configPage.scss';

const KEY_TYPE = {
  ED25519: 'ed25519',
  RSA: 'rsa',
};
class GitSyncConfigComponent extends Component {
  constructor(props) {
    super(props);
    this.initialState = {
      gitSyncToogle: false,
      disableGenerateButtonStatus: true,
      sshKey: '',
      finalizeBtnDisable: true,
      deleteButtonDisable: true,
      session: authenticationService.currentSessionValue,
      workspaceId: authenticationService.currentSessionValue?.current_organization_id,
      gitUrl: '',
      orgGit: {},
      isFinalized: false,
      sshKeyGenerated: false,
      inputUrl: '',
      editingMode: false,
      isEnabled: false,
      generateKeyLoader: false,
      deleteCofigLoader: false,
      finalLoader: false,
      lockUrlinput: false,
      showDeleteModal: false,
      repoLink: '',
      toggleMessage: 'Enable it to sync data within apps',
      urlInputMessage: 'Creating an empty git repository is recommended',
      validUrl: true,
      connectFail: false,
      errorMessage: '',
      autoCommit: false,
      keyType: KEY_TYPE.ED25519,
      isUpdatingKey: false,
      featureAccess: {},
    };

    this.state = { ...this.initialState, isGitSyncFeatureEnabled: false };
  }

  componentDidMount = () => {
    this.getGitSyncFeatureAccess();
    this.getOrgGit(this.state.workspaceId);
  };

  lockUrl = () => {
    this.setState({
      lockUrlinput: true,
    });
  };

  getGitSyncFeatureAccess = () => {
    licenseService.getFeatureAccess().then((data) => {
      const isGitSyncFeature = data?.gitSync ? true : false;
      this.setState({
        isGitSyncFeatureEnabled: isGitSyncFeature,
        featureAccess: data,
      });
    });
  };

  unlockUrl = () => {
    this.setState({
      lockUrlinput: false,
    });
  };

  setGitSync = () => {
    const toggleNew = !this.state.gitSyncToogle;
    this.setFinalizeConfig(true, toggleNew, (state) => {
      if (state) {
        if (this.state.isEnabled) {
          toast.success('GitSync has been successfully connected!');
        } else {
          toast.success('GitSync has been successfully \n disconnected!');
        }
      } else {
        toast.error('Could not connect. Please try again!');
      }
    });
    this.setState({
      toggleMessage: `${
        this.state.isEnabled ? 'Disabling will stop syncing data within apps' : 'Enable it to sync data within apps'
      }`,
    });
  };

  getOrgGit = (workspaceId, callback = () => {}) => {
    return gitSyncService.getGitConfig(workspaceId).then((response) => {
      const orgGit = response?.organization_git;
      if (orgGit) {
        this.setConfiguredState(orgGit, callback);
      }
    });
  };

  setNotShowDeleteModal = () => {
    this.setState({
      showDeleteModal: false,
    });
  };

  setShowDeleteModal = () => {
    this.setState({
      showDeleteModal: true,
    });
  };

  setAutoCommit = () => {
    gitSyncService.updateConfig(this.state.orgGit?.id, { autoCommit: !this.state.autoCommit }).then(() => {
      this.setState((prevState) => ({
        autoCommit: !prevState.autoCommit,
      }));
    });
  };

  generateSshKey = () => {
    const { workspaceId, gitUrl, keyType } = this.state;
    this.lockUrl();
    this.setState({
      generateKeyLoader: true,
    });
    if (!this.state.sshKeyGenerated) {
      gitSyncService
        .create(workspaceId, gitUrl)
        .then((response) => {
          const orgGit = response.org_git;
          this.setConfiguredState(orgGit);
          this.unlockUrl();
        })
        .catch((err) => {
          toast.error('Not able to generate SSH Config');
        });
    } else {
      gitSyncService
        .updateConfig(this.state.orgGit?.id, { gitUrl: this.state.gitUrl, autoCommit: null, keyType: keyType })
        .then(() => {
          this.getOrgGit(workspaceId);
          this.unlockUrl();
        })
        .catch((err) => {
          toast.error('Not able to update the configuration');
        });
    }
  };

  updatingSshKey = (keyType) => {
    this.setState({
      isUpdatingKey: true,
    });
    const { workspaceId } = this.state;
    gitSyncService
      .updateConfig(this.state.orgGit?.id, { autoCommit: null, keyType: keyType })
      .then(() => {
        this.getOrgGit(workspaceId);
        this.unlockUrl();
      })
      .catch((err) => {
        this.setState({
          isUpdatingKey: false,
        });
        toast.error('Not able to update the configuration');
      });
  };

  setConfiguredState(orgGit, callback = () => {}) {
    this.setState(
      {
        orgGit: orgGit,
        sshKey: orgGit.ssh_public_key,
        sshKeyGenerated: true,
        isFinalized: orgGit?.is_finalized,
        isEnabled: orgGit?.is_enabled,
        finalizeBtnDisable: orgGit?.is_finalized,
        deleteButtonDisable: !orgGit?.is_finalized,
        gitUrl: orgGit?.git_url,
        inputUrl: orgGit?.git_url,
        keyType: orgGit?.key_type,
        editingMode: false,
        disableGenerateButtonStatus: true,
        gitSyncToogle: orgGit?.is_enabled,
        generateKeyLoader: false,
        deleteCofigLoader: false,
        updatingSshKey: false,
        finalLoader: false,
        showDeleteModal: false,
        isUpdatingKey: false,
        connectFail: false,
        repoLink: this.convertSshtoHttps(orgGit?.git_url),
        toggleMessage: `${
          orgGit?.is_enabled ? 'Disabling will stop syncing data within apps' : 'Enable it to sync data within apps'
        }`,
        autoCommit: orgGit?.auto_commit,
      },
      () => {
        callback();
      }
    );
  }

  setFinalizeConfig = (isFinalized, isEnabled, callback = () => {}) => {
    const { orgGit } = this.state;
    const body = {
      isFinalized,
      isEnabled,
    };
    gitSyncService
      .setFinalizeConfig(orgGit.id, body)
      .then((response) => {
        const data = response?.data;
        if (data?.id) {
          this.setConfiguredState(data);
          callback(true);
        } else {
          const connectionMessage = data?.connection_message;
          this.setState({
            finalLoader: false,
            connectFail: true,
            errorMessage: connectionMessage,
          });
          callback(false);
        }
      })
      .catch((err) => {
        this.setState({
          finalLoader: false,
          connectFail: true,
          errorMessage: 'Please check Git SSH url and SSH key is properly deployed in git repo',
        });
        callback(false);
      });
  };

  onClickFinalize = () => {
    this.setState({
      finalLoader: true,
    });
    this.setFinalizeConfig(true, true, (state) => {
      if (state) {
        toast.success('Git sync has been successfully set up!');
      } else {
        toast.error('Set up could not be finalized. \n Please try again!');
      }
    });
  };

  copyKeyToClipboard = () => {
    const { sshKey, sshKeyGenerated } = this.state;
    if (sshKeyGenerated) {
      toast.success('SSH Key is copied to clipboard');
    } else {
      toast.error('SSH Key is not generated');
    }
  };

  validateGitUrl = (url) => {
    const regexPattern = /^git@[^/]+\/[^/]+\.git$/;
    return regexPattern.test(url);
  };

  urlChanged = (url) => {
    const { orgGit } = this.state;
    this.setState(
      {
        inputUrl: url,
        connectFail: false,
      },
      () => {
        if (this.state.sshKeyGenerated && this.state.orgGit?.git_url === this.state.inputUrl) {
          this.setState({
            editingMode: false,
            disableGenerateButtonStatus: true,
            gitUrl: url,
            finalizeBtnDisable: orgGit?.is_finalized,
            validUrl: true,
            urlInputMessage: 'Creating an empty git repository is recommended',
          });
        } else {
          this.setState({
            editingMode: true,
            disableGenerateButtonStatus: false,
            gitUrl: url,
            finalizeBtnDisable: true,
            urlInputMessage: 'Creating an empty git repository is recommended',
            validUrl: true,
            keyType: KEY_TYPE.ED25519,
          });
        }
      }
    );
  };

  convertSshtoHttps = (sshUrl) => {
    const httpsUrl = sshUrl.replace(/^git@([^:]+):/, 'https://$1/');
    return httpsUrl;
  };

  urlInputClicked = () => {
    if (!this.state.isFinalized) {
      this.setState({
        editingMode: true,
        finalizeBtnDisable: true,
        connectFail: false,
      });
    }
  };

  deleteConfig = () => {
    this.setState({
      deleteCofigLoader: true,
    });
    const { orgGit } = this.state;
    gitSyncService
      .deleteConfig(orgGit.id)
      .then(() => {
        toast.success('Configuration deleted Succesfully!');
        this.setState({ ...this.initialState });
      })
      .catch(() => {
        this.setState({
          deleteCofigLoader: false,
          showDeleteModal: false,
        });
        toast.error('Configuration could not be deleted. Please try again!');
      });
  };

  render() {
    const {
      darkMode,
      gitSyncToogle,
      disableGenerateButtonStatus,
      sshKey,
      finalizeBtnDisable,
      deleteButtonDisable,
      isFinalized,
      sshKeyGenerated,
      inputUrl,
      editingMode,
      lockUrlinput,
      generateKeyLoader,
      finalLoader,
      deleteCofigLoader,
      showDeleteModal,
      repoLink,
      toggleMessage,
      urlInputMessage,
      validUrl,
      connectFail,
      errorMessage,
      isGitSyncFeatureEnabled,
      autoCommit,
      keyType,
      isUpdatingKey,
      featureAccess,
    } = this.state;

    const isSwitchKeyDisable = isUpdatingKey || isFinalized || !isGitSyncFeatureEnabled;

    return (
      <div className="wrapper gitsync-config-wrapper animation-fade">
        <div className="page-wrapper">
          <ConfirmDialog
            show={showDeleteModal}
            message="Deleting this configuration will result in the permanent removal of all associated connections. This action cannot be undone. Are you sure you wish to proceed with the deletion?"
            title="Delete configuration"
            onCancel={this.setNotShowDeleteModal}
            cancelButtonType="tertiary"
            onConfirm={this.deleteConfig}
            confirmButtonText="Delete"
            onCloseIconClick={this.setNotShowDeleteModal}
            confirmButtonLoading={deleteCofigLoader}
            cancelButtonText="Cancel"
          />
          <div className="gitsync-config-page">
            <div className="gitsync-header">
              <div className="row">
                <div className="col-md-2 git-header-cont">
                  <div className="git-header-text" data-cy="git-header-text">
                    Configure git
                  </div>
                </div>
                <div className="col-md-2">
                  <LicenseBanner
                    classes="mb-3 small"
                    isAvailable={false}
                    showPaidFeatureBanner={
                      !isGitSyncFeatureEnabled || featureAccess?.licenseStatus?.licenseType === 'trial'
                    }
                    size="small"
                  />
                </div>
                <div className="col-md-4 blank-col"></div>
                <div className="col-md-1 git-toggle-container">
                  <Toggle
                    checked={gitSyncToogle}
                    onChange={this.setGitSync}
                    disabled={!isFinalized || !isGitSyncFeatureEnabled}
                    dataCy={'git-sync'}
                  />
                </div>
                <div className="col-md-3 git-toggle-label">
                  <div className={`main-text ${isGitSyncFeatureEnabled ? '' : 'disable-text'}`} data-cy="connect-label">
                    Connect
                  </div>
                  <div
                    className={`helper-text ${isGitSyncFeatureEnabled ? '' : 'disable-text'}`}
                    data-cy="toggle-message"
                  >
                    {toggleMessage}
                  </div>
                </div>
              </div>
            </div>
            <div className="gitconfig-body">
              <div className="row git-url-container">
                <div className="col-md-9 git-url-input">
                  <label
                    className={`label ${isGitSyncFeatureEnabled ? '' : 'disable-text'}`}
                    for="git-url-input"
                    data-cy="git-repo-url-label"
                  >
                    Git repo URL
                  </label>
                  <input
                    className={`${validUrl ? 'input' : 'input-alert'} ${isGitSyncFeatureEnabled ? '' : 'disable-text'}`}
                    type="text"
                    id="git-url-input"
                    placeholder="Enter Git SSH URL"
                    onChange={(e) => this.urlChanged(e.target.value)}
                    onClick={
                      isFinalized
                        ? () => {}
                        : () => {
                            this.urlInputClicked();
                          }
                    }
                    value={inputUrl}
                    readOnly={lockUrlinput | isFinalized | !isGitSyncFeatureEnabled}
                    data-cy="git-ssh-input"
                  />
                  <div
                    className={`${validUrl ? 'help-text ' : 'alert-text'} ${
                      isGitSyncFeatureEnabled ? '' : 'disable-text'
                    }`}
                    data-cy="git-ssh-input-helper-text"
                  >
                    {urlInputMessage}
                  </div>
                </div>
                <div className="col-md-3 generate-button-container">
                  <Button
                    className={`generate-button ${disableGenerateButtonStatus ? 'disabled' : ''}`}
                    disabled={disableGenerateButtonStatus | !isGitSyncFeatureEnabled}
                    onClick={this.generateSshKey}
                    loading={generateKeyLoader}
                    data-cy="generate-ssh-key-button"
                  >
                    Generate SSH key
                  </Button>
                </div>
              </div>
              {!editingMode && sshKeyGenerated && (
                <>
                  <div className="key-output-container">
                    <div className="ssh-key-row">
                      <label
                        className={` label ${isGitSyncFeatureEnabled ? '' : 'disable-text'} col-md-6`}
                        for="ssh-key-box"
                        data-cy="ssh-key-label"
                      >
                        SSH key
                      </label>
                      <div className="col-md-6 key-type-switches-container">
                        <input
                          type="radio"
                          id="switchMonthly"
                          name="switchPlan"
                          value="ed25519"
                          checked={keyType === KEY_TYPE.ED25519}
                          onClick={
                            keyType === KEY_TYPE.RSA &&
                            (() => {
                              this.setState(
                                {
                                  keyType: KEY_TYPE.ED25519,
                                },
                                this.updatingSshKey(KEY_TYPE.ED25519)
                              );
                            })
                          }
                          disabled={isSwitchKeyDisable}
                        />
                        <input
                          type="radio"
                          id="switchYearly"
                          name="switchPlan"
                          value="rsa"
                          checked={keyType === KEY_TYPE.RSA}
                          onClick={
                            keyType === KEY_TYPE.ED25519 &&
                            (() => {
                              this.setState(
                                {
                                  keyType: KEY_TYPE.RSA,
                                },
                                this.updatingSshKey(KEY_TYPE.RSA)
                              );
                            })
                          }
                          disabled={isSwitchKeyDisable}
                        />
                        <label className="label" for="switchMonthly">
                          ED25519
                        </label>
                        <label className="label" for="switchYearly">
                          RSA
                        </label>
                        <div className={`switch-wrapper `}>
                          <div className={`switch`}>
                            <div className={`div-switch ${isSwitchKeyDisable ? 'disable' : ''}`}>ED25519</div>
                            <div className={`div-switch ${isSwitchKeyDisable ? 'disable' : ''}`}>RSA</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="row key-box">
                      <div className={`col-md-11 key-display ${!isGitSyncFeatureEnabled ? 'disabled' : ''}`}>
                        {isUpdatingKey ? (
                          <div className="spinner-center">
                            <Spinner />
                          </div>
                        ) : (
                          <p data-cy="ssh-key">{sshKey}</p>
                        )}
                      </div>
                      <div className="col-md-1 copy-btn">
                        <CopyToClipboard onCopy={this.copyKeyToClipboard} text={sshKey}>
                          <ButtonSolid
                            variant="ghostBlack"
                            leftIcon="copy"
                            className="copy-btn"
                            disabled={!isGitSyncFeatureEnabled}
                            data-cy="copy-button"
                          />
                        </CopyToClipboard>
                      </div>
                    </div>
                    <div
                      className={`help-text ${isGitSyncFeatureEnabled ? '' : 'disable-text'}`}
                      data-cy="deploy-key-helper-text"
                    >
                      This is your repository’s deploy key
                    </div>
                  </div>
                  <div className="row open-git-container">
                    <div className="col-md-1 info-btn">
                      <SolidIcon name="informationcircle" fill="#3E63DD" />
                    </div>
                    <div className="col-md-11">
                      <div className="message" data-cy="warning-text">
                        While deploying the key, please ensure <b>write access permission</b> has been granted for the
                        connection to be successful
                      </div>
                      <a href={repoLink} target="_blank" rel="noopener noreferrer">
                        <div className="open-git-btn" data-cy="git-repo-link">
                          <SolidIcon name="open" className="open-icn" />
                          Open Git Repository
                        </div>
                      </a>
                    </div>
                  </div>
                  {isFinalized && (
                    <div className="row auto-commit-toggle-cont">
                      <div className="col-md-1">
                        <Toggle
                          checked={autoCommit}
                          onChange={this.setAutoCommit}
                          disabled={!isFinalized || !isGitSyncFeatureEnabled}
                          dataCy={'git-sync-auto-commit'}
                        />
                      </div>
                      <div className="col-md-11">
                        <div className="toggle-main-head">Auto-commit on promoting environment</div>
                        <div className="toggle-desc">
                          Application will automatically get pushed to the repository when promoting from development to
                          staging environment
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              {connectFail && <div className="alert-container">{errorMessage}</div>}
            </div>
            <div className="git-config-footer row">
              <div className="col-md-3 read-btn">
                <a
                  className="color-primary"
                  href={`https://docs.tooljet.com/docs/gitsync`}
                  target="_blank"
                  rel="noreferrer"
                  data-cy="link-read-documentation"
                >
                  <SolidIcon name="read" className="stud-icn" />
                  {this.props.t('globals.readDocumentation', 'Read documentation')}
                </a>
              </div>
              <div className="col-md-4"></div>
              <div className="col-md-3 delete-btn-cont">
                <ButtonSolid
                  variant="dangerSecondary"
                  className={`delete-btn ${deleteButtonDisable || !isGitSyncFeatureEnabled ? 'disabled' : ''}`}
                  disabled={deleteButtonDisable | !isGitSyncFeatureEnabled}
                  leftIcon="delete"
                  onClick={this.setShowDeleteModal}
                  data-cy="button-config-delete"
                  isLoading={deleteCofigLoader}
                >
                  {this.props.t('globals.delete', 'Delete')} {this.props.t('globals.configuration', 'configuration')}
                </ButtonSolid>
              </div>
              <div className="col-md-2 test-btn-cont">
                <ButtonSolid
                  disabled={finalizeBtnDisable | !isGitSyncFeatureEnabled}
                  onClick={this.onClickFinalize}
                  data-cy={`test-connection-button`}
                  variant="primary"
                  className={`test-btn ${finalizeBtnDisable ? 'disabled' : ''}`}
                  isLoading={finalLoader}
                >
                  Finalize setup
                </ButtonSolid>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export const GitSyncConfig = withTranslation()(GitSyncConfigComponent);
