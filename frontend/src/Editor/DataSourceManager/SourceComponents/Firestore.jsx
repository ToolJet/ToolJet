import React from 'react';

export const Firestore = ({ optionchanged, options }) => {
  return (
    <div>
      <div className="row">
        <div className="col-md-12">
          <label className="form-label">
            Private Key
            <small className="text-green mx-2">
              <img className="mx-2 encrypted-icon" src="https://www.svgrepo.com/show/12694/padlock.svg" width="12" height="12" />
              Encrypted
            </small>
          </label>
          <textarea
            rows="15"
            className="form-control w-100"
            onChange={(e) => {
              optionchanged('gcp_key', e.target.value);
            }}
            value={options.gcp_key.value}
          ></textarea>
        </div>
      </div>
    </div>
  );
};
