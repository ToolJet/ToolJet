import React from 'react';

export const Mysql = ({ optionchanged, options }) => {
  return (
    <div>
      <div className="row">
        <div className="col-md-7">
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
        <div className="col-md-2">
          <label className="form-label">SSL</label>
          <label className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              defaultChecked={options.ssl_enabled.value}
              onChange={() => optionchanged('ssl_enabled', !options.ssl_enabled.value)}
            />
          </label>
        </div>
      </div>
      <div className="row mt-3">
        <label className="form-label">Database Name</label>
        <div className="col-md-4">
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
              <img
                className="mx-2 encrypted-icon encrypted-icon"
                src="/assets/images/icons/padlock.svg"
                width="12"
                height="12"
              />
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
    </div>
  );
};
