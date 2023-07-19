import React from 'react';
import { groupPermissionService, userService } from '@/_services';
import { ConfirmDialog } from '@/_components';
import { toast } from 'react-hot-toast';
import { withTranslation } from 'react-i18next';
import { ManageGroupPermissionResources } from '@/ManageGroupPermissionResources';
import ErrorBoundary from '@/Editor/ErrorBoundary';
import Modal from '../HomePage/Modal';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import FolderList from '@/_ui/FolderList/FolderList';
import { Loader } from '../ManageSSO/Loader';
class ManageGroupPermissionsComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      groups: [],
      creatingGroup: false,
      showNewGroupForm: false,
      newGroupName: null,
      isDeletingGroup: false,
      isUpdatingGroupName: false,
      showGroupDeletionConfirmation: false,
      showGroupNameUpdateForm: false,
      groupToBeUpdated: null,
      isSaveBtnDisabled: false,
      selectedGroupPermissionId: null,
      selectedGroup: 'All Users',
    };
  }

  componentDidMount() {
    this.fetchGroups();
  }

  findCurrentGroupDetails = (data) => {
    let currentUpdatedGroup = data.group_permissions.find((item) => {
      return item.group == this.state.newGroupName;
    });
    this.setState({ selectedGroup: currentUpdatedGroup.group });
    return currentUpdatedGroup.id;
  };

  fetchGroups = (type = 'admin') => {
    this.setState({
      isLoading: true,
    });

    groupPermissionService
      .getGroups()
      .then((data) => {
        this.setState({
          groups: data.group_permissions,
          isLoading: false,
          selectedGroupPermissionId:
            type == 'admin'
              ? data.group_permissions[0].id
              : type == 'current'
              ? this.findCurrentGroupDetails(data)
              : data.group_permissions.at(-1).id,
        });
      })
      .catch(({ error }) => {
        toast.error(error);
        this.setState({
          isLoading: false,
        });
      });
  };

  changeNewGroupName = (value) => {
    this.setState({
      newGroupName: value,
      isSaveBtnDisabled: false,
    });
    if ((this.state.groupToBeUpdated && this.state.groupToBeUpdated.group === value) || !value) {
      this.setState({
        isSaveBtnDisabled: true,
      });
    }
  };

  humanizeifDefaultGroupName = (groupName) => {
    switch (groupName) {
      case 'all_users':
        return 'All Users';

      case 'admin':
        return 'Admin';

      default:
        return groupName;
    }
  };

  createGroup = () => {
    this.setState({ creatingGroup: true });
    groupPermissionService
      .create(this.state.newGroupName)
      .then(() => {
        this.setState({
          creatingGroup: false,
          showNewGroupForm: false,
          newGroupName: null,
          selectedGroup: this.state.newGroupName,
        });
        toast.success('Group has been created');
        this.fetchGroups('new');
      })
      .catch(({ error }) => {
        toast.error(error);
        this.setState({
          creatingGroup: false,
          showNewGroupForm: true,
        });
      });
  };

  deleteGroup = (groupPermissionId) => {
    this.setState({
      showGroupDeletionConfirmation: true,
      groupToBeDeleted: groupPermissionId,
    });
  };

  updateGroupName = (groupPermission) => {
    this.setState({
      showGroupNameUpdateForm: true,
      groupToBeUpdated: groupPermission,
      newGroupName: groupPermission.group,
      isSaveBtnDisabled: true,
    });
  };

  cancelDeleteGroupDialog = () => {
    this.setState({
      isDeletingGroup: false,
      groupToBeDeleted: null,
      showGroupDeletionConfirmation: false,
    });
  };

  executeGroupDeletion = () => {
    this.setState({ isDeletingGroup: true });
    groupPermissionService
      .del(this.state.groupToBeDeleted)
      .then(() => {
        toast.success('Group deleted successfully');
        this.fetchGroups();
        this.setState({ selectedGroup: 'All Users', isDeletingGroup: false });
      })
      .catch(({ error }) => {
        toast.error(error);
      })
      .finally(() => {
        this.cancelDeleteGroupDialog();
      });
  };

  executeGroupUpdation = () => {
    this.setState({ isUpdatingGroupName: true, selectedGroup: this.state.newGroupName });
    groupPermissionService
      .update(this.state.groupToBeUpdated?.id, { name: this.state.newGroupName })
      .then(() => {
        toast.success('Group name updated successfully');
        this.fetchGroups('current');
        this.setState({
          isUpdatingGroupName: false,
          groupToBeUpdated: null,
          showGroupNameUpdateForm: false,
        });
      })
      .catch(({ error }) => {
        toast.error(error);
        this.setState({
          isUpdatingGroupName: false,
        });
      });
  };

  render() {
    const {
      isLoading,
      showNewGroupForm,
      showGroupNameUpdateForm,
      creatingGroup,
      isUpdatingGroupName,
      groups,
      isDeletingGroup,
      showGroupDeletionConfirmation,
    } = this.state;
    return (
      <ErrorBoundary showFallback={true}>
        <div className="wrapper org-users-page animation-fade">
          <div className="org-users-page-container">
            <ConfirmDialog
              show={showGroupDeletionConfirmation}
              message={'This group will be permanently deleted. Do you want to continue?'}
              confirmButtonLoading={isDeletingGroup}
              onConfirm={() => this.executeGroupDeletion()}
              onCancel={() => this.cancelDeleteGroupDialog()}
              darkMode={this.props.darkMode}
            />
            <div className="d-flex groups-btn-container">
              <p className="tj-text" data-cy="page-title">
                {groups?.length} Groups
              </p>
              {!showNewGroupForm && !showGroupNameUpdateForm && (
                <ButtonSolid
                  className="btn btn-primary create-new-group-button"
                  onClick={(e) => {
                    e.preventDefault();
                    this.setState({ newGroupName: null, showNewGroupForm: true, isSaveBtnDisabled: true });
                  }}
                  data-cy="create-new-group-button"
                  leftIcon="plus"
                  isLoading={isLoading}
                  iconWidth="16"
                  fill={'#FDFDFE'}
                >
                  {this.props.t(
                    'header.organization.menus.manageGroups.permissions.createNewGroup',
                    'Create new group'
                  )}
                </ButtonSolid>
              )}
            </div>

            <Modal
              show={showNewGroupForm || showGroupNameUpdateForm}
              closeModal={() =>
                this.setState({
                  showNewGroupForm: false,
                  showGroupNameUpdateForm: false,
                  newGroupName: null,
                })
              }
              title={
                showGroupNameUpdateForm
                  ? this.props.t('header.organization.menus.manageGroups.permissions.updateGroup', 'Update group')
                  : this.props.t('header.organization.menus.manageGroups.permissions.addNewGroup', 'Add new group')
              }
            >
              <form
                id="my-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (showNewGroupForm) {
                    this.createGroup();
                  } else {
                    this.executeGroupUpdation();
                  }
                }}
              >
                <div className="form-group mb-3 ">
                  <div className="row">
                    <div className="col tj-app-input">
                      <input
                        type="text"
                        required
                        className="form-control"
                        placeholder={this.props.t(
                          'header.organization.menus.manageGroups.permissions.enterName',
                          'Enter Name'
                        )}
                        onChange={(e) => {
                          this.changeNewGroupName(e.target.value);
                        }}
                        value={this.state.newGroupName}
                        data-cy="group-name-input"
                        autoFocus
                      />
                    </div>
                  </div>
                </div>
                <div className="form-footer d-flex create-group-modal-footer">
                  <ButtonSolid
                    onClick={() =>
                      this.setState({
                        showNewGroupForm: false,
                        showGroupNameUpdateForm: false,
                        newGroupName: null,
                      })
                    }
                    disabled={creatingGroup}
                    data-cy="cancel-button"
                    variant="tertiary"
                  >
                    {this.props.t('globals.cancel', 'Cancel')}
                  </ButtonSolid>
                  <ButtonSolid
                    type="submit"
                    id="my-form"
                    disabled={creatingGroup || this.state.isSaveBtnDisabled}
                    data-cy="create-group-button"
                    isLoading={creatingGroup || isUpdatingGroupName}
                    leftIcon="plus"
                    fill={creatingGroup || this.state.isSaveBtnDisabled ? '#4C5155' : '#FDFDFE'}
                  >
                    {showGroupNameUpdateForm
                      ? this.props.t('globals.save', 'Save')
                      : this.props.t('header.organization.menus.manageGroups.permissions.createGroup', 'Create Group')}
                  </ButtonSolid>
                </div>
              </form>
            </Modal>

            {!showNewGroupForm && !showGroupNameUpdateForm && (
              <div className="org-users-page-card-wrap">
                <div className="org-users-page-sidebar">
                  {groups.map((permissionGroup) => {
                    return (
                      <FolderList
                        key={permissionGroup.id}
                        selectedItem={
                          this.state.selectedGroup == this.humanizeifDefaultGroupName(permissionGroup.group)
                        }
                        onClick={() => {
                          this.setState({
                            selectedGroupPermissionId: permissionGroup.id,
                            selectedGroup: this.humanizeifDefaultGroupName(permissionGroup.group),
                          });
                        }}
                        className="groups-folder-list"
                        dataCy={this.humanizeifDefaultGroupName(permissionGroup.group)
                          .toLowerCase()
                          .replace(/\s+/g, '-')}
                      >
                        <span>{this.humanizeifDefaultGroupName(permissionGroup.group)}</span>
                      </FolderList>
                    );
                  })}
                </div>

                <div className="org-users-page-card-body">
                  {isLoading ? (
                    <Loader />
                  ) : (
                    <ManageGroupPermissionResources
                      groupPermissionId={this.state.selectedGroupPermissionId}
                      darkMode={this.props.darkMode}
                      selectedGroup={this.state.selectedGroup}
                      updateGroupName={this.updateGroupName}
                      deleteGroup={this.deleteGroup}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </ErrorBoundary>
    );
  }
}

export const ManageGroupPermissions = withTranslation()(ManageGroupPermissionsComponent);
