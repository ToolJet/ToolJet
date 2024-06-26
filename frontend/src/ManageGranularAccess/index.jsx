import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import ModalBase from '@/_ui/Modal';
import { AppsSelect } from '@/_ui/Modal/AppsSelect';
import Multiselect from '@/_ui/Multiselect/Multiselect';
import React from 'react';
import { OverlayTrigger } from 'react-bootstrap';
import { withTranslation } from 'react-i18next';
import { groupPermissionV2Service } from '@/_services';
import { toast } from 'react-hot-toast';
import GroupChipTD from '@/ManageGroupPermissionsV2/ResourceChip';
import '../ManageGroupPermissionsV2/groupPermissions.theme.scss';
import ChangeRoleModal from '@/ManageGroupPermissionResourcesV2/ChangeRoleModal';
import AppResourcePermissions from '@/ManageGranularAccess/AppResourcePermission';
import AddResourcePermissionsMenu from '@/ManageGranularAccess/AddResourcePermissionsMenu';

class ManageGranularAccessComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      granularPermissions: [],
      showAddPermissionModal: false,
      errors: {},
      values: {},
      customSelected: true,
      selectedApps: [],
      type: null,
      newPermissionName: null,
      initialPermissionState: {
        canEdit: false,
        canView: false,
        hideFromDashboard: false,
      },
      currentEditingPermissions: null,
      isAll: true,
      isCustom: false,
      addableApps: [],
      modalType: 'add',
      modalTitle: 'Add app permissions',
      showAutoRoleChangeModal: false,
      autoRoleChangeModalMessage: '',
      autoRoleChangeModalList: [],
      autoRoleChangeMessageType: '',
      updateParam: {},
      updatingPermission: {},
      updateType: '',
    };
  }

  componentDidMount() {
    console.log('addable apps are');
    this.fetchAppsCanBeAdded();
    this.fetchGranularPermissions(this.props.groupPermissionId);
  }

  fetchAppsCanBeAdded = () => {
    groupPermissionV2Service
      .fetchAddableApps()
      .then((data) => {
        console.log('fetching app');
        console.log(data);
        const addableApps = data.map((app) => {
          return {
            name: app.name,
            value: app.id,
            label: app.name,
          };
        });
        console.log(addableApps);
        this.setState({
          addableApps,
        });
      })
      .catch((err) => {
        toast.error(err.error);
      });
  };

  fetchGranularPermissions = (groupPermissionId) => {
    this.setState({
      isLoading: true,
    });
    groupPermissionV2Service.fetchGranularPermissions(groupPermissionId).then((data) => {
      this.setState({
        granularPermissions: data,
        isLoading: false,
      });
    });
  };

  deleteGranularPermissions = () => {
    const { currentEditingPermissions } = this.state;
    groupPermissionV2Service
      .deleteGranularPermission(currentEditingPermissions.id)
      .then(() => {
        toast.success('Deleted permissions successfully');
        this.fetchGranularPermissions(this.props.groupPermissionId);
        this.closeAddPermissionModal();
      })
      .catch((err) => {
        toast.error(err.error);
      });
  };

  createGranularPermissions = () => {
    const { initialPermissionState, isAll, newPermissionName, isCustom, selectedApps } = this.state;
    if (isCustom && selectedApps.length == 0) {
      toast.error('Please select the apps');
      return;
    }
    const body = {
      name: newPermissionName,
      type: 'app',
      groupId: this.props.groupPermissionId,
      isAll: isAll,
      createAppsPermissionsObject: {
        ...initialPermissionState,
        resourcesToAdd: selectedApps.map((option) => ({ appId: option.value })),
      },
    };
    groupPermissionV2Service
      .createGranularPermission(body)
      .then(() => {
        this.fetchGranularPermissions(this.props.groupPermissionId);
        this.closeAddPermissionModal();
      })
      .catch(({ error }) => {
        this.closeAddPermissionModal();
        this.props.updateParentState({
          showEditRoleErrorModal: true,
          errorTitle: error?.title ? error?.title : 'Cannot remove last admin',
          errorMessage: error.error,
          errorIconName: 'usergear',
          errorListItems: error.data,
        });
      });
    // .then(())
  };

  openEditPermissionModal = (granularPermission) => {
    console.log('logging granular permissions');
    console.log(granularPermission);
    const currentApps = granularPermission?.appsGroupPermissions?.groupApps;
    const appsGroupPermission = granularPermission?.appsGroupPermissions;
    this.setState({
      currentEditingPermissions: granularPermission,
      modalTitle: 'Edit app permissions',
      showAddPermissionModal: true,
      modalType: 'edit',
      isAll: granularPermission.isAll,
      isCustom: currentApps?.length > 0,
      newPermissionName: granularPermission.name,
      initialPermissionState: {
        canEdit: appsGroupPermission.canEdit,
        canView: appsGroupPermission.canView,
        hideFromDashboard: appsGroupPermission.hideFromDashboard,
      },

      selectedApps:
        currentApps?.length > 0
          ? currentApps?.map(({ app }) => {
              return {
                name: app.name,
                value: app.id,
                label: app.name,
              };
            })
          : [],
    });
    console.log('Logging granular permissions');
    console.log(granularPermission);
  };

  updateOnlyGranularPermissions = (permission, actions = {}, allowRoleChange) => {
    console.log(actions);
    const body = {
      actions: actions,
      allowRoleChange,
    };
    groupPermissionV2Service
      .updateGranularPermission(permission.id, body)
      .then(() => {
        this.fetchGranularPermissions(this.props.groupPermissionId);
        this.closeAddPermissionModal();
        toast.success('Permission updated successfully');
      })
      .catch(({ error }) => {
        console.log('error is');
        console.log(error);
        if (error?.type) {
          this.setState({
            showAutoRoleChangeModal: true,
            autoRoleChangeModalMessage: error?.error,
            autoRoleChangeModalList: error?.data,
            autoRoleChangeMessageType: error?.type,
            updateParam: actions,
            updatingPermission: permission,
            updateType: 'ONLY_PERMISSIONS',
          });
          return;
        }
        this.props.updateParentState({
          showEditRoleErrorModal: true,
          errorTitle: error?.title ? error?.title : 'Cannot remove last admin',
          errorMessage: error.error,
          errorIconName: 'usergear',
          errorListItems: error.data,
        });
      });
  };

  updateGranularPermissions = (allowRoleChange) => {
    const { currentEditingPermissions, selectedApps, newPermissionName, isAll, initialPermissionState } = this.state;
    const currentResource = currentEditingPermissions?.appsGroupPermissions?.groupApps?.map((app) => {
      return app.app.id;
    });
    const selectedResource = selectedApps?.map((resource) => resource.value);
    const resourcesToAdd = selectedResource
      ?.filter((item) => !currentResource.includes(item))
      .map((id) => {
        return {
          appId: id,
        };
      });
    const appsToDelete = currentResource?.filter((item) => !selectedResource?.includes(item));
    const groupAppsToDelete = currentEditingPermissions?.appsGroupPermissions?.groupApps?.filter((groupApp) =>
      appsToDelete?.includes(groupApp.appId)
    );
    console.log('logging groups apps to delete');
    console.log(groupAppsToDelete);
    const resourcesToDelete = groupAppsToDelete?.map(({ id }) => {
      return {
        id: id,
      };
    });
    const body = {
      name: newPermissionName,
      isAll: isAll,
      actions: initialPermissionState,
      resourcesToAdd,
      resourcesToDelete,
      allowRoleChange,
    };

    console.log(body);

    groupPermissionV2Service
      .updateGranularPermission(currentEditingPermissions.id, body)
      .then(() => {
        this.fetchGranularPermissions(this.props.groupPermissionId);
        this.closeAddPermissionModal();
        toast.success('Permission updated successfully');
      })
      .catch(({ error }) => {
        if (error?.type) {
          this.setState({
            showAutoRoleChangeModal: true,
            autoRoleChangeModalMessage: error?.error,
            autoRoleChangeModalList: error?.data,
            autoRoleChangeMessageType: error?.type,
            updateType: '',
            showAddPermissionModal: false,
          });
          return;
        }
        toast.error(error.error);
        this.closeAddPermissionModal();
      });
  };
  showPermissionText = (groupPermission) => {
    const text =
      groupPermission.name === 'admin'
        ? 'Admin has edit access to all apps. These are not editable'
        : 'End-user can only have permission to view apps';
    return (
      <div className="manage-granular-permissions-info">
        <p
          className="tj-text-xsm"
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          data-cy="helper-text-admin-app-access"
        >
          <SolidIcon name="information" fill="#3E63DD" /> {text}
          <a style={{ margin: '0', padding: '0', textDecoration: 'none', color: '#3E63DD' }}>Read Documentation</a> to
          know more
        </p>
      </div>
    );
  };

  openAddPermissionModal = () => {
    const currentGroupPermission = this.props?.groupPermission;
    const isEndUser = currentGroupPermission?.name === 'end-user';
    this.setState((prevState) => ({
      showAddPermissionModal: true,
      ...(isEndUser && { initialPermissionState: { ...prevState.initialPermissionState, canView: true } }),
    }));
  };

  closeAddPermissionModal = () => {
    this.setState({
      currentEditingPermissions: null,
      modalTitle: 'Add app permissions',
      showAddPermissionModal: false,
      modalType: 'add',
      isAll: false,
      isCustom: false,
      newPermissionName: '',
      initialPermissionState: {
        canEdit: false,
        canView: false,
        hideFromDashboard: false,
      },
      selectedApps: [],
      // selectedApps:currentApps?.length > 0 ? currentApps?.map(({app})=>{
      //   return {
      //     name:app.name,
      //     value:app.id,
      //   }
      // }) : []
    });
  };

  setSelectedApps = (values) => {
    console.log('Logging selected values');
    console.log(values);
    this.setState({ selectedApps: values });
  };

  handleAutoRoleChangeModalClose = () => {
    this.setState({
      showAutoRoleChangeModal: false,
      autoRoleChangeModalMessage: '',
      autoRoleChangeModalList: [],
      autoRoleChangeMessageType: '',
      updateParam: {},
      isLoading: false,
      updatingPermission: {},
      updateType: '',
    });
  };
  handleConfirmAutoRoleChangeGroupUpdate = () => {
    console.log('this is running');
    this.updateGranularPermissions(true);
    this.handleAutoRoleChangeModalClose();
  };

  handleConfirmAutoRoleChangeOnlyGroupUpdate = () => {
    const { updateParam, updatingPermission } = this.state;
    this.updateOnlyGranularPermissions(updatingPermission, updateParam, true);
    this.handleAutoRoleChangeModalClose();
  };

  render() {
    const {
      isEmpty,
      showAddPermissionModal,
      errors,
      selectedApps,
      initialPermissionState,
      isAll,
      isCustom,
      granularPermissions,
      isLoading,
      addableApps,
      modalTitle,
      modalType,
      newPermissionName,
      showAutoRoleChangeModal,
      autoRoleChangeModalMessage,
      autoRoleChangeModalList,
      autoRoleChangeMessageType,
      updateParam,
      updatingPermission,
      updateType,
    } = this.state;

    const resourcesOptions = ['Apps'];
    const currentGroupPermission = this.props?.groupPermission;
    const isEndUserGroup = currentGroupPermission?.name == 'end-user';
    const isRoleGroup = currentGroupPermission.name == 'admin';
    const showPermissionInfo = currentGroupPermission.name == 'admin' || currentGroupPermission.name == 'end-user';
    const disableEditUpdate = currentGroupPermission.name == 'end-user';
    return (
      <div className="row granular-access-container justify-content-center">
        <ChangeRoleModal
          showAutoRoleChangeModal={showAutoRoleChangeModal}
          autoRoleChangeModalList={autoRoleChangeModalList}
          autoRoleChangeMessageType={autoRoleChangeMessageType}
          handleAutoRoleChangeModalClose={this.handleAutoRoleChangeModalClose}
          handleConfirmation={
            updateType === 'ONLY_PERMISSIONS'
              ? this.handleConfirmAutoRoleChangeOnlyGroupUpdate
              : this.handleConfirmAutoRoleChangeGroupUpdate
          }
          darkMode={this.props.darkMode}
          isLoading={isLoading}
        />
        <ModalBase
          size="md"
          show={showAddPermissionModal}
          handleClose={this.closeAddPermissionModal}
          handleConfirm={
            modalType === 'add'
              ? this.createGranularPermissions
              : () => {
                  this.updateGranularPermissions();
                }
          }
          className="permission-manager-modal"
          title={
            <div className="my-3 permission-manager-title" data-cy="modal-title">
              <span className="font-weight-500">
                <SolidIcon name="apps" />
              </span>
              <div className="tj-text-md font-weight-500" data-cy="user-email">
                {modalTitle}
              </div>
              {modalType === 'edit' && !isRoleGroup && (
                <div className="delete-icon-cont">
                  <ButtonSolid
                    leftIcon="delete"
                    iconWidth="15px"
                    className="icon-class"
                    variant="tertiary"
                    onClick={this.deleteGranularPermissions}
                  />
                </div>
              )}
            </div>
          }
          confirmBtnProps={{
            title: `${modalType === 'edit' ? 'Update' : 'Add'}`,
            iconLeft: 'plus',
            disabled: modalType === 'add' && !newPermissionName,
          }}
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
                value={newPermissionName}
                onChange={(e) => {
                  this.setState({
                    newPermissionName: e.target.value,
                  });
                }}
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
                  <input
                    className="form-check-input"
                    type="radio"
                    disabled={disableEditUpdate}
                    checked={initialPermissionState.canEdit}
                    onClick={() => {
                      this.setState((prevState) => ({
                        initialPermissionState: {
                          ...prevState.initialPermissionState,
                          canEdit: !prevState.initialPermissionState.canEdit,
                          ...(!prevState.initialPermissionState.canEdit && { canView: false }),
                        },
                      }));
                    }}
                  />

                  <div>
                    <span className="form-check-label text-muted">Edit</span>
                    <span className="text-muted tj-text-xsm">Access to app builder</span>
                  </div>
                </label>
              </div>
              <div className="right-container">
                <label className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="radio"
                    disabled={disableEditUpdate}
                    checked={initialPermissionState.canView}
                    onClick={() => {
                      this.setState((prevState) => ({
                        initialPermissionState: {
                          ...prevState.initialPermissionState,
                          canView: !prevState.initialPermissionState.canView,
                          ...(!prevState.initialPermissionState.canView && { canEdit: false }),
                        },
                      }));
                    }}
                  />
                  <div>
                    <span className="form-check-label text-muted">View</span>
                    <span className="text-muted tj-text-xsm">Only view deployed version of app</span>
                  </div>
                </label>
                <label className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="radio"
                    checked={initialPermissionState.hideFromDashboard}
                    onClick={() => {
                      this.setState((prevState) => ({
                        initialPermissionState: {
                          ...initialPermissionState,
                          hideFromDashboard: !prevState.initialPermissionState.hideFromDashboard,
                        },
                      }));
                    }}
                  />
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
                <input
                  className="form-check-input"
                  type="radio"
                  checked={isAll}
                  onClick={() => {
                    this.setState((prevState) => ({ isAll: !prevState.isAll, isCustom: false }));
                  }}
                />
                <div>
                  <span className="form-check-label text-muted">All apps</span>
                  <span className="text-muted tj-text-xsm">
                    This will select all apps in the workspace including any new apps created
                  </span>
                </div>
              </label>
              <label className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="radio"
                  checked={isCustom}
                  onClick={() => {
                    this.setState((prevState) => ({ isCustom: !prevState.isCustom, isAll: false }));
                  }}
                />
                <div>
                  <span className="form-check-label text-muted">Custom</span>
                  <span className="text-muted tj-text-xsm">
                    Select specific applications you want to add to the group
                  </span>
                </div>
              </label>
              <AppsSelect
                disabled={!isCustom}
                allowSelectAll={true}
                value={selectedApps}
                onChange={this.setSelectedApps}
                options={addableApps}
              />
            </div>
          </div>
        </ModalBase>
        {!granularPermissions.length ? (
          <div className="empty-container">
            <div className="icon-container">
              <SolidIcon name="granularaccess" />
            </div>
            <p className="my-2 tj-text-md font-weight-500">No permissions added yet</p>
            <p className="tj-text-xsm mb-2">
              Add assets to configure granular, asset-level permissions for this user group
            </p>
            <AddResourcePermissionsMenu
              openAddPermissionModal={this.openAddPermissionModal}
              resourcesOptions={resourcesOptions}
              currentGroupPermission={currentGroupPermission}
            />
          </div>
        ) : (
          <>
            {showPermissionInfo && this.showPermissionText(currentGroupPermission)}
            <div className="manage-granular-permission-header">
              <p data-cy="resource-header" className="tj-text-xsm">
                {'Name'}
              </p>
              <p data-cy="permissions-header" className="tj-text-xsm">
                {this.props.t('header.organization.menus.manageGroups.permissionResources.permissions', 'Permissions')}
              </p>
              <p data-cy="permissions-header" className="tj-text-xsm">
                {'Resources'}
              </p>
            </div>
            <div className={showPermissionInfo ? 'permission-body-one' : 'permission-body-two'}>
              {isLoading ? (
                <tr>
                  <td className="col-auto">
                    <div className="row">
                      <div className="skeleton-line w-10 col mx-3"></div>
                    </div>
                  </td>
                  <td className="col-auto">
                    <div className="skeleton-line w-10"></div>
                  </td>
                  <td className="col-auto">
                    <div className="skeleton-line w-10"></div>
                  </td>
                </tr>
              ) : (
                <>
                  {granularPermissions.map((permissions, index) => (
                    <AppResourcePermissions
                      updateOnlyGranularPermissions={this.updateOnlyGranularPermissions}
                      permissions={permissions}
                      currentGroupPermission={currentGroupPermission}
                      key={index}
                      openEditPermissionModal={this.openEditPermissionModal}
                    />
                  ))}
                </>
              )}
            </div>
            <div className="side-button-cont">
              <AddResourcePermissionsMenu
                openAddPermissionModal={this.openAddPermissionModal}
                resourcesOptions={resourcesOptions}
                currentGroupPermission={currentGroupPermission}
              />
            </div>
          </>
        )}
      </div>
    );
  }
}

export const ManageGranularAccess = withTranslation()(ManageGranularAccessComponent);
