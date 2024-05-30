import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import ModalBase from '@/_ui/Modal';
import { AppsSelect } from '@/_ui/Modal/AppsSelect';
import Multiselect from '@/_ui/Multiselect/Multiselect';
import React from 'react';
import { OverlayTrigger } from 'react-bootstrap';
import { withTranslation } from 'react-i18next';

class ManageGranularAccessComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isEmpty: true,
      showAddPermissionModal: false,
      errors: {},
      values: {},
      customSelected: true,
      selectedApps: [],
    };
  }

  openAddPermissionModal = () => this.setState({ showAddPermissionModal: true });

  clsoseAddPermissionModal = () => this.setState({ showAddPermissionModal: false });

  setSelectedApps = (values) => this.setState({ selectedApps: values });

  render() {
    const { isEmpty, showAddPermissionModal, errors, selectedApps } = this.state;
    const apps = [
      { name: 'App 1', value: 'App1', label: 'app 1' },
      { name: 'App Long name 1', value: 'App2', label: 'app long name 1' },
      { name: 'App very long name', value: 'App3', label: 'app very long name' },
      { name: 'App 4', value: 'App4', label: 'app 4' },
      { name: 'App5veryverylongname', value: 'App5veryverylongname', label: 'App5veryverylongname' },
      { name: 'App 6', value: 'App6', label: '6' },
      { name: 'App 7', value: 'App 7', label: 'app 7' },
      { name: 'App 8', value: 'App 8', label: 'app 8' },
      { name: 'App 9', value: 'App 9', label: 'app 9' },
      { name: 'App 10', value: 'App 10', label: 'app 10' },
      { name: 'App 11', value: 'App 11', label: 'app 11' },
      { name: 'App 12', value: 'App 12', label: 'app 12' },
    ];

    return (
      <div className="row granular-access-container justify-content-center">
        <ModalBase
          size="md"
          show={showAddPermissionModal}
          handleClose={this.clsoseAddPermissionModal}
          className="permission-manager-modal"
          title={
            <div className="my-3 permission-manager-title" data-cy="modal-title">
              <span className="font-weight-500">
                <SolidIcon name="apps" />
              </span>
              <div className="tj-text-md font-weight-500" data-cy="user-email">
                Add app permissions
              </div>
            </div>
          }
          confirmBtnProps={{ title: 'Add', iconLeft: 'plus' }}
          darkMode={this.props.darkMode}
        >
          <div className="form-group mb-3">
            <label className="form-label bold-text">Permission name</label>
            <div className="tj-app-input">
              <input
                type="text"
                className={'form-control'}
                placeholder={'Eg. Product analytics apps'}
                name="permissionName"
                value={''}
              />
              <span className="text-danger">{errors['permissionName']}</span>
            </div>
            <div className="mt-1 tj-text-xxsm">
              <div data-cy="workspace-login-help-text">Permission name must be unique and max 50 characters</div>
            </div>
          </div>
          <div className="form-group mb-3">
            <label className="form-label bold-text">Permission</label>
            <div className="type-container">
              <div className="left-container">
                <label className="form-check form-check-inline">
                  <input className="form-check-input" type="radio" />
                  <div>
                    <span className="form-check-label text-muted">Edit</span>
                    <span className="text-muted tj-text-xsm">Access to app builder</span>
                  </div>
                </label>
              </div>
              <div className="right-container">
                <label className="form-check form-check-inline">
                  <input className="form-check-input" type="radio" />
                  <div>
                    <span className="form-check-label text-muted">View</span>
                    <span className="text-muted tj-text-xsm">Only view deployed version of app</span>
                  </div>
                </label>
                <label className="form-check form-check-inline">
                  <input className={`form-check-input`} type="checkbox" />
                  <div>
                    <span className={`form-check-label faded-text`}>Hide from dashboard</span>
                    <span className="text-muted tj-text-xsm">App will be accessible by URL only</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
          <div className="form-group mb-3">
            <label className="form-label bold-text">Resources</label>
            <div className="resources-container">
              <label className="form-check form-check-inline">
                <input className="form-check-input" type="radio" />
                <div>
                  <span className="form-check-label text-muted">All apps</span>
                  <span className="text-muted tj-text-xsm">
                    This will select all apps in the workspace including any new apps created
                  </span>
                </div>
              </label>
              <label className="form-check form-check-inline">
                <input className="form-check-input" type="radio" />
                <div>
                  <span className="form-check-label text-muted">Custom</span>
                  <span className="text-muted tj-text-xsm">
                    Select specific applications you want to add to the group
                  </span>
                </div>
              </label>
              <AppsSelect allowSelectAll={true} value={selectedApps} onChange={this.setSelectedApps} options={apps} />
            </div>
          </div>
        </ModalBase>
        {isEmpty ? (
          <div className="empty-container">
            <div className="icon-container">
              <SolidIcon name="granularaccess" />
            </div>
            <p className="my-2 tj-text-md font-weight-500">No permissions added yet</p>
            <p className="tj-text-xsm mb-2">
              Add assets to configure granular, asset-level permissions for this user group
            </p>
            <OverlayTrigger
              //   onToggle={handleOverlayToggle}
              rootClose={true}
              trigger="click"
              placement={'bottom'}
              overlay={
                <div className={`settings-card tj-text card ${this.props.darkMode && 'dark-theme'}`}>
                  <ButtonSolid
                    variant="tertiary"
                    iconWidth="17"
                    fill="var(--slate9)"
                    className="apps-remove-btn permission-type remove-decoration tj-text-xsm font-weight-600"
                    leftIcon="dashboard"
                    onClick={() => {
                      this.openAddPermissionModal();
                    }}
                  >
                    Apps
                  </ButtonSolid>
                </div>
              }
            >
              <div className={'cursor-pointer'}>
                <ButtonSolid
                  variant="tertiary"
                  iconWidth="17"
                  fill="var(--slate9)"
                  className="apps-remove-btn remove-decoration tj-text-xsm font-weight-600 add-permission-btn"
                  leftIcon="plus"
                  onClick={() => {
                    // this.openChangeRoleModal(user);
                  }}
                >
                  Add permission
                </ButtonSolid>
              </div>
            </OverlayTrigger>
          </div>
        ) : (
          <div></div>
        )}
      </div>
    );
  }
}

export const ManageGranularAccess = withTranslation()(ManageGranularAccessComponent);
