import React from 'react';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { DYNAMODB_REGIONS } from './constants';

export const Dynamodb = ({ optionchanged, options }) => {
  return (
    <div>
      <div className="row">
        <div className="col-md-5 mb-2">
          <label className="form-label">
            Region
          </label>
          <SelectSearch
              options={DYNAMODB_REGIONS.map((region) => {
                return { name: region[0], value: region[1]}
              })}
              value={options.region.value}
              search={true}
              onChange={(value) => {
                optionchanged('region', value);
              }}
              filterOptions={fuzzySearch}
              placeholder="Select.."
            />
        </div>
        <div className="col-md-12 mb-2">
          <label className="form-label">
            Access key
          </label>
          <input
            type="text"
            className="form-control"
            onChange={(e) => {
              optionchanged('access_key', e.target.value);
            }}
            value={options.access_key.value}
          />
        </div>
        <div className="col-md-12">
          <label className="form-label">
            Secret key
            <small className="text-green mx-2">
              <img className="mx-2" src="https://www.svgrepo.com/show/12694/padlock.svg" width="12" height="12" />
              Encrypted
            </small>
          </label>
          <input
            type="text"
            className="form-control"
            onChange={(e) => {
              optionchanged('secret_key', e.target.value);
            }}
            value={options.secret_key.value}
          />
        </div>
      </div>
    </div>
  );
};
