import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import React from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { withTranslation } from 'react-i18next';
import { groupPermissionV2Service } from '@/_services';
import { toast } from 'react-hot-toast';
import '../ManageGroupPermissionsV2/groupPermissions.theme.scss';
import ChangeRoleModal from '@/ManageGroupPermissionResourcesV2/ChangeRoleModal';
import AppResourcePermissions from '@/ManageGranularAccess/AppResourcePermission';
import AddResourcePermissionsMenu from '@/ManageGranularAccess/AddResourcePermissionsMenu';
import { ConfirmDialog } from '@/_components';
import AddEditResourcePermissionsModal from '@/ManageGranularAccess/AddEditResourceModal/AddEditResourcePermissionsModal';
import Spinner from 'react-bootstrap/Spinner';

import { ToolTip } from '@/_components/ToolTip';
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
      deleteConfirmationModal: false,
      deletingPermissions: false,
    };
  }

  componentDidMount() {
    this.fetchAppsCanBeAdded();
    this.fetchGranularPermissions(this.props.groupPermissionId);
  }

  fetchAppsCanBeAdded = () => {
    groupPermissionV2Service
      .fetchAddableApps()
      .then((data) => {
        const addableApps = data.map((app) => {
          return {
            name: app.name,
            value: app.id,
            label: app.name,
          };
        });
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
    this.setState({
      deleteGranularPermissions: true,
    });
    groupPermissionV2Service
      .deleteGranularPermission(currentEditingPermissions.id)
      .then(() => {
        toast.success('Deleted permission successfully');
        this.fetchGranularPermissions(this.props.groupPermissionId);
        this.closeAddPermissionModal();
      })
      .catch((err) => {
        toast.error(err.error);
      })
      .finally(() => {
        this.setState({
          deleteConfirmationModal: false,
          deleteGranularPermissions: false,
        });
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
        resourcesToAdd: selectedApps.filter((apps) => !apps?.isAllField)?.map((option) => ({ appId: option.value })),
      },
    };
    groupPermissionV2Service
      .createGranularPermission(body)
      .then(() => {
        this.fetchGranularPermissions(this.props.groupPermissionId);
        this.closeAddPermissionModal();
        toast.success('Permission created successfully!');
      })
      .catch(({ error }) => {
        this.closeAddPermissionModal();
        if (error?.error) {
          this.props.updateParentState({
            showEditRoleErrorModal: true,
            errorTitle: error?.title ? error?.title : 'Cannot add granular permissions',
            errorMessage: error.error,
            errorIconName: 'usergear',
            errorListItems: error.data,
          });
          return;
        }
        toast.error(error, {
          style: {
            maxWidth: '500px',
          },
        });
      });
    // .then(())
  };

  openEditPermissionModal = (granularPermission) => {
    const currentApps = granularPermission?.appsGroupPermissions?.groupApps;
    const appsGroupPermission = granularPermission?.appsGroupPermissions;
    this.setState({
      currentEditingPermissions: granularPermission,
      modalTitle: 'Edit app permissions',
      showAddPermissionModal: true,
      modalType: 'edit',
      isAll: !!granularPermission.isAll,
      isCustom: !granularPermission.isAll,
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
  };

  updateOnlyGranularPermissions = (permission, actions = {}, allowRoleChange) => {
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
          errorTitle: error?.title ? error?.title : 'Cannot update the permissions',
          errorMessage: error.error,
          errorIconName: 'usergear',
          errorListItems: error.data,
          showAddPermissionModal: false,
        });
      });
  };

  updateGranularPermissions = (allowRoleChange) => {
    const { currentEditingPermissions, selectedApps, newPermissionName, isAll, initialPermissionState } = this.state;
    const currentResource = currentEditingPermissions?.appsGroupPermissions?.groupApps?.map((app) => {
      return app.app.id;
    });
    const selectedResource = selectedApps.filter((apps) => !apps?.isAllField)?.map((resource) => resource.value);
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
            showEditRoleErrorModal: false,
            showAutoRoleChangeModal: true,
            autoRoleChangeModalMessage: error?.error,
            autoRoleChangeModalList: error?.data,
            autoRoleChangeMessageType: error?.type,
            updateType: '',
            showAddPermissionModal: false,
          });
          return;
        }
        toast.error(error, {
          style: {
            maxWidth: '500px',
          },
        });
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
          <SolidIcon name="informationcircle" fill="#3E63DD" /> {text}
          <a
            style={{ margin: '0', padding: '0', textDecoration: 'underline', color: '#3E63DD' }}
            href="https://docs.tooljet.com/docs/tutorial/manage-users-groups/"
            target="_blank"
            rel="noopener noreferrer"
          >
            read documentation
          </a>{' '}
          to know more !
        </p>
      </div>
    );
  };

  openAddPermissionModal = () => {
    this.setState((prevState) => ({
      showAddPermissionModal: true,
      initialPermissionState: { ...prevState.initialPermissionState, canView: true },
      isAll: true,
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
    });
  };

  setSelectedApps = (values) => {
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
    this.updateGranularPermissions(true);
    this.handleAutoRoleChangeModalClose();
  };

  updateState = (stateUpdater) => {
    this.setState((prevState) => stateUpdater(prevState));
  };

  handleConfirmAutoRoleChangeOnlyGroupUpdate = () => {
    const { updateParam, updatingPermission } = this.state;
    this.updateOnlyGranularPermissions(updatingPermission, updateParam, true);
    this.handleAutoRoleChangeModalClose();
  };

  render() {
    const {
      showAddPermissionModal,
      selectedApps,
      isCustom,
      granularPermissions,
      isLoading,
      addableApps,
      modalTitle,
      modalType,
      newPermissionName,
      showAutoRoleChangeModal,
      autoRoleChangeModalList,
      autoRoleChangeMessageType,
      updateType,
      deleteConfirmationModal,
      deletingPermissions,
    } = this.state;

    const resourcesOptions = ['Apps'];
    const currentGroupPermission = this.props?.groupPermission;
    const isRoleGroup = currentGroupPermission.name == 'admin';
    const defaultGroup = currentGroupPermission.type === 'default';
    const showPermissionInfo = currentGroupPermission.name == 'admin' || currentGroupPermission.name == 'end-user';
    const disableEditUpdate = currentGroupPermission.name == 'end-user';
    const addPermissionTooltipMessage = !newPermissionName
      ? 'Please input permissions name'
      : isCustom && selectedApps.length === 0
      ? 'Please select apps or select all apps option'
      : '';
    return (
      <div>
        <ConfirmDialog
          show={deleteConfirmationModal}
          message={'This permission will be permanently deleted. Do you want to continue?'}
          confirmButtonLoading={deletingPermissions}
          onConfirm={() => this.deleteGranularPermissions()}
          onCancel={() => {
            this.setState({ deleteConfirmationModal: false, deletingPermissions: false });
          }}
          darkMode={this.props.darkMode}
        />
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
        <AddEditResourcePermissionsModal
          handleClose={this.closeAddPermissionModal}
          handleConfirm={
            modalType === 'add'
              ? this.createGranularPermissions
              : () => {
                  this.updateGranularPermissions();
                }
          }
          updateParentState={this.updateState}
          resourceType="app"
          currentState={this.state}
          show={showAddPermissionModal}
          title={
            <div className="my-3 permission-manager-title" data-cy="modal-title">
              <span className="font-weight-500">
                <SolidIcon name="apps" />
              </span>
              <div className="tj-text-md font-weight-500" data-cy="modal-title">
                {modalTitle}
              </div>
              {modalType === 'edit' && !isRoleGroup && (
                <div className="delete-icon-cont">
                  <ButtonSolid
                    leftIcon="delete"
                    iconWidth="15px"
                    className="icon-class"
                    variant="tertiary"
                    onClick={() => {
                      this.setState({
                        deleteConfirmationModal: true,
                        showAddPermissionModal: false,
                      });
                    }}
                    data-cy="delete-button"
                  />
                </div>
              )}
            </div>
          }
          confirmBtnProps={{
            title: `${modalType === 'edit' ? 'Update' : 'Add'}`,
            iconLeft: 'plus',
            disabled: (modalType === 'add' && !newPermissionName) || (isCustom && selectedApps.length === 0),
            tooltipMessage: addPermissionTooltipMessage,
          }}
          disableBuilderLevelUpdate={disableEditUpdate}
          selectedApps={selectedApps}
          setSelectedApps={this.setSelectedApps}
          addableApps={addableApps}
          darkMode={this.props.darkMode}
          groupName={currentGroupPermission.name}
        />
        {!granularPermissions.length && !isLoading ? (
          <div className="empty-container">
            <div className="icon-container" data-cy="empty-page-svg">
              <SolidIcon name="granularaccess" />
            </div>
            <p className="my-2 tj-text-md font-weight-500" data-cy="empty-page-title">
              No permissions added yet
            </p>
            <p className="tj-text-xsm mb-2" data-cy="empty-page-info-text">
              Add assets to configure granular, asset-level permissions for this user group
            </p>
            <div className="menu">
              <AddResourcePermissionsMenu
                openAddPermissionModal={this.openAddPermissionModal}
                resourcesOptions={resourcesOptions}
                currentGroupPermission={currentGroupPermission}
              />
            </div>
          </div>
        ) : (
          <>
            {showPermissionInfo && this.showPermissionText(currentGroupPermission)}
            <div className="manage-granular-permission-header">
              <p data-cy="name-header" className="tj-text-xsm">
                {'Name'}
              </p>
              <p data-cy="permissions-header" className="tj-text-xsm">
                {'Permission'}
              </p>
              <p data-cy="resource-header" className="tj-text-xsm">
                {'Resource'}
              </p>
            </div>
            <div className={showPermissionInfo ? 'permission-body-one' : 'permission-body-two'}>
              {isLoading ? (
                <div
                  className="d-flex justify-content-center align-items-center"
                  style={{ height: 'calc(100vh - 470px)' }}
                >
                  <Spinner variant="primary" />
                </div>
              ) : (
                <>
                  {granularPermissions.map((permissions, index) => (
                    <AppResourcePermissions
                      updateOnlyGranularPermissions={this.updateOnlyGranularPermissions}
                      permissions={permissions}
                      currentGroupPermission={currentGroupPermission}
                      openEditPermissionModal={this.openEditPermissionModal}
                      key={index}
                    />
                  ))}
                </>
              )}
            </div>
          </>
        )}
        {granularPermissions.length > 0 && (
          <div className="side-button-cont">
            <AddResourcePermissionsMenu
              openAddPermissionModal={this.openAddPermissionModal}
              resourcesOptions={resourcesOptions}
              currentGroupPermission={currentGroupPermission}
            />
          </div>
        )}
      </div>
    );
  }
}

export const ManageGranularAccess = withTranslation()(ManageGranularAccessComponent);
