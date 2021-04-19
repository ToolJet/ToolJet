import React from 'react';
import Button from 'react-bootstrap/Button';

export const Firestore = ({ optionchanged, createDataSource, options  }) => {

    return (
        <div>
            <div className="row">
                <div className="col-md-12">
                    <label class="form-label">
                        Private Key
                        <small className="text-green mx-2">
                            <img className="mx-2" src="https://www.svgrepo.com/show/12694/padlock.svg" width="12" height="12"/>
                            Encrypted
                        </small>
                    </label>
                    <textarea 
                        rows="15"
                        className="form-control w-100"
                        onChange={(e) => { optionchanged('gcp_key', e.target.value) }}
                        value={options.gcp_key.value}>
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
