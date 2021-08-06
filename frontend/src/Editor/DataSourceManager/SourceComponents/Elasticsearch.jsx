import React from 'react';
import SelectSearch, { fuzzySearch } from 'react-select-search';

export const Elasticsearch = ({
  optionchanged, options
}) => {
  return (
    <div>
      <div className="row">
        <div className="col-md-2 mb-2">
          <label className="form-label">Scheme</label>
          <SelectSearch
            options={[
              { name: 'http', value: 'http' },
              { name: 'https', value: 'https' },
            ]}
            value={options.scheme.value}
            search={true}
            onChange={(value) => {
              optionchanged('scheme', value);
            }}
            filterOptions={fuzzySearch}
            placeholder="Select.."
          />
        </div>
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
        <div className="row mt-3">
          <div className="col-md-6">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              onChange={(e) => optionchanged('username', e.target.value)}
              value={options.username.value}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">
              Password
              <small className="text-green mx-2">
                <img className="mx-2 encrypted-icon" src="/assets/images/icons/padlock.svg" width="12" height="12" />
                Encrypted
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
    </div>
  );
};
