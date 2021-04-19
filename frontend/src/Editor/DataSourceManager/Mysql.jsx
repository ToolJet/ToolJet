import React from 'react';
import Button from 'react-bootstrap/Button';

export const Mysql = ({ optionchanged, createDataSource, options  }) => {

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
            <div className="row mt-3">
                <div className="col-md-4">
                    <label class="form-label">Database Name</label>
                    <input type="text" class="form-control" onChange={(e) => optionchanged('database', e.target.value)}  value={options.database.value} />
                </div>
                <div className="col-md-4">
                    <label class="form-label">Username</label>
                    <input type="text" class="form-control" onChange={(e) => optionchanged('username', e.target.value)}  value={options.username.value} />
                </div>
                <div className="col-md-4">
                    <label class="form-label">
                        Password
                        <small className="text-green mx-2">
                            <img className="mx-2" src="https://www.svgrepo.com/show/12694/padlock.svg" width="12" height="12"/>
                            Encrypted
                        </small>
                    </label>
                    <input type="text" class="form-control" onChange={(e) => optionchanged('password', e.target.value)}  value={options.password.value} />
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
