import React, { useEffect, useState } from 'react';
import Drawer from '@/_ui/Drawer';
import InviteUsersForm from './InviteUsersForm';
import { groupPermissionService } from '@/_services';
import { authenticationService } from '../_services/authentication.service';

const ManageOrgUsersDrawer = ({
  isInviteUsersDrawerOpen,
  setIsInviteUsersDrawerOpen,
  createUser,
  changeNewUserOption,
  errors,
  fields,
  handleFileChange,
  uploadingUsers,
  onCancel,
  inviteBulkUsers,
}) => {
  const [groups, setGroups] = useState([]);

  const humanizeifDefaultGroupName = (groupName) => {
    switch (groupName) {
      case 'all_users':
        return 'All Users';

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
            name: humanizeifDefaultGroupName(group),
            value: group,
          }));
        setGroups(orgGroups);
      })
      .catch((error) => {
        setGroups([]);
      });
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  return (
    <Drawer
      disableFocus={true}
      isOpen={isInviteUsersDrawerOpen}
      onClose={() => setIsInviteUsersDrawerOpen(false)}
      position="right"
    >
      <InviteUsersForm
        createUser={createUser}
        changeNewUserOption={changeNewUserOption}
        errors={errors}
        fields={fields}
        handleFileChange={handleFileChange}
        uploadingUsers={uploadingUsers}
        onCancel={onCancel}
        inviteBulkUsers={inviteBulkUsers}
        onClose={() => setIsInviteUsersDrawerOpen(false)}
        groups={groups}
      />
    </Drawer>
  );
};

export default ManageOrgUsersDrawer;
