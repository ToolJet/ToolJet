import React from 'react';
import Button from 'react-bootstrap/Button';

export const Elasticsearch = ({ optionchanged, createDataSource, options  }) => {

    return (
        <div>
            <div className="row">
                <div className="col-md-9">
                    <label class="form-label">Host</label>
                    <input type="text" class="form-control" onChange={(e) => optionchanged('host', e.target.value)} value={options.host} />
                </div>
                <div className="col-md-3">
                    <label class="form-label">Port</label>
                    <input type="text" class="form-control" onChange={(e) => optionchanged('port', e.target.value)}  value={options.port} />
                </div>
            </div>
            <div className="row mt-3">
                <div className="col-md-4">
                    <label class="form-label">Username</label>
                    <input type="text" class="form-control" onChange={(e) => optionchanged('username', e.target.value)}  value={options.username} />
                </div>
                <div className="col-md-4">
                    <label class="form-label">Password</label>
                    <input type="text" class="form-control" onChange={(e) => optionchanged('password', e.target.value)}  value={options.password} />
                </div>
            </div>
            <div className="row mt-3">
                <div className="col">

                </div>
                <div className="col-auto">
                    <Button className="m-2" variant="light" onClick={() => hideModal()} >
                        Cancel
                    </Button>
                    <Button className="m-2" variant="success" onClick={() => hideModal()} >
                        Test
                    </Button>
                    <Button className="m-2" variant="primary" onClick={createDataSource}>
                        Save
                    </Button>
                </div>
            </div>
        </div>
    );
}
