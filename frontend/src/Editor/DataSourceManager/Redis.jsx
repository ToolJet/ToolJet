import React from 'react';

export const Redis = ({ optionchanged, options }) => {

    return (
        <div>
            <div className="row">
                <div className="col-md-10">
                    <label class="form-label">Host</label>
                    <input type="text" class="form-control" onChange={(e) => optionchanged('host', e.target.value)} value={options.host.value} />
                </div>
                <div className="col-md-2">
                    <label class="form-label">Port</label>
                    <input type="text" class="form-control" onChange={(e) => optionchanged('port', e.target.value)}  value={options.port.value} />
                </div>
            </div>
            <div className="row mt-3">
                <div className="col-md-5">
                    <label class="form-label">Username</label>
                    <input type="text" class="form-control" onChange={(e) => optionchanged('username', e.target.value)}  value={options.username.value} />
                </div>
                <div className="col-md-5">
                    <label class="form-label">Password</label>
                    <input type="text" class="form-control" onChange={(e) => optionchanged('password', e.target.value)}  value={options.password.value} />
                </div>
            </div>
        </div>
    );
}
