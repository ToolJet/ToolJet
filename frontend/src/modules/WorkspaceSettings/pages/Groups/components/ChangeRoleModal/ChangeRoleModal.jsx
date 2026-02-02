import React from 'react';
import ModalBase from '@/_ui/Modal';
import SolidIcon from '@/_ui/Icon/SolidIcons';

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
          <div className="d-flex align-items-start justify-content-between">
            <div className="modal-icon-container">
              <SolidIcon fill="var(--tomato9)" name="usergear" width="40" />
            </div>
            <div onClick={handleAutoRoleChangeModalClose} className="icon-btn">
              <SolidIcon fill="var(--slate9)" name="remove" width="16" />
            </div>
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
        <div className="d-flex align-items-start justify-content-between">
          <div className="modal-icon-container" data-cy="modal-icon">
            <SolidIcon fill="var(--tomato9)" name="lock" width="40" />
          </div>
          <div onClick={handleAutoRoleChangeModalClose} className="icon-btn" data-cy="modal-close-button">
            <SolidIcon fill="var(--slate9)" name="remove" width="16" />
          </div>
        </div>
        <div style={{ width: '100%' }}>
          <h3 className="modal-title" data-cy="modal-title">Cannot add this permission to the group</h3>
          <div className="modal-description" data-cy="modal-description">
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
            data-cy="item-list"
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
      showHeader={false}
      showFooter={false}
      show={showAutoRoleChangeModal}
      handleClose={handleAutoRoleChangeModalClose}
      darkMode={darkMode}
      className="edit-role-confirm role-change-modal"
    >
      {renderModalContent()}
    </ModalBase>
  );
}

export default ChangeRoleModal;
