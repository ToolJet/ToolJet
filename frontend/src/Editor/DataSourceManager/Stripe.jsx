import React from 'react';
import Button from 'react-bootstrap/Button';

export const Stripe = ({ optionchanged, createDataSource, options, isSaving  }) => {

    return (
        <div>
            <div className="row">
                <div className="col-md-12">
                    <label class="form-label">
                        API key
                        <small className="text-green mx-2">
                            <img className="mx-2" src="https://www.svgrepo.com/show/12694/padlock.svg" width="12" height="12"/>
                            Encrypted
                        </small>
                    </label>
                    <input type="text" class="form-control" onChange={(e) => optionchanged('api_key', e.target.value)} value={options.api_key.value} />
                    <small className="text-muted">For creating API keys, visit: <a href="https://dashboard.stripe.com/account/apikeys" target="_blank" rel="noreferrer">Stripe Developers</a></small>
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
                    <Button className="m-2" disabled={isSaving} variant="primary" onClick={createDataSource}>
                        {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
