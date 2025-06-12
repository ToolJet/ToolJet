import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { groupPermissionV2Service } from '@/_services';
import { toast } from 'react-hot-toast';
import '../../resources/styles/group-permissions.styles.scss';
import ChangeRoleModal from '../ChangeRoleModal';
import AppResourcePermissions from './components/AppResourcePermission';
import AddResourcePermissionsMenu from './components/AddResourcePermissionsMenu';
import { ConfirmDialog } from '@/_components';
import AddEditResourcePermissionsModal from './components/AddEditResourceModal/AddEditResourcePermissionsModal';
import DataSourceResourcePermissions from './components/DataSourceResourcePermission';
import Spinner from 'react-bootstrap/Spinner';

class BaseManageGranularAccess extends React.Component {
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

      initialPermissionStateDs: {
        canUse: false,
        canView: false,
      },
      selectedDs: [],
      resourceType: '',
      hasChanges: false,
      initialState: {
        type: 'app',
        initialPermissionState: {
          canEdit: false,
          canView: false,
          hideFromDashboard: false,
        },
        initialPermissionStateDs: {
          canUse: false,
          canConfigure: false,
        },
        selectedDs: [],
        selectedApps: [],
        isAll: true,
        newPermissionName: null,
      },
    };
  }

  componentDidMount() {
    this.fetchAppsCanBeAdded();
    this.fetchGranularPermissions(this.props.groupPermissionId);
  }

  fetchAppsCanBeAdded = () => {
    if (this.props.isBasicPlan) {
      return;
    }
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
      .deleteGranularPermission(currentEditingPermissions)
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
    const {
      initialPermissionState,
      initialPermissionStateDs,
      isAll,
      newPermissionName,
      isCustom,
      selectedApps,
      selectedDs,
      resourceType,
    } = this.state;
    const type = resourceType === 'Apps' ? 'app' : 'data_source';
    const selectedResource = type == 'app' ? selectedApps : selectedDs;
    if (isCustom && selectedResource.length == 0) {
      toast.error('Please select the resources to continue');
      return;
    }
    const resourcesToAdd = selectedResource
      .filter((res) => !res?.isAllField)
      .map((option) => {
        if (type === 'app') {
          return {
            appId: option.value,
          };
        } else {
          return {
            dataSourceId: option.value,
          };
        }
      });
    const body = {
      name: newPermissionName,
      type,
      groupId: this.props.groupPermissionId,
      isAll: isAll,
      createResourcePermissionObject: {
        ...(type == 'app' && initialPermissionState),
        ...(type == 'data_source' && { action: initialPermissionStateDs }),
        resourcesToAdd: resourcesToAdd,
      },
    };
    groupPermissionV2Service
      .createGranularPermission(this.props.groupPermissionId, body)
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
    const fixedState = {
      currentEditingPermissions: granularPermission,
      showAddPermissionModal: true,
      modalType: 'edit',
      isAll: !!granularPermission.isAll,
      isCustom: !granularPermission.isAll,
      newPermissionName: granularPermission.name,
      hasChanges: false,
    };
    if (granularPermission.type === 'data_source') {
      const currentDs = granularPermission?.dataSourcesGroupPermission?.groupDataSources;
      const dataSourcesGroupPermission = granularPermission?.dataSourcesGroupPermission;
      this.setState({
        ...fixedState,
        modalTitle: `Edit data source permissions`,
        initialPermissionStateDs: {
          canUse: dataSourcesGroupPermission?.canUse,
          canConfigure: dataSourcesGroupPermission?.canConfigure,
        },
        resourceType: 'Data sources',
        selectedDs:
          currentDs?.length > 0
            ? currentDs?.map(({ dataSource }) => {
                return {
                  name: dataSource.name,
                  value: dataSource.id,
                  label: dataSource.name,
                };
              })
            : [],
        initialState: {
          type: 'data_source',
          initialPermissionStateDs: {
            canUse: dataSourcesGroupPermission?.canUse,
            canConfigure: dataSourcesGroupPermission?.canConfigure,
          },
          isAll: !!granularPermission.isAll,
          newPermissionName: granularPermission?.name,
          selectedDs:
            currentDs?.length > 0
              ? currentDs?.map(({ dataSource }) => {
                  return {
                    name: dataSource.name,
                    value: dataSource.id,
                    label: dataSource.name,
                  };
                })
              : [],
        },
      });
    } else if (granularPermission.type === 'app') {
      const currentApps = granularPermission?.appsGroupPermissions?.groupApps;
      const appsGroupPermission = granularPermission?.appsGroupPermissions;
      this.setState({
        ...fixedState,
        modalTitle: `Edit app permissions`,
        resourceType: 'Apps',
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
        initialState: {
          type: 'app',
          initialPermissionState: {
            canEdit: appsGroupPermission?.canEdit,
            canView: appsGroupPermission?.canView,
            hideFromDashboard: appsGroupPermission?.hideFromDashboard,
          },
          isAll: !!granularPermission.isAll,
          newPermissionName: granularPermission?.name,
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
        },
      });
    }
  };

  updateOnlyGranularPermissions = (permission, actions = {}, allowRoleChange) => {
    const body = {
      actions: actions,
      allowRoleChange,
    };
    groupPermissionV2Service
      .updateGranularPermission(permission, body)
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
    const {
      currentEditingPermissions,
      selectedApps,
      selectedDs,
      newPermissionName,
      isAll,
      initialPermissionState,
      initialPermissionStateDs,
    } = this.state;
    const type = currentEditingPermissions.type;
    const currentResource =
      type === 'app'
        ? currentEditingPermissions?.appsGroupPermissions?.groupApps?.map((app) => {
            return app.app.id;
          })
        : currentEditingPermissions?.dataSourcesGroupPermission?.groupDataSources?.map((ds) => {
            return ds.dataSource.id;
          });
    const selectedResourceEnitities = type === 'app' ? selectedApps : selectedDs;
    const selectedResource = selectedResourceEnitities
      .filter((res) => !res?.isAllField)
      ?.map((resource) => resource.value);
    const resourcesToAdd = selectedResource
      ?.filter((item) => !currentResource.includes(item))
      .map((id) => {
        if (type === 'app')
          return {
            appId: id,
          };
        else {
          return {
            dataSourceId: id,
          };
        }
      });
    const resourceItemsToDelete = currentResource?.filter((item) => !selectedResource?.includes(item));
    const groupResToDelete =
      type === 'app'
        ? currentEditingPermissions?.appsGroupPermissions?.groupApps?.filter((groupApp) =>
            resourceItemsToDelete?.includes(groupApp.appId)
          )
        : currentEditingPermissions?.dataSourcesGroupPermission?.groupDataSources?.filter((groupDs) =>
            resourceItemsToDelete?.includes(groupDs.dataSourceId)
          );
    const resourcesToDelete = groupResToDelete?.map(({ id }) => {
      return {
        id,
      };
    });
    const body = {
      name: newPermissionName,
      isAll: isAll,
      actions: type === 'app' ? initialPermissionState : initialPermissionStateDs,
      resourcesToAdd,
      resourcesToDelete,
      allowRoleChange,
    };

    groupPermissionV2Service
      .updateGranularPermission(currentEditingPermissions, body)
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
            hasChanges: false,
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
        ? 'Admin has all permissions. This is not editable'
        : 'End-user can only have permission to view apps';
    return (
      <div className="manage-granular-permissions-info">
        <p
          className="tj-text-xsm"
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          data-cy="helper-text-admin-app-access"
        >
          <SolidIcon name="informationcircle" fill="var(--slate8)" /> {text}
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

  openAddPermissionModal = (resourceType) => {
    this.setState((prevState) => ({
      modalTitle: `Add ${resourceType?.toLowerCase()} permissions`,
      resourceType,
      showAddPermissionModal: true,
      initialPermissionState: { ...prevState.initialPermissionState, canView: true },
      initialPermissionStateDs: { ...prevState.initialPermissionStateDs, canUse: true },
      isAll: true,
    }));
  };

  closeAddPermissionModal = () => {
    this.setState({
      currentEditingPermissions: null,
      modalTitle: 'Add apps permissions',
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
      initialPermissionStateDs: {
        canUse: false,
        canConfigure: false,
      },
      selectedDs: [],
      selectedApps: [],
      resourceType: '',
      hasChanges: false,
    });
  };

  setSelectedApps = (values) => {
    this.setState({ selectedApps: values }, () => {
      const hasChanges = this.hasStateChanged(this.state);
      this.setState({ hasChanges });
    });
  };

  setSelectedDs = (values) => {
    this.setState({ selectedDs: values }, () => {
      const hasChanges = this.hasStateChanged(this.state);
      this.setState({ hasChanges });
    });
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

  hasStateChanged = (newState) => {
    const { type } = this.state.initialState;

    const selectedItems =
      type === 'data_source' ? this.state.initialState?.selectedDs : this.state.initialState?.selectedApps;

    const newSelectedItems = type === 'data_source' ? newState.selectedDs : newState.selectedApps;
    const newPermissionState =
      type === 'data_source' ? newState.initialPermissionStateDs : newState.initialPermissionState;

    const permissionStateChanged =
      type === 'data_source'
        ? this.state.initialState.initialPermissionStateDs?.canUse !== newPermissionState?.canUse ||
          this.state.initialPermissionStateDs?.canConfigure !== newPermissionState?.canConfigure
        : this.state.initialState.initialPermissionState?.canEdit !== newPermissionState?.canEdit ||
          newPermissionState?.canView !== this.state.initialState.initialPermissionState?.canView ||
          newPermissionState?.hideFromDashboard !== this.state.initialState.initialPermissionState?.hideFromDashboard;

    const selectedItemsChanged = JSON.stringify(selectedItems) !== JSON.stringify(newSelectedItems);
    const isAllChanged = this.state.initialState.isAll !== newState.isAll;

    if (newState.isAll === false && newSelectedItems?.length === 0) {
      return false;
    }

    const permissionNameChanged = this.state.initialState?.newPermissionName !== newState?.newPermissionName;

    return permissionStateChanged || selectedItemsChanged || isAllChanged || permissionNameChanged;
  };

  updateState = (stateUpdater) => {
    this.setState(
      (prevState) => {
        const newState = stateUpdater(prevState);
        return newState;
      },
      () => {
        const hasChanges = this.hasStateChanged(this.state);
        this.setState({ hasChanges });
      }
    );
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
      resourceType,
      selectedDs,
      hasChanges,
    } = this.state;

    const { addableDs = [], resourcesOptions } = this.props;

    const currentGroupPermission = this.props?.groupPermission;
    const isRoleGroup = currentGroupPermission.name == 'admin';
    const showPermissionInfo = currentGroupPermission.name == 'admin' || currentGroupPermission.name == 'end-user';
    const addPermissionTooltipMessage = !newPermissionName
      ? 'Please input permissions name'
      : isCustom && selectedApps.length === 0
      ? 'Please select apps or select all apps option'
      : '';
    const isBasicPlan = this.props.isBasicPlan;
    const disableEditUpdate = currentGroupPermission.name == 'end-user' || isBasicPlan;

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
          resourceType={resourceType}
          currentState={this.state}
          show={showAddPermissionModal}
          title={
            <div className="my-3 permission-manager-title" data-cy="modal-title">
              <span className="font-weight-500">
                <SolidIcon name={resourceType == 'Apps' ? 'apps' : 'datasource'} fill="var(--slate8)" />
              </span>
              <div className="tj-text-md font-weight-500 modal-name" data-cy="modal-title">
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
            disabled:
              (modalType === 'add' && !newPermissionName) ||
              (modalType === 'edit' && !hasChanges) ||
              (isCustom && selectedApps.length === 0 && resourceType === 'Apps') ||
              (isCustom && selectedDs.length === 0 && resourceType === 'Data Sources'),
            tooltipMessage: addPermissionTooltipMessage,
          }}
          disableBuilderLevelUpdate={disableEditUpdate}
          selectedApps={resourceType === 'Apps' ? selectedApps : selectedDs}
          setSelectedApps={resourceType === 'Apps' ? this.setSelectedApps : this.setSelectedDs}
          addableApps={resourceType === 'Apps' ? addableApps : addableDs}
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
                darkMode={this.props.darkMode}
                isBasicPlan={isBasicPlan}
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
                  {granularPermissions.map((permissions, index) => {
                    if (permissions.type === 'app')
                      return (
                        <AppResourcePermissions
                          updateOnlyGranularPermissions={this.updateOnlyGranularPermissions}
                          permissions={permissions}
                          currentGroupPermission={currentGroupPermission}
                          openEditPermissionModal={this.openEditPermissionModal}
                          isBasicPlan={isBasicPlan}
                          key={index}
                        />
                      );
                    else
                      return (
                        <DataSourceResourcePermissions
                          updateOnlyGranularPermissions={this.updateOnlyGranularPermissions}
                          permissions={permissions}
                          currentGroupPermission={currentGroupPermission}
                          openEditPermissionModal={this.openEditPermissionModal}
                          isBasicPlan={isBasicPlan}
                          key={index}
                        />
                      );
                  })}
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
              isBasicPlan={isBasicPlan}
              darkMode={this.props.darkMode}
            />
          </div>
        )}
      </div>
    );
  }
}

export default withTranslation()(BaseManageGranularAccess);
