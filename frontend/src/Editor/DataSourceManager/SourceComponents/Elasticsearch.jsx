import React from 'react';

export const Elasticsearch = ({
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
    </div>
  );
};
