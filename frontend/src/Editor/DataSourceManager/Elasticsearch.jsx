import React from 'react';
import Button from 'react-bootstrap/Button';

export const Elasticsearch = ({ optionchanged, createDataSource, options, isSaving  }) => {

    return (
        <div>
            <div className="row">
                <div className="col-md-9">
                    <label class="form-label">Host</label>
                    <input type="text" class="form-control" onChange={(e) => optionchanged('host', e.target.value)} value={options.host.value} />
                </div>
                <div className="col-md-3">
                    <label class="form-label">Port</label>
                    <input type="text" class="form-control" onChange={(e) => optionchanged('port', e.target.value)}  value={options.port.value} />
                </div>
            </div>
        </div>
    );
}
