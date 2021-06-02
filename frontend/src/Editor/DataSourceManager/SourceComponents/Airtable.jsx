import React from 'react';
import Button from 'react-bootstrap/Button';

export const Airtable = ({
  optionchanged, createDataSource, options, isSaving
}) => {
  return (
    <div>
      <div className="row">
        <div className="col-md-12">
          <label className="form-label">
            API key
            <small className="text-green mx-2">
              <img className="mx-2 encrypted-icon" src="/assets/images/icons/padlock.svg" width="12" height="12" />
              Encrypted
            </small>
          </label>
          <input
            type="password"
            className="form-control"
            onChange={(e) => optionchanged('api_key', e.target.value)}
            value={options.api_key.value}
          />
          <small className="text-muted">
            For generating API key, visit:{' '}
            <a href="https://airtable.com/account" target="_blank" rel="noreferrer">
              Airtable account page
            </a>
          </small>
        </div>
      </div>
      <div className="row mt-3">
        <div className="col"></div>
        <div className="col-auto">
          <Button className="m-2" disabled={isSaving} variant="primary" onClick={createDataSource}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
};
