import React from 'react';
import Button from 'react-bootstrap/Button';

export const Firestore = ({ optionchanged, createDataSource, options  }) => {

    return (
        <div>
            <div className="row">
                <div className="col-md-12">
                    <label class="form-label">Private Key</label>
                    <textarea 
                        rows="15"
                        className="form-control w-100"
                        onChange={(e) => optionchanged('gcp_key', e.target.gcp_key)}
                        value={options.gcp_key}>
                    </textarea>
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
