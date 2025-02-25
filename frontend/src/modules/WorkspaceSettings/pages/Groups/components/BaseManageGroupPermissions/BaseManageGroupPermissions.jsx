import React from 'react';
import { groupPermissionV2Service } from '@/_services';
import { Tooltip } from 'react-tooltip';
import { ConfirmDialog } from '@/_components';
import { toast } from 'react-hot-toast';
import { withTranslation } from 'react-i18next';
import ErrorBoundary from '@/Editor/ErrorBoundary';
import Modal from '@/HomePage/Modal';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import FolderList from '@/_ui/FolderList/FolderList';
import { Loader, LicenseBanner } from '@/modules/common/components';
import Popover from 'react-bootstrap/Popover';
import SolidIcon from '@/_ui/Icon/solidIcons/index';
import ModalBase from '@/_ui/Modal';
import OverflowTooltip from '@/_components/OverflowTooltip';
import ManageGroupPermissionResources from '../ManageGroupPermissionResources';
import '../../resources/styles/group-permissions.styles.scss';
import { SearchBox } from '@/_components/SearchBox';
import { LicenseTooltip } from '@/LicenseTooltip';
import _ from 'lodash';

class BaseManageGroupPermissions extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      groups: [],
      defaultGroups: [],
      creatingGroup: false,
      showNewGroupForm: false,
      newGroupName: '',
      isDeletingGroup: false,
      isUpdatingGroupName: false,
      showGroupDeletionConfirmation: false,
      showGroupNameUpdateForm: false,
      groupToBeUpdated: null,
      isSaveBtnDisabled: false,
      selectedGroupPermissionId: null,
      selectedGroup: 'Admin',
      isDuplicatingGroup: false,
      selectedGroupObject: null,
      groupDuplicateOption: props.groupDuplicateOption,
      showDuplicateGroupModal: false,
      groupToDuplicate: '',
      showGroupSearchBar: false,
      filteredGroup: [],
      groupNameMessage: 'Group name must be unique and max 50 characters',
    };
  }

  componentDidMount() {
    this.fetchGroups();
  }

  findCurrentGroupDetails = (data) => {
    let currentUpdatedGroup = data.find((item) => {
      return item.name?.trim() == this.state.newGroupName?.trim();
    });
    this.setState({ selectedGroup: currentUpdatedGroup.name });
    return currentUpdatedGroup.id;
  };

  duplicateGroup = () => {
    const { groupDuplicateOption, groupToDuplicate } = this.state;
    this.setState({ isDuplicatingGroup: true });
    groupPermissionV2Service
      .duplicate(groupToDuplicate, groupDuplicateOption)
      .then((data) => {
        this.setState({
          newGroupName: data?.name,
        });

        this.fetchGroups('current', () => {
          this.setState({
            newGroupName: '',
            creatingGroup: false,
            selectedGroupPermissionId: data?.id,
            selectedGroup: data?.name,
            isDuplicatingGroup: false,
            showDuplicateGroupModal: false,
            groupDuplicateOption: this.props.groupDuplicateOption,
          });
        });

        toast.success('Group duplicated successfully!');
      })
      .catch((err) => {
        this.setState({
          isDuplicatingGroup: false,
          creatingGroup: false,
          groupDuplicateOption: this.props.groupDuplicateOption,
        });
        console.error('Error occured in duplicating: ', err);
        toast.error('Could not duplicate group.\nPlease try again!');
      });
  };

  toggleShowDuplicateModal = () => {
    this.setState((prevState) => ({
      showDuplicateGroupModal: !prevState.showDuplicateGroupModal,
      groupToDuplicate: '',
      groupDuplicateOption: this.props.groupDuplicateOption,
    }));
  };

  renderPopoverContent = (props, compoParam) => {
    const { groupName, id, isFeatureEnabled } = compoParam;
    const deleteGroup = () => {
      this.deleteGroup(id);
    };

    const duplicateGroup = () => {
      this.showDuplicateDiologBox(id);
    };

    const isDefaultGroup = groupName == 'end-user' || groupName == 'admin' || groupName == 'builder';

    return (
      <div
        {...props}
        style={{
          position: 'absolute',
          ...props.style,
        }}
      >
        <Popover
          id="popover-group-menu"
          className={this.props.darkMode ? 'popover-group-menu dark-theme' : 'popover-group-menu'}
          placement="bottom"
        >
          <Popover.Body bsPrefix="popover-body">
            <div>
              <Field
                customClass={this.props.darkMode ? 'dark-theme' : ''}
                leftIcon="copy"
                leftIconWidth="20"
                leftViewBox="0  0 20 20"
                text={'Duplicate group'}
                onClick={duplicateGroup}
                buttonDisable={!isFeatureEnabled}
              />
              <Field
                customClass={this.props.darkMode ? 'dark-theme' : ''}
                leftIcon="delete"
                leftIconWidth="18"
                leftIconHeight="18"
                leftViewBox="0  0 20 20"
                text={'Delete group'}
                tooltipId="tooltip-for-delete"
                tooltipContent="Cannot delete default group"
                onClick={isDefaultGroup ? {} : deleteGroup}
                buttonDisable={isDefaultGroup}
                darkMode={this.props.darkMode}
              />
            </div>
          </Popover.Body>
        </Popover>
        {(groupName == 'all_users' || groupName == 'admin' || groupName == 'builder' || groupName == 'end-user') && (
          <Tooltip
            id="tooltip-for-delete"
            className="tooltip"
            place="left"
            style={{
              zIndex: 99999,
            }}
            show={isDefaultGroup}
          />
        )}
      </div>
    );
  };
  sortDefaultGroup = (list) => {
    const priority = {
      admin: 1,
      builder: 2,
      'end-user': 3,
    };
    list.sort((a, b) => {
      const priorityA = priority[a.name] || 4; // default to 4 if not found
      const priorityB = priority[b.name] || 4; // default to 4 if not found
      return priorityA - priorityB;
    });
    return list;
  };

  fetchGroups = (type = 'admin', callback = () => {}) => {
    this.setState({
      isLoading: true,
    });

    groupPermissionV2Service
      .getGroups()
      .then((data) => {
        const groupPermissions = data.groupPermissions;
        const defaultGroups = this.sortDefaultGroup(groupPermissions.filter((group) => group.type === 'default'));
        const currentGroupId =
          type == 'admin'
            ? defaultGroups[0].id
            : type == 'current'
            ? this.findCurrentGroupDetails(groupPermissions)
            : groupPermissions.at(-1).id;
        this.setState(
          {
            groups: groupPermissions.filter((group) => group.type === 'custom'),
            defaultGroups: defaultGroups,
            filteredGroup: groupPermissions.filter((group) => group.type === 'custom'),
            isLoading: false,
            selectedGroupPermissionId: currentGroupId,
            selectedGroupObject: groupPermissions.find((group) => group.id === currentGroupId),
          },
          callback
        );
      })
      .catch(({ error }) => {
        toast.error(error);
        this.setState({
          isLoading: false,
        });
      });
  };

  handleGroupSearch = (e) => {
    const { groups } = this.state;
    let filteredGroup = groups;
    const value = e?.target?.value;
    if (value) {
      filteredGroup = groups.filter((group) => group.name.toLowerCase().includes(value.toLowerCase()));
    }
    this.setState({
      filteredGroup,
    });
  };

  changeNewGroupName = (value) => {
    if (value.length > 50) {
      this.setState({
        newGroupName: value?.slice(0, 50).trim(),
        isSaveBtnDisabled: false,
      });
      return;
    }
    this.setState({
      newGroupName: value,
      isSaveBtnDisabled: false,
      groupNameMessage: 'Group name must be unique and max 50 characters',
    });
    if ((this.state.groupToBeUpdated && this.state.groupToBeUpdated.name === value) || !value) {
      this.setState({
        isSaveBtnDisabled: true,
      });
    }
  };

  humanizeifDefaultGroupName = (groupName) => {
    switch (groupName) {
      case 'end-user':
        return 'End-user';
      case 'admin':
        return 'Admin';
      case 'builder':
        return 'Builder';
      default:
        return groupName;
    }
  };

  createGroup = () => {
    const regex = /^[a-zA-Z0-9_ -]+$/;
    if (!regex.test(this.state.newGroupName)) {
      toast.error('Group name can only contain letters, numbers, underscores and hyphens');
      return;
    }
    this.setState({ creatingGroup: true });
    groupPermissionV2Service
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
        toast.error(error, {
          style: {
            maxWidth: '500px',
          },
        });
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
      newGroupName: groupPermission.name,
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
    groupPermissionV2Service
      .del(this.state.groupToBeDeleted)
      .then(() => {
        toast.success('Group deleted successfully');
        this.fetchGroups();
        this.setState({ selectedGroup: 'Admin', isDeletingGroup: false });
      })
      .catch(({ error }) => {
        toast.error(error);
      })
      .finally(() => {
        this.cancelDeleteGroupDialog();
      });
  };

  handleGroupSearchClose = () => {
    this.setState((prevState) => ({
      showGroupSearchBar: false,
      filteredGroup: prevState.groups,
    }));
  };

  showDuplicateDiologBox = (id) => {
    this.setState({ groupToDuplicate: id, showDuplicateGroupModal: true, isDuplicatingGroup: false });
  };

  executeGroupUpdation = () => {
    this.setState({ isUpdatingGroupName: true });
    groupPermissionV2Service
      .update(this.state.groupToBeUpdated?.id, { name: this.state.newGroupName })
      .then(() => {
        toast.success('Group name updated successfully');
        this.fetchGroups('current');
        this.setState({
          isUpdatingGroupName: false,
          groupToBeUpdated: null,
          showGroupNameUpdateForm: false,
          selectedGroup: this.state.newGroupName,
        });
      })
      .catch(({ error }) => {
        toast.error(error, {
          style: {
            maxWidth: '500px',
          },
        });
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
      showDuplicateGroupModal,
      isDuplicatingGroup,
      groupDuplicateOption,
      defaultGroups,
      filteredGroup,
      showGroupSearchBar,
    } = this.state;

    const { featureAccess, isFeatureEnabled, isTrial } = this.props;

    const grounNameErrorStyle =
      this.state.newGroupName?.length > 50 ? { color: '#ff0000', borderColor: '#ff0000' } : {};
    const { addPermission, addApps, addUsers, addDataSource = null } = groupDuplicateOption;
    const allFalse = Object.values(groupDuplicateOption).every((value) => !value);

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
            <ModalBase
              show={showDuplicateGroupModal}
              handleConfirm={this.duplicateGroup}
              handleClose={this.toggleShowDuplicateModal}
              title="Duplicate group"
              confirmBtnProps={{ title: 'Duplicate', disabled: allFalse, tooltipMessage: false }}
              isLoading={isDuplicatingGroup}
              cancelDisabled={isDuplicatingGroup}
              data-cy="modal-title"
              darkMode={this.props.darkMode}
            >
              <div className="tj-text" data-cy="modal-message">
                Duplicate the following parts of the group
              </div>
              <div className="group-duplcate-modal-body">
                <div className="row check-row">
                  <div className="col-1 ">
                    <input
                      class="form-check-input"
                      checked={addUsers}
                      type="checkbox"
                      onChange={() => {
                        this.setState((prevState) => ({
                          groupDuplicateOption: {
                            ...prevState.groupDuplicateOption,
                            addUsers: !prevState.groupDuplicateOption.addUsers,
                          },
                        }));
                      }}
                      data-cy="users-check-input"
                    />
                  </div>
                  <div className="col-11">
                    <div className="tj-text " data-cy="users-label">
                      Users
                    </div>
                  </div>
                </div>
                <div className="row check-row">
                  <div className="col-1 ">
                    <input
                      class="form-check-input"
                      checked={addPermission}
                      type="checkbox"
                      onChange={() => {
                        this.setState((prevState) => ({
                          groupDuplicateOption: {
                            ...prevState.groupDuplicateOption,
                            addPermission: !prevState.groupDuplicateOption.addPermission,
                          },
                        }));
                      }}
                      data-cy="permissions-check-input"
                    />
                  </div>
                  <div className="col-11">
                    <div className="tj-text " data-cy="permissions-label">
                      Permissions
                    </div>
                  </div>
                </div>
                <div className="row check-row">
                  <div className="col-1 ">
                    <input
                      class="form-check-input"
                      checked={addApps}
                      type="checkbox"
                      onChange={() => {
                        this.setState((prevState) => ({
                          groupDuplicateOption: {
                            ...prevState.groupDuplicateOption,
                            addApps: !prevState.groupDuplicateOption.addApps,
                          },
                        }));
                      }}
                      data-cy="apps-check-input"
                    />
                  </div>
                  <div className="col-11">
                    <div className="tj-text " data-cy="apps-label">
                      Apps
                    </div>
                  </div>
                </div>
                {addDataSource !== null && (
                  <div className="row check-row">
                    <div className="col-1 ">
                      <input
                        class="form-check-input"
                        checked={addDataSource}
                        type="checkbox"
                        onChange={() => {
                          this.setState((prevState) => ({
                            groupDuplicateOption: {
                              ...prevState.groupDuplicateOption,
                              addDataSource: !prevState.groupDuplicateOption.addDataSource,
                            },
                          }));
                        }}
                        data-cy="datasources-check-input"
                      />
                    </div>
                    <div className="col-11">
                      <div className="tj-text " data-cy="datasources-label">
                        Datasources
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ModalBase>
            <div className="d-flex groups-btn-container">
              <p className="tj-text" data-cy="page-title">
                {groups?.length} Groups
              </p>
              {!showNewGroupForm && !showGroupNameUpdateForm && (
                <LicenseTooltip
                  limits={featureAccess}
                  feature={'Custom groups'}
                  noTooltipIfValid={true}
                  isAvailable={isFeatureEnabled}
                  placement={'bottom'}
                  customMessage={'Custom groups are available only in paid plans'}
                >
                  <ButtonSolid
                    className="btn btn-primary create-new-group-button"
                    onClick={(e) => {
                      e.preventDefault();
                      this.setState({ newGroupName: '', showNewGroupForm: true, isSaveBtnDisabled: true });
                    }}
                    data-cy="create-new-group-button"
                    leftIcon="plus"
                    isLoading={isLoading}
                    iconWidth="16"
                    fill={'#FDFDFE'}
                    disabled={!isFeatureEnabled}
                  >
                    {this.props.t(
                      'header.organization.menus.manageGroups.permissions.createNewGroup',
                      'Create new group'
                    )}
                  </ButtonSolid>
                </LicenseTooltip>
              )}
            </div>
            <Modal
              show={showNewGroupForm || showGroupNameUpdateForm}
              customClassName={'add-new-group-modal'}
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
                  : this.props.t('header.organization.menus.manageGroups.permissions.addNewGroup', 'Create new group')
              }
              titleAdornment={
                isTrial && <LicenseBanner isAvailable={false} showPaidFeatureBanner={true}></LicenseBanner>
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
                        className={`form-control ${this.state.newGroupName?.length >= 50 ? 'custom-input-error' : ''}`}
                        placeholder={this.props.t(
                          'header.organization.menus.manageGroups.permissions.enterName',
                          'Enter group name'
                        )}
                        onChange={(e) => {
                          this.changeNewGroupName(e.target.value);
                        }}
                        value={this.state.newGroupName}
                        data-cy="group-name-input"
                        autoFocus
                      />
                      <span className="tj-text-xxsm" style={grounNameErrorStyle} data-cy="group-name-info-text">
                        {this.state.groupNameMessage}
                      </span>
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
            <div className="org-users-page-card-wrap">
              <div style={{ display: 'grid' }} className="org-users-page-sidebar">
                <div className="default-group-list-container">
                  <div className="mb-2 d-flex align-items-center">
                    <SolidIcon name="usergear" />
                    <span className="ml-1 group-title">USER ROLE</span>
                  </div>
                  {defaultGroups.map((permissionGroup) => {
                    return (
                      <FolderList
                        key={permissionGroup.id}
                        listId={permissionGroup.id}
                        overlayFunctionParam={{
                          id: permissionGroup.id,
                          groupName: permissionGroup.name,
                          isFeatureEnabled: isFeatureEnabled,
                        }}
                        selectedItem={this.state.selectedGroup == this.humanizeifDefaultGroupName(permissionGroup.name)}
                        onClick={() => {
                          this.setState({
                            selectedGroupPermissionId: permissionGroup.id,
                            selectedGroup: this.humanizeifDefaultGroupName(permissionGroup.name),
                            selectedGroupObject: permissionGroup,
                          });
                        }}
                        toolTipText={this.humanizeifDefaultGroupName(permissionGroup.name)}
                        overLayComponent={this.renderPopoverContent}
                        className="groups-folder-list"
                        dataCy={this.humanizeifDefaultGroupName(permissionGroup.name)
                          .toLowerCase()
                          .replace(/\s+/g, '-')}
                      >
                        <span>
                          <OverflowTooltip>{this.humanizeifDefaultGroupName(permissionGroup.name)}</OverflowTooltip>
                        </span>
                      </FolderList>
                    );
                  })}
                  <div>
                    {!showGroupSearchBar ? (
                      <div className="mb-2 d-flex align-items-center">
                        <SolidIcon name="usergroup" width="18px" fill="#889096" />
                        <span className="ml-1 group-title">CUSTOM GROUPS</span>
                        <div className="create-group-cont">
                          {isFeatureEnabled ? (
                            <ButtonSolid
                              onClick={(e) => {
                                e.preventDefault();
                                this.setState({ showGroupSearchBar: true });
                              }}
                              size="xsm"
                              rightIcon="search"
                              iconWidth="15"
                              fill="#889096"
                              className="create-group-custom"
                            />
                          ) : (
                            <div style={{ width: '20px' }}></div>
                          )}
                          <LicenseTooltip
                            limits={featureAccess}
                            feature={'Custom groups'}
                            noTooltipIfValid={true}
                            isAvailable={isFeatureEnabled}
                            placement={'right'}
                            customMessage={'Custom groups are available only in paid plans'}
                          >
                            <ButtonSolid
                              onClick={(e) => {
                                e.preventDefault();
                                this.setState({ newGroupName: null, showNewGroupForm: true, isSaveBtnDisabled: true });
                              }}
                              size="sm"
                              fill="#889096"
                              rightIcon="plus"
                              iconWidth="20"
                              className="create-group-custom"
                              disabled={!isFeatureEnabled}
                            />
                          </LicenseTooltip>
                        </div>
                      </div>
                    ) : (
                      <div className="searchbox-custom">
                        <SearchBox
                          dataCy={`query-manager`}
                          width="70px !important"
                          callBack={this.handleGroupSearch}
                          placeholder={'Search'}
                          customClass="tj-common-search-input-group"
                          onClearCallback={this.handleGroupSearchClose}
                          autoFocus={true}
                        />
                      </div>
                    )}
                    {filteredGroup.length === 0 && showGroupSearchBar && groups.length !== 0 && (
                      <div className="empty-custom-group-info">
                        <SolidIcon className="info-icon" name="information" width="18px" />
                        <span className="tj-text-xsm text-center info-label" data-cy="empty-custom-group-info">
                          No custom groups found
                        </span>
                      </div>
                    )}
                    {groups.length ? (
                      filteredGroup.map((permissionGroup) => {
                        return (
                          <FolderList
                            key={permissionGroup.id}
                            listId={permissionGroup.id}
                            overlayFunctionParam={{
                              id: permissionGroup.id,
                              groupName: permissionGroup.name,
                              isFeatureEnabled: !permissionGroup.disabled,
                            }}
                            selectedItem={
                              this.state.selectedGroup == this.humanizeifDefaultGroupName(permissionGroup.name)
                            }
                            onClick={
                              permissionGroup.disabled
                                ? null
                                : () => {
                                    this.setState({
                                      selectedGroupPermissionId: permissionGroup.id,
                                      selectedGroup: this.humanizeifDefaultGroupName(permissionGroup.name),
                                      selectedGroupObject: permissionGroup,
                                    });
                                  }
                            }
                            disabled={permissionGroup.disabled}
                            toolTipDisabled={permissionGroup.disabled}
                            toolTipText={
                              !permissionGroup.disabled
                                ? this.humanizeifDefaultGroupName(permissionGroup.name)
                                : 'Custom groups are available only in paid plans'
                            }
                            overLayComponent={permissionGroup.disabled ? null : this.renderPopoverContent}
                            className="groups-folder-list"
                            dataCy={this.humanizeifDefaultGroupName(permissionGroup.name)
                              .toLowerCase()
                              .replace(/\s+/g, '-')}
                          >
                            <span>
                              <OverflowTooltip>{this.humanizeifDefaultGroupName(permissionGroup.name)}</OverflowTooltip>
                            </span>
                          </FolderList>
                        );
                      })
                    ) : (
                      <div className="empty-custom-group-info">
                        <SolidIcon className="info-icon" name="information" width="18px" />
                        <span className="tj-text-xsm text-center info-label">No custom groups added</span>
                      </div>
                    )}
                  </div>
                </div>
                {!_.isEmpty(featureAccess) && !isFeatureEnabled && (
                  <LicenseBanner
                    style={{ alignSelf: 'flex-end', margin: '0px !important' }}
                    limits={featureAccess}
                    classes="group-banner"
                    size="xsmall"
                    type={featureAccess?.licenseStatus?.licenseType}
                    customMessage={'Custom groups & permissions are available in our paid plans.'}
                  />
                )}
              </div>

              <div className="org-users-page-card-body">
                {isLoading ? (
                  <Loader />
                ) : (
                  <ManageGroupPermissionResources
                    groupPermissionId={this.state.selectedGroupPermissionId}
                    darkMode={this.props.darkMode}
                    selectedGroup={this.state.selectedGroup}
                    selectedGroupObject={this.state.selectedGroupObject}
                    updateGroupName={this.updateGroupName}
                    deleteGroup={this.deleteGroup}
                    roleOptions={defaultGroups.map((group) => {
                      return {
                        name: this.humanizeifDefaultGroupName(group.name),
                        value: group.name,
                      };
                    })}
                    featureAccess={featureAccess}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }
}

export default withTranslation()(BaseManageGroupPermissions);

const Field = ({
  text,
  onClick,
  customClass,
  leftIcon,
  leftIconWidth,
  leftIconHeight = '18',
  leftIconClassName,
  buttonDisable = false,
  tooltipContent = '',
  tooltipId = '',
  darkMode = false,
}) => {
  return (
    <div className={`field ${customClass ? ` ${customClass}` : ''}`}>
      <span
        className="row option-row"
        role="button"
        onClick={!buttonDisable && onClick}
        data-cy={`${text.toLowerCase().replace(/\s+/g, '-')}-card-option`}
        data-tooltip-content={tooltipContent}
        data-tooltip-id={tooltipId}
      >
        <div className={`col-2 ${leftIconClassName}`}>
          {leftIcon && (
            <SolidIcon
              name={leftIcon}
              width={leftIconWidth}
              height={leftIconHeight}
              {...(buttonDisable ? { fill: '#D7DBDF' } : {})}
            ></SolidIcon>
          )}
        </div>
        <div className={`col ${buttonDisable ? 'disable' : ''} ${darkMode ? 'dark-theme' : ''}`}>{text}</div>
      </span>
    </div>
  );
};
