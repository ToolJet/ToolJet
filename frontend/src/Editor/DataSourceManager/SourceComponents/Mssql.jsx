import React from 'react';

export const Mssql = ({
  optionchanged, options
}) => {
  return (
    <div>
      <div className="row">
        <div className="col-md-9">
          <label className="form-label">Host</label>
          <input
            type="text"
            className="form-control"
            onChange={(e) => optionchanged('host', e.target.value)}
            value={options.host.value}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Port</label>
          <input
            type="text"
            className="form-control"
            onChange={(e) => optionchanged('port', e.target.value)}
            value={options.port.value}
          />
        </div>
      </div>
      <div className="row mt-3">
        <div className="col-md-4">
          <label className="form-label">Database Name</label>
          <input
            type="text"
            className="form-control"
            onChange={(e) => optionchanged('database', e.target.value)}
            value={options.database.value}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">Username</label>
          <input
            type="text"
            className="form-control"
            onChange={(e) => optionchanged('username', e.target.value)}
            value={options.username.value}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">
            Password
            <small className="text-green mx-2">
              <img className="mx-2 encrypted-icon encrypted-icon" src="/assets/images/icons/padlock.svg" width="12" height="12" />
              <span className="pt-2">Encrypted</span> 
            </small>
          </label>
          <input
            type="password"
            className="form-control"
            onChange={(e) => optionchanged('password', e.target.value)}
            value={options.password.value}
          />
        </div>
      </div>
      <div className="row">
        <div className="col-md-3">
          <div className="field mb-3">
            <label className="form-check form-switch my-2">
              <input
                className="form-check-input"
                type="checkbox"
                defaultChecked={false}
                onClick={(e) => optionchanged('Azure', e.target.value)}
              />
              Azure
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
