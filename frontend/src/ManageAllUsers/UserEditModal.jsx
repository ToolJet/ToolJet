import React from 'react';
import Modal from 'react-bootstrap/Modal';

const UserEditModal = ({ showModal, darkMode, hideModal, translator, updatingUser, isUpdatingUser, updateUser }) => {
  const [options, setOptions] = React.useState({});

  React.useEffect(() => {
    if (updatingUser) {
      setOptions({ userType: updatingUser.user_type });
    }
  }, [updatingUser]);

  const changeOptions = (name, value) => {
    setOptions({
      ...options,
      [name]: name === 'userType' ? (value ? 'instance' : 'workspace') : value,
    });
  };

  return (
    <>
      <Modal
        show={showModal}
        size="md"
        backdrop="static"
        centered={true}
        keyboard={true}
        onEscapeKeyDown={hideModal}
        className={`${darkMode && 'dark-mode'} user-edit-modal`}
      >
        <Modal.Header>
          <Modal.Title className="text-center" data-cy="modal-title">
            {translator('header.organization.menus.manageAllUsers.updateUser', 'Update User')}:{' '}
            {`${updatingUser?.name} (${updatingUser?.email})`}
          </Modal.Title>
          <div className="close-button cursor-pointer" onClick={hideModal} data-cy="modal-close-button">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon icon-tabler icon-tabler-x"
              width="44"
              height="44"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke={darkMode ? '#fff' : '#2c3e50'}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        </Modal.Header>

        <Modal.Body>
          <form noValidate>
            <div className="form-group mb-3">
              <label className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  onChange={(event) => changeOptions('userType', event.target.checked)}
                  checked={options?.userType === 'instance'}
                  data-cy="super-admin-form-check-input"
                />
                <span className="form-check-label" data-cy="super-admin-form-check-label">
                  {translator(
                    'header.organization.menus.manageSSO.generalSettings.superadminSwitch',
                    'Make the user super admin'
                  )}
                </span>
              </label>
            </div>

            <div className="form-footer">
              <button type="button" onClick={hideModal} className="btn btn-light mr-2" data-cy="cancel-button">
                {translator('globals.close', 'Close')}
              </button>
              <button
                type="button"
                className={`btn mx-2 btn-primary ${isUpdatingUser ? 'btn-loading' : ''}`}
                disabled={isUpdatingUser}
                onClick={() => updateUser(options)}
                data-cy="save-button"
              >
                {translator('globals.save', 'Save')}
              </button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default UserEditModal;
