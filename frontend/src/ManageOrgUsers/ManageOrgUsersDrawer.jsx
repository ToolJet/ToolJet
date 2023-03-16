import React from 'react';
import Drawer from '@/_ui/Drawer';
import InviteUsersForm from './InviteUsersForm';

const ManageOrgUsersDrawer = ({ isInviteUsersDrawerOpen, setIsInviteUsersDrawerOpen, ...rest }) => {
  return (
    <>
      <Drawer
        disableFocus={true}
        isOpen={isInviteUsersDrawerOpen}
        onClose={() => setIsInviteUsersDrawerOpen(false)}
        position="right"
      >
        <InviteUsersForm {...rest} onClose={() => setIsInviteUsersDrawerOpen(false)} />
      </Drawer>
    </>
  );
};

export default ManageOrgUsersDrawer;
