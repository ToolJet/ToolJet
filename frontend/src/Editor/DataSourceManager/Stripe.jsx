import React from 'react';
import Button from 'react-bootstrap/Button';

export const Stripe = ({ optionchanged, createDataSource, options  }) => {

    return (
        <div>
            <div className="row">
                <div className="col-md-12">
                    <label class="form-label">API key</label>
                    <input type="text" class="form-control" onChange={(e) => optionchanged('api_key', e.target.value)} value={options.api_key} />
                    <small className="text-muted">For creating API keys, visit: <a href="https://dashboard.stripe.com/account/apikeys" target="_blank">Stripe Developers</a></small>
                </div>
            </div>
            <div className="row mt-3">
                <div className="col"></div>
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
