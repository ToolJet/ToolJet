import React from 'react';
import { authenticationService, userService } from '@/_services';
import 'react-toastify/dist/ReactToastify.css';
import { Header } from '@/_components';
import { toast } from 'react-toastify';

function SettingsPage(props) {
  const [firstName, setFirstName] = React.useState(authenticationService.currentUserValue.first_name)
  const [lastName, setLastName] = React.useState(authenticationService.currentUserValue.last_name)
  const [password, setPassword] = React.useState('')
  const [updateInProgress, setUpdateInProgress] = React.useState(false)

  const updateDetails = async () => {
    setUpdateInProgress(true);
    const updatedDetails = await userService.updateCurrentUser(firstName, lastName, password);
    authenticationService.updateCurrentUserDetails(updatedDetails)
    toast.success('Details updated!', { hideProgressBar: true, autoClose: 3000 });
    setUpdateInProgress(false);
  }

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
            <div class="card">
              <div class="card-header">
                <h3 class="card-title">Profile</h3>
              </div>
              <div class="card-body">
                <div className="row">
                  <div className="col">
                    <div class="mb-3">
                      <label class="form-label">First name</label>
                      <input
                        type="text"
                        class="form-control"
                        name="first-name"
                        placeholder="Enter first name"
                        value={firstName}
                        onChange={event => setFirstName(event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col">
                    <div class="mb-3">
                      <label class="form-label">Last name</label>
                      <input
                        type="text"
                        class="form-control"
                        name="last-name"
                        placeholder="Enter last name"
                        value={lastName}
                        onChange={event => setLastName(event.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                        type="password"
                        className="form-control"
                        name="last-name"
                        placeholder="Enter new password if you wish to change it"
                        value={password}
                        onChange={event => setPassword(event.target.value)}
                      />
                </div>
                <a
                  href="#"
                  className={"btn btn-primary" + (updateInProgress ? '  btn-loading' : '')}
                  onClick={updateDetails}
                  >
                    Update
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
