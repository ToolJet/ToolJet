import React, { useEffect, useState } from 'react';
import Drawer from '@/_ui/Drawer';
import InviteUsersForm from './InviteUsersForm';
import { groupPermissionV2Service } from '@/_services';
import { authenticationService } from '@/_services/authentication.service';
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
  darkMode,
}) => {
  const [groups, setGroups] = useState([]);

  const isEditing = userDrawerMode === USER_DRAWER_MODES.EDIT;

  const humanizeifDefaultGroupName = (groupName) => {
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

  const fetchOrganizations = () => {
    const { current_organization_id } = authenticationService.currentSessionValue;

    groupPermissionV2Service
      .getGroups()
      .then(({ groupPermissions }) => {
        const orgGroups = groupPermissions
          .filter((group) => group.organizationId === current_organization_id)
          .map(({ name, type, id }) => ({
            label: humanizeifDefaultGroupName(name),
            name: humanizeifDefaultGroupName(name),
            value: name,
            groupType: type,
            id: id,
          }));
        setGroups(orgGroups);
      })
      .catch((error) => {
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
        darkMode={darkMode}
      />
    </Drawer>
  );
};

export default ManageOrgUsersDrawer;
