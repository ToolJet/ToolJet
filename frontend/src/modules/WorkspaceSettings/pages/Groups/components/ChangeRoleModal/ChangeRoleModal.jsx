import React from 'react';
import { useTranslation } from 'react-i18next';
import ModalBase from '@/_ui/Modal';
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
  const { t } = useTranslation();

  const renderUserChangeMessage = (type) => {
    const changePermissionMessage = (
      <p className="tj-text-sm">
        Granting this permission to the user group will result in a role change for the following user(s) from{' '}
        <b>end-users</b> to <b>builders</b>. Are you sure you want to continue?
      </p>
    );
    const addUserMessage = (
      <p className="tj-text-sm">
        Adding the following user(s) to this group will change their default group from <b>end-users</b> to{' '}
        <b>builders</b>. Are you sure you want to continue?
      </p>
    );
    const message = type === 'USER_ROLE_CHANGE_ADD_USERS' ? addUserMessage : changePermissionMessage;
    return message;
  };

  const renderUserChangeTitle = (type) => {
    const addUserTitle = (
      <div className="my-3" data-cy="modal-title">
        <span className="tj-text-md font-weight-500">Add user(s)</span>
      </div>
    );
    const updatePermissionTitile = (
      <div className="my-3" data-cy="modal-title">
        <span className="tj-text-md font-weight-500"> Change in user role</span>
      </div>
    );
    const message = type === 'USER_ROLE_CHANGE_ADD_USERS' ? addUserTitle : updatePermissionTitile;
    return message;
  };

  return (
    <ModalBase
      title={renderUserChangeTitle(autoRoleChangeMessageType)}
      handleConfirm={handleConfirmation}
      confirmBtnProps={{ title: 'Continue', tooltipMessage: false }}
      show={showAutoRoleChangeModal}
      handleClose={handleAutoRoleChangeModalClose}
      darkMode={darkMode}
      isLoading={isLoading}
      className="edit-role-confirm"
    >
      <>
        {renderUserChangeMessage(autoRoleChangeMessageType)}
        <p></p>
        <div className="item-list">
          {autoRoleChangeModalList.map((item, index) => (
            <div key={index}>
              <span className="tj-text-sm">{`${index + 1}. ${item}`}</span>
            </div>
          ))}
        </div>
      </>
    </ModalBase>
  );
}

export default ChangeRoleModal;
