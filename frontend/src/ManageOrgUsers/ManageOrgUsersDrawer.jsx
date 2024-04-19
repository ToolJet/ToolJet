import React, { useEffect, useState } from 'react';
import Drawer from '@/_ui/Drawer';
import InviteUsersForm from './InviteUsersForm';
import { groupPermissionService } from '@/_services';
import { authenticationService } from '../_services/authentication.service';
import { USER_DRAWER_MODES } from '@/_helpers/utils';

const ManageOrgUsersDrawer = ({
  isInviteUsersDrawerOpen,
  setIsInviteUsersDrawerOpen,
  manageUser,
  changeNewUserOption,
  errors,
  fields,
  handleFileChange,
  uploadingUsers,
  onCancel,
  inviteBulkUsers,
  currentEditingUser,
  userDrawerMode,
  setUserValues,
  creatingUser,
}) => {
  const [groups, setGroups] = useState([]);

  const isEditing = userDrawerMode === USER_DRAWER_MODES.EDIT;

  const humanizeifDefaultGroupName = (groupName) => {
    switch (groupName) {
      case 'all_users':
        return 'All users';

      case 'admin':
        return 'Admin';

      default:
        return groupName;
    }
  };

  const fetchOrganizations = () => {
    const { current_organization_id } = authenticationService.currentSessionValue;

    groupPermissionService
      .getGroups()
      .then(({ group_permissions }) => {
        const orgGroups = group_permissions
          .filter((group) => group.organization_id === current_organization_id)
          .map(({ group }) => ({
            label:
              group === 'all_users' && isEditing
                ? `${humanizeifDefaultGroupName(group)} (Default group)`
                : humanizeifDefaultGroupName(group),
            name: humanizeifDefaultGroupName(group),
            value: group,
            ...(group === 'all_users' && isEditing && { isDisabled: true, isFixed: true }),
          }));
        setGroups(orgGroups);
      })
      .catch((error) => {
        console.log('error', error);
        setGroups([]);
      });
  };

  useEffect(() => {
    fetchOrganizations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Drawer
      disableFocus={true}
      isOpen={isInviteUsersDrawerOpen}
      onClose={() => {
        onCancel();
        setIsInviteUsersDrawerOpen(false);
      }}
      position="right"
    >
      <InviteUsersForm
        manageUser={manageUser}
        changeNewUserOption={changeNewUserOption}
        errors={errors}
        fields={fields}
        handleFileChange={handleFileChange}
        uploadingUsers={uploadingUsers}
        onCancel={onCancel}
        inviteBulkUsers={inviteBulkUsers}
        onClose={() => setIsInviteUsersDrawerOpen(false)}
        groups={groups}
        currentEditingUser={currentEditingUser}
        userDrawerMode={userDrawerMode}
        setUserValues={setUserValues}
        creatingUser={creatingUser}
      />
    </Drawer>
  );
};

export default ManageOrgUsersDrawer;
