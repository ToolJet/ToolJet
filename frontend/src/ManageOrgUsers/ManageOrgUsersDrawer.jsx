import React from 'react';
import Drawer from '@/_ui/Drawer';
import InviteUsersForm from './InviteUsersForm';

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
      />
    </Drawer>
  );
};

export default ManageOrgUsersDrawer;
