import React from 'react';
import { authenticationService, userService } from '@/_services';
import 'react-toastify/dist/ReactToastify.css';
import { Header } from '@/_components';
import { toast } from 'react-toastify';

function SettingsPage(props) {
  const [firstName, setFirstName] = React.useState(authenticationService.currentUserValue.first_name);
  const [lastName, setLastName] = React.useState(authenticationService.currentUserValue.last_name);
  const [currentpassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [updateInProgress, setUpdateInProgress] = React.useState(false);
  const [passwordChangeInProgress, setPasswordChangeInProgress] = React.useState(false);

  const updateDetails = async () => {
    setUpdateInProgress(true);
    const updatedDetails = await userService.updateCurrentUser(firstName, lastName);
    authenticationService.updateCurrentUserDetails(updatedDetails);
    toast.success('Details updated!', {
      hideProgressBar: true,
      autoClose: 3000,
    });
    setUpdateInProgress(false);
  };

  const changePassword = async () => {
    setPasswordChangeInProgress(true);
    const response = userService.changePassword(currentpassword, newPassword);
    response
      .then(() => {
        toast.success('Password updated successfully', {
          hideProgressBar: true,
          autoClose: 3000,
        });
        setCurrentPassword('');
        setNewPassword('');
      })
      .catch(() => {
        toast.error('Please verify that you have entered the correct password', {
          hideProgressBar: true,
          autoClose: 3000,
        });
      });
    setPasswordChangeInProgress(false);
  };

  const newPasswordKeyPressHandler = async (event) => {
    if (event.key === 'Enter') {
      changePassword();
    }
  };

  return (
    <div className="wrapper">
      <Header switchDarkMode={props.switchDarkMode} darkMode={props.darkMode} />

      <div className="page-wrapper">
        <div className="container-xl">
          <div className="page-header d-print-none">
            <div className="row align-items-center">
              <div className="col">
                <div className="page-pretitle"></div>
                <h2 className="page-title">Settings</h2>
              </div>
            </div>
          </div>
        </div>

        <div className="page-body">
          <div className="container-xl">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Profile</h3>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col">
                    <div className="mb-3">
                      <label className="form-label">First name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="first-name"
                        placeholder="Enter first name"
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col">
                    <div className="mb-3">
                      <label className="form-label">Last name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="last-name"
                        placeholder="Enter last name"
                        value={lastName}
                        onChange={(event) => setLastName(event.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <a
                  href="#"
                  className={'btn btn-primary' + (updateInProgress ? '  btn-loading' : '')}
                  onClick={updateDetails}
                >
                  Update
                </a>
                {/* An !important style on theme.scss is making the last child of every .card-body color to #c3c3c3!.  */}
                {/* The div below is a placeholder to prevent it from affecting the button above.  */}
                <div></div>
              </div>
            </div>
            <br />
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Change password</h3>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col">
                    <div className="mb-3">
                      <label className="form-label">Current password</label>
                      <input
                        type="password"
                        className="form-control"
                        name="last-name"
                        placeholder="Enter current password"
                        value={currentpassword}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col">
                    <div className="mb-3">
                      <label className="form-label">New password</label>
                      <input
                        type="password"
                        className="form-control"
                        name="last-name"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        onKeyPress={newPasswordKeyPressHandler}
                      />
                    </div>
                  </div>
                </div>
                <a
                  href="#"
                  className={'btn btn-primary' + (passwordChangeInProgress ? '  btn-loading' : '')}
                  onClick={changePassword}
                >
                  Change password
                </a>
                {/* An !important style on theme.scss is making the last child of every .card-body color to #c3c3c3!.  */}
                {/* The div below is a placeholder to prevent it from affecting the button above.  */}
                <div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { SettingsPage };
