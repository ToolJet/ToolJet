import React from 'react';
import SelectSearch, { fuzzySearch } from 'react-select-search';

export const Mongodb = ({ optionchanged, options }) => {
  return (
    <div>
      <div className="row">
        <div className="col-md-10">
          <label className="form-label">Host</label>
          <input
            type="text"
            className="form-control"
            onChange={(e) => optionchanged('host', e.target.value)}
            value={options.host.value}
          />
        </div>
        <div className="col-md-2">
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
          <label className="form-label">Database</label>
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
          <label className="form-label">Password</label>
          <input
            type="text"
            className="form-control"
            onChange={(e) => optionchanged('password', e.target.value)}
            value={options.password.value}
          />
        </div>
      </div>
    </div>
  );
};
