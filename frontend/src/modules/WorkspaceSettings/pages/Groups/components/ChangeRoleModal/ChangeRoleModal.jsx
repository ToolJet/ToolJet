import React from 'react';
import ModalBase from '@/_ui/Modal';
import User from '@/_ui/Icon/solidIcons/User';
import Lock from '@/_ui/Icon/solidIcons/Lock';
import '../../resources/styles/group-permissions.styles.scss';

function ChangeRoleModal({
  showAutoRoleChangeModal,
  autoRoleChangeModalList,
  autoRoleChangeMessageType,
  handleAutoRoleChangeModalClose,
  handleConfirmation,
  darkMode,
  isLoading,
}) {
  const isAddUserScenario = autoRoleChangeMessageType === 'USER_ROLE_CHANGE_ADD_USERS';

  const renderModalContent = () => {
    if (isAddUserScenario && autoRoleChangeModalList.length === 1) {
      return (
        <div className="role-change-modal-content">
          <div className="modal-icon-container">
            <User fill="#E54D2E" width="40" />
          </div>
          <h3 className="modal-title">Cannot add an end-user to this group</h3>
          <div className="modal-description">
            <p>The user(s) below are end-user and can only be granted permissions in the scope of their role.</p>
            <p>
              Kindly change their user role to be able to add them.{' '}
              <a
                href="https://docs.tooljet.com/docs/user-management/role-based-access/user-roles#permissions-for-user-roles"
                style={{ textDecoration: 'underline' }}
              >
                Learn more
              </a>
            </p>
          </div>
          <ol
            style={{
              fontSize: '14px',
              paddingBottom: '4px',
              margin: '8px 0',
              maxHeight: '140px',
              overflowY: 'auto',
            }}
          >
            {autoRoleChangeModalList.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ol>
        </div>
      );
    }

    return (
      <div className="role-change-modal-content">
        <div className="modal-icon-container">
          <Lock fill="#E54D2E" width="40" />
        </div>
        <div style={{ width: '100%' }}>
          <h3 className="modal-title">Cannot add this permission to the group</h3>
          <div className="modal-description">
            <p>
              End-users can only be granted permissions in the scope of their role.{' '}
              <a
                href="https://docs.tooljet.com/docs/user-management/role-based-access/user-roles#permissions-for-user-roles"
                style={{ textDecoration: 'underline' }}
              >
                Learn more
              </a>
            </p>
            <p>If you wish to add this permission, kindly change the following users role from end-user to builder -</p>
          </div>
          <ol
            style={{
              fontSize: '14px',
              paddingBottom: '4px',
              margin: '8px 0',
              maxHeight: '140px',
              overflowY: 'auto',
            }}
          >
            {autoRoleChangeModalList.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ol>
        </div>
      </div>
    );
  };

  const renderUserChangeTitle = () => {
    return (
      <div className="my-3" data-cy="modal-title">
        <span className="tj-text-md font-weight-500">{isAddUserScenario ? 'Add user(s)' : 'Change in user role'}</span>
      </div>
    );
  };

  return (
    <ModalBase
      title={renderUserChangeTitle()}
      handleConfirm={handleConfirmation}
      confirmBtnProps={{ title: 'Continue', tooltipMessage: false }}
      show={showAutoRoleChangeModal}
      handleClose={handleAutoRoleChangeModalClose}
      darkMode={darkMode}
      isLoading={isLoading}
      className="edit-role-confirm role-change-modal"
    >
      {renderModalContent()}
    </ModalBase>
  );
}

export default ChangeRoleModal;
