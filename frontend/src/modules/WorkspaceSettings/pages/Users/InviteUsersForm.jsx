import React, { useState, useCallback, useRef, useEffect } from 'react';
import cx from 'classnames';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ToolTip } from '@/_components/ToolTip';
import { useTranslation } from 'react-i18next';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { toast } from 'react-hot-toast';
import { FileDropzone } from './FileDropzone';
import { authenticationService, userService, licenseService } from '@/_services';
import { USER_DRAWER_MODES } from '@/_helpers/utils';
import { UserGroupsSelect } from './UserGroupsSelect';
import { EDIT_ROLE_MESSAGE } from '@/modules/common/constants';
import ModalBase from '@/_ui/Modal';
import { UserMetadata } from './components';
import LicenseBanner from '@/modules/common/components/LicenseBanner';

function InviteUsersForm({
  onClose,
  manageUser,
  changeNewUserOption,
  errors,
  fields,
  handleFileChange,
  uploadingUsers,
  onCancel,
  inviteBulkUsers,
  groups = [],
  currentEditingUser,
  userDrawerMode,
  setUserValues,
  creatingUser,
  darkMode,
}) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(1);
  const [userLimits, setUserLimits] = useState({});
  const [existingGroups, setExistingGroups] = useState([]);
  const [newRole, setNewRole] = useState(null);
  const customGroups = groups.filter((group) => group.groupType === 'custom' && group?.disabled !== true);
  const roleGroups = groups
    .filter((group) => group.groupType === 'default')
    .sort((a, b) => {
      const sortOrder = ['admin', 'builder', 'end-user'];
      const indexA = sortOrder.indexOf(a.value);
      const indexB = sortOrder.indexOf(b.value);

      return indexA - indexB;
    });
  const [isChangeRoleModalOpen, setIsChangeRoleModalOpen] = useState(false);
  const [fileUpload, setFileUpload] = useState(false);
  const groupedOptions = [
    {
      label: 'default',
      options: roleGroups,
    },
    {
      label: 'custom',
      options: customGroups,
    },
  ];
  const [selectedGroups, setSelectedGroups] = useState([]);
  useEffect(() => {
    setFileUpload(false);
  }, [activeTab]);

  const hiddenFileInput = useRef(null);
  const [userMetadata, setUserMetadata] = useState([]);

  const { super_admin } = authenticationService.currentSessionValue;
  const [featureAccess, setFeatureAccess] = useState({});

  useEffect(() => {
    fetchFeatureAccess();
    fetchUserLimits();
  }, [activeTab]);

  const fetchFeatureAccess = () => {
    licenseService.getFeatureAccess().then((data) => {
      setFeatureAccess(data);
    });
  };

  const fetchUserLimits = () => {
    userService.getUserLimits('total').then((data) => {
      setUserLimits(data);
    });
  };

  useEffect(() => {
    if (currentEditingUser && groups.length) {
      const {
        first_name,
        last_name,
        email,
        groups: addedToCustomGroups,
        role_group,
        user_metadata,
      } = currentEditingUser;
      const addedToGroups = [...addedToCustomGroups, ...role_group];
      setUserValues({
        fullName: `${first_name}${last_name && ` ${last_name}`}`,
        email: email,
      });
      const preSelectedGroups = groups
        .filter((group) => addedToGroups.map((group) => group.name).includes(group.value))
        .map((filteredGroup) => ({
          ...filteredGroup,
          label: filteredGroup.name,
        }));
      setExistingGroups(
        groups.filter((group) => addedToCustomGroups.map((gp) => gp.name).includes(group.value)).map((g) => g.id)
      );
      onChangeHandler(preSelectedGroups);
      // Transform user_metadata from object to array of key-value pairs
      if (user_metadata) {
        const userMetadataArray = Object.entries(user_metadata);
        setUserMetadata(userMetadataArray);
      }
    } else {
      onChangeHandler(roleGroups.filter((group) => group.value === 'end-user'));
    }
  }, [currentEditingUser, groups]);

  useEffect(() => {
    if (currentEditingUser && groups.length) {
      const { first_name, last_name, email, groups: addedToCustomGroups, role_group } = currentEditingUser;
      const addedToGroups = [...addedToCustomGroups, ...role_group];
      setUserValues({
        fullName: `${first_name}${last_name && ` ${last_name}`}`,
        email: email,
      });
      const preSelectedGroups = groups
        .filter((group) => addedToGroups.map((group) => group.name).includes(group.value))
        .map((filteredGroup) => ({
          ...filteredGroup,
          label: filteredGroup.name,
        }));
      setExistingGroups(
        groups.filter((group) => addedToCustomGroups.map((gp) => gp.name).includes(group.value)).map((g) => g.id)
      );
      onChangeHandler(preSelectedGroups);
    } else {
      onChangeHandler(roleGroups.filter((group) => group.value === 'end-user'));
    }
  }, [currentEditingUser, groups]);

  useEffect(() => {
    const isEditing = userDrawerMode === USER_DRAWER_MODES.EDIT;
    if (!isEditing) {
      const preSelectedGroups = groups
        .filter((group) => group.isFixed)
        .map((filteredGroup) => ({
          ...filteredGroup,
          label: filteredGroup.name,
        }));
      onChangeHandler(preSelectedGroups);
    }
  }, [userDrawerMode, groups]);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (Math.round(file.size / 1024) > 1024) {
      toast.error('File size cannot exceed more than 1MB');
    } else {
      handleFileChange(file);
      setFileUpload(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClick = () => {
    hiddenFileInput.current.click();
  };

  const onChangeHandler = (items) => {
    let finalGroup = items;
    const roleGroups = items.filter((group) => group.groupType === 'default');
    const currentRole = selectedGroups.find((group) => group.groupType === 'default');
    if (roleGroups.length == 2) {
      finalGroup = items.filter((group) => group.value !== currentRole.value);
    }
    if (roleGroups.length === 0) return;
    if (currentEditingUser) {
      const role = finalGroup.find(
        (group) =>
          group.groupType === 'default' && !currentEditingUser.role_group.map((role) => role.name).includes(group.value)
      );
      setNewRole(role);
    }
    setSelectedGroups(finalGroup);
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    const role = selectedGroups.find((group) => group.groupType === 'default').value;
    const selectedGroupsIds = selectedGroups.filter((group) => group.groupType !== 'default').map((group) => group.id);
    manageUser(currentEditingUser?.id, selectedGroupsIds, role, userMetadata);
  };

  const handleEditUser = (e) => {
    e.preventDefault();
    if (
      newRole &&
      EDIT_ROLE_MESSAGE?.[currentEditingUser?.role_group?.[0]?.name]?.[newRole?.value]?.(
        featureAccess?.licenseStatus?.isLicenseValid
      )
    )
      setIsChangeRoleModalOpen(true);
    else {
      editUser();
    }
  };

  const editUser = () => {
    const { newGroupsToAdd, groupsToRemove, selectedGroupsIds } = getEditedGroups();
    manageUser(currentEditingUser.id, selectedGroupsIds, newRole?.value, userMetadata, newGroupsToAdd, groupsToRemove);
    setIsChangeRoleModalOpen(false);
  };

  const getEditedGroups = () => {
    const selectedGroupsIds = selectedGroups.filter((group) => group.groupType !== 'default').map((group) => group.id);
    const newGroupsToAdd = selectedGroupsIds.filter((selectedGroupId) => !existingGroups.includes(selectedGroupId));
    const groupsToRemove = existingGroups.filter((existingGroup) => !selectedGroupsIds.includes(existingGroup));
    return { newGroupsToAdd, groupsToRemove, selectedGroupsIds };
  };

  const isEdited = () => {
    const { newGroupsToAdd, groupsToRemove } = getEditedGroups();
    const inValidUserDetail = !(fields?.['fullName'] && fields?.['email']);
    const { first_name, last_name } = currentEditingUser || {};
    return isEditing
      ? fields['fullName'] !== `${first_name}${last_name && ` ${last_name}`}` ||
          groupsToRemove.length ||
          newRole ||
          newGroupsToAdd.length ||
          JSON.stringify(Object.fromEntries(userMetadata)) !== JSON.stringify(currentEditingUser.user_metadata)
      : !inValidUserDetail || activeTab == 2;
  };

  const isEditing = userDrawerMode === USER_DRAWER_MODES.EDIT;

  const metadataChanged = (newOptions) => {
    setUserMetadata(newOptions);
  };

  return (
    <div>
      {isChangeRoleModalOpen && (
        <ModalBase
          title={
            <div className="my-3" data-cy="modal-title">
              <span className="tj-text-md font-weight-500">Edit user role</span>
              <div className="tj-text-sm text-muted" data-cy="user-email">
                {currentEditingUser?.email}
              </div>
            </div>
          }
          handleConfirm={editUser}
          show={isChangeRoleModalOpen}
          darkMode={darkMode}
          handleClose={() => {
            setIsChangeRoleModalOpen(false);
            onCancel();
            onClose();
          }}
          confirmBtnProps={{ title: 'Continue', tooltipMessage: false }}
        >
          <div>
            {EDIT_ROLE_MESSAGE?.[currentEditingUser?.role_group?.[0]?.name]?.[newRole?.value]?.(
              featureAccess?.licenseStatus?.isLicenseValid
            )}
          </div>
        </ModalBase>
      )}
      <div className="animation-fade invite-user-drawer-wrap">
        <div className="drawer-card-wrap invite-user-drawer-wrap">
          <div className="card-header">
            <div className="card-header-inner-wrap">
              <h3 className="tj-text-lg tj-text font-weight-500" data-cy="add-users-card-title">
                {!isEditing
                  ? t('header.organization.menus.manageUsers.addNewUser', 'Add new user')
                  : 'Edit user details'}
              </h3>
              <div
                onClick={() => {
                  onCancel();
                  onClose();
                }}
                style={{ cursor: 'pointer' }}
                data-cy="close-button"
              >
                <SolidIcon name="remove" width="16" />
              </div>
            </div>
            {!isEditing && (
              <div className="tj-drawer-tabs-container-outer">
                <div className="tj-drawer-tabs-container">
                  <button
                    className={`tj-drawer-tabs-btn tj-text-xsm ${activeTab == 1 && 'tj-drawer-tabs-btn-active'}`}
                    onClick={() => setActiveTab(1)}
                    data-cy="button-invite-with-email"
                  >
                    <SolidIcon name="mail" width="14" fill={activeTab == 1 ? '#11181C' : '#687076'} />
                    <span> Invite with email</span>
                  </button>
                  <button
                    className={`tj-drawer-tabs-btn  tj-text-xsm ${activeTab == 2 && 'tj-drawer-tabs-btn-active'}`}
                    onClick={() => setActiveTab(2)}
                    data-cy="button-upload-csv-file"
                  >
                    <SolidIcon name="fileupload" width="14" fill={activeTab == 2 ? '#11181C' : '#687076'} />
                    <span>Upload CSV file</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          {activeTab == 1 ? (
            <div className="manage-users-drawer-content">
              <LicenseBanner classes="mb-3" limits={userLimits} type="users" size="small" />
              <div className={`invite-user-by-email ${isEditing && 'enable-edit-fields'}`}>
                <form
                  onSubmit={isEditing ? handleEditUser : handleCreateUser}
                  noValidate
                  className="invite-email-body"
                  id="inviteByEmail"
                >
                  <label className="form-label" data-cy="name-label">
                    Name
                  </label>
                  <div className="form-group mb-3 ">
                    <ToolTip
                      delay={{ show: '0', hide: '0' }}
                      placement="bottom"
                      message="Only user can edit their name"
                      show={isEditing}
                    >
                      <div className="tj-app-input">
                        <input
                          type="text"
                          className={cx(
                            { disabled: isEditing, 'input-error-border': errors['fullName'] },
                            'form-control'
                          )}
                          placeholder={t('header.organization.menus.manageUsers.enterFullName', 'Enter full name')}
                          name="fullName"
                          onChange={changeNewUserOption.bind(this, 'fullName')}
                          value={fields['fullName']}
                          data-cy="name-input"
                          disabled={isEditing}
                        />
                        <span className="text-danger" data-cy="error-message-fullname">
                          {errors['fullName']}
                        </span>
                      </div>
                    </ToolTip>
                  </div>
                  <div className="form-group mb-3 ">
                    <label className="form-label" data-cy="email-label">
                      {t('header.organization.menus.manageUsers.emailAddress', 'Email Address')}
                    </label>
                    <ToolTip
                      delay={{ show: '0', hide: '0' }}
                      placement="bottom"
                      message="Cannot edit user email address"
                      show={isEditing}
                    >
                      <div className="tj-app-input">
                        <input
                          type="text"
                          className={cx('form-control', { disabled: isEditing, 'input-error-border': errors['email'] })}
                          aria-describedby="emailHelp"
                          placeholder={t('header.organization.menus.manageUsers.enterEmail', 'Enter Email')}
                          name="email"
                          onChange={changeNewUserOption.bind(this, 'email')}
                          value={fields['email']}
                          data-cy="email-input"
                          disabled={isEditing}
                        />
                        <span className="text-danger" data-cy="error-message-email">
                          {errors['email']}
                        </span>
                      </div>
                    </ToolTip>
                  </div>
                  <div className="form-group mb-3 manage-groups-invite-form" data-cy="user-group-select">
                    <label className="form-label" data-cy="user-group-label">
                      {isEditing
                        ? 'User groups'
                        : t('header.organization.menus.manageUsers.selectGroup', 'Select groups')}
                    </label>
                    <UserGroupsSelect value={selectedGroups} onChange={onChangeHandler} options={groupedOptions} />
                  </div>
                  <UserMetadata
                    t={t}
                    isEditing={isEditing}
                    userMetadata={userMetadata}
                    metadataChanged={metadataChanged}
                  />
                </form>
              </div>
            </div>
          ) : (
            <div className="manage-users-drawer-content-bulk">
              <LicenseBanner limits={userLimits} type="users" size="small" />
              <div className="manage-users-drawer-content-bulk-download-prompt">
                <div className="user-csv-template-wrap">
                  <div>
                    <SolidIcon name="information" fill="#F76808" width="26" />
                  </div>
                  <div>
                    <p className="tj-text tj-text-sm" data-cy="helper-text-bulk-upload">
                      Download the template to add user details or format your file in the same way as the template.
                      Files in any other format may not be recognized.{' '}
                    </p>
                    <ButtonSolid
                      href={`${window.public_config?.TOOLJET_HOST}${
                        window.public_config?.SUB_PATH ? window.public_config?.SUB_PATH : '/'
                      }assets/csv/sample_upload.csv`}
                      download="sample_upload.csv"
                      variant="tertiary"
                      className="download-template-btn"
                      as={'a'}
                      leftIcon="folderdownload"
                      iconWidth="13"
                      data-cy="button-download-template"
                    >
                      Download Template
                    </ButtonSolid>
                  </div>
                </div>
              </div>
              <FileDropzone
                handleClick={handleClick}
                hiddenFileInput={hiddenFileInput}
                errors={errors}
                handleFileChange={handleFileChange}
                inviteBulkUsers={inviteBulkUsers}
                onDrop={onDrop}
                setFileUpload={setFileUpload}
              />
            </div>
          )}
          <div className="manage-users-drawer-footer">
            <ButtonSolid
              data-cy="cancel-button"
              onClick={() => {
                onCancel();
                onClose();
              }}
              variant="tertiary"
            >
              {t('globals.cancel', 'Cancel')}
            </ButtonSolid>

            <ButtonSolid
              form={activeTab == 1 ? 'inviteByEmail' : 'inviteBulkUsers'}
              type="submit"
              variant="primary"
              disabled={uploadingUsers || creatingUser || !isEdited() || (activeTab !== 1 && !fileUpload)}
              data-cy={activeTab == 1 ? 'button-invite-users' : 'button-upload-users'}
              leftIcon={activeTab == 1 ? 'sent' : 'fileupload'}
              width="20"
              fill={'#FDFDFE'}
              isLoading={uploadingUsers || creatingUser}
            >
              {!isEditing
                ? activeTab == 1
                  ? t('header.organization.menus.manageUsers.inviteUsers', 'Invite Users')
                  : 'Upload users'
                : 'Update'}
            </ButtonSolid>
          </div>
        </div>
      </div>
    </div>
  );
}
export default InviteUsersForm;
