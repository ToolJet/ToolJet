import React from 'react';
import SelectSearch, { fuzzySearch } from 'react-select-search';

export const Mongodb = ({ optionchanged, options }) => {
  return (
    <div>
      <div className="row mb-3">
        <SelectSearch
          options={[
            { name: 'Manual connection', value: 'manual' },
            { name: 'Connect using connection string', value: 'string' }
          ]}
          value={options.connection_type.value}
          search={false}
          onChange={(value) => {
            optionchanged('connection_type', value);
          }}
          filterOptions={fuzzySearch}
          placeholder="Select.."
        />
      </div>

      {options.connection_type.value === 'string' && 
        <div className="col-md-12">
          <label className="form-label">
            Connection string
            <small className="text-green mx-2">
              <img className="mx-2" src="https://www.svgrepo.com/show/12694/padlock.svg" width="12" height="12" />
              Encrypted
            </small>
          </label>
          <input
            type="text"
            className="form-control"
            placeholder="mongodb+srv://tooljet:<password>@cluster0.i1vq4.mongodb.net/mydb?retryWrites=true&w=majority"
            onChange={(e) => optionchanged('connection_string', e.target.value)}
            value={options.connection_string.value}
          />
        </div>
      }
      {options.connection_type.value === 'manual' && 
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
      }
    </div>
  );
};
