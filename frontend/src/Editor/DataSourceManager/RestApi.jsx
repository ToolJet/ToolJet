import React, {useState, useEffect, useCallback} from 'react';
import Button from 'react-bootstrap/Button';
import SelectSearch, { fuzzySearch } from 'react-select-search';

export const RestApi = ({ optionchanged, createDataSource, testDataSource, options  }) => {

    const [authType, setAuthType] = useState(options.auth_type);

    useEffect(() => {
        setAuthType(options.auth_type);
    }, [options.auth_type]);

    const [grantType, setGrantType] = useState(options.grant_type);

    useEffect(() => {
        setGrantType(options.grant_type);
    }, [options.grant_type]);

    const [addTokenTo, setAddTokenTo] = useState(options.add_token_to);

    useEffect(() => {
        setAddTokenTo(options.add_token_to);
    }, [options.add_token_to]);

    function  addNewKeyValuePair(option) {
        const newPairs = [...options[option], ['', '']] ;
        optionchanged(option, newPairs);
    }

    function removeKeyValuePair(option, index) {
        options[option].splice(index, 1);
        optionchanged(option, options[option]);
    }

    function keyValuePairValueChanged(e, key_index, option, index) {
        const value = e.target.value;
        options[option][index][key_index] = value;
        optionchanged(option, options[option]);
    }

    return (
        <div>
            <div className="row">
                <div className="col-md-12">
                    <label className="form-label">URL</label>
                    <input 
                        type="text" 
                        placeholder="https://api.example.com/v1/"
                        className="form-control" 
                        onChange={(e) => optionchanged('url', e.target.value)} 
                        value={options.url} 
                    />
                </div>
            </div>
            <div className="row mt-3">
                <div class="row g-2">
                    <div class="row">
                        <div className="col">
                            <label class="form-label pt-2">Headers</label>
                        </div>
                        <div className="col-auto">
                            <button 
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => addNewKeyValuePair('headers')}
                            >
                                + Add new
                            </button>
                        </div>
                    </div>
                    <div className="col-md-12 mb-3">
                        {options.headers.map((pair, index) => 
                            <div class="input-group">
                                <input 
                                    type="text" 
                                    value={pair[0]} 
                                    class="form-control"  
                                    placeholder="key"  
                                    autocomplete="off" 
                                    onChange={(e) => keyValuePairValueChanged(e, 0, 'headers', index)}
                                />
                                <input 
                                    type="text" 
                                    value={pair[1]} 
                                    class="form-control"  
                                    placeholder="value"  
                                    autocomplete="off" 
                                    onChange={(e) => keyValuePairValueChanged(e, 1, 'headers', index)}
                                />
                                <span 
                                    class="input-group-text"
                                    role="button"
                                    onClick={(e) => { removeKeyValuePair('headers', index); } }
                                >
                                    x
                                </span>
                            </div>
                        )}
                       
                    </div>
                </div>
                <label className="form-label text-muted">Authentication Type</label>
                <SelectSearch 
                    options={[
                        {name: 'None', value: 'none'},
                        {name: 'OAuth 2.0', value: 'oauth2'}
                    ]}
                    value={options.auth_type} 
                    search={false}
                    onChange={(value) => { optionchanged('auth_type', value)}}
                    filterOptions={fuzzySearch}
                    placeholder="Select.." 
                />
            </div>

            {(authType === 'oauth2') && 
                <div>
                    <hr/>
                    <h3 className="text-muted">Authentication</h3>
                    <div className="row mt-3">
                        <label className="form-label text-muted">Grant Type</label>
                        <SelectSearch 
                            options={[
                                {name: 'Client Credentials', value: 'client_credentials'},
                                {name: 'Authorization Code', value: 'auth_code'}
                            ]}
                            value={options.grant_type} 
                            search={false}
                            onChange={(value) => { optionchanged('grant_type', value)}}
                            filterOptions={fuzzySearch}
                            placeholder="Select.." 
                        />

                        <label className="form-label text-muted mt-3">Add Access Token To</label>
                        <SelectSearch 
                            options={[
                                {name: 'Request Header', value: 'header'},
                                {name: 'Request URL', value: 'url'}
                            ]}
                            value={options.add_token_to} 
                            search={false}
                            onChange={(value) => { optionchanged('add_token_to', value)}}
                            filterOptions={fuzzySearch}
                            placeholder="Select.." 
                        />

                        {(addTokenTo === 'header') && 
                            <div className="col-md-12">
                                <label className="form-label text-muted mt-3">Header Prefix</label>
                                <input type="text" className="form-control" onChange={(e) => optionchanged('header_prefix', e.target.value)} value={options.header_prefix} />
                            </div>
                        }
                    </div>
        
                    <div className="col-md-12">
                        <label className="form-label text-muted mt-3">Access Token URL</label>
                        <input 
                            type="text"
                            placeholder="https://api.example.com/oauth/token"
                            className="form-control"
                            onChange={(e) => optionchanged('access_token_url', e.target.value)}
                            value={options.access_token_url}
                        />
                    </div>

                    <div className="col-md-12">
                        <label className="form-label text-muted mt-3">Client ID</label>
                        <input type="text" className="form-control" onChange={(e) => optionchanged('client_id', e.target.value)} value={options.client_id} />
                    </div>

                    <div className="col-md-12">
                        <label className="form-label text-muted mt-3">
                            Client Secret 
                            <small className="text-green mx-2">
                                <img className="mx-2" src="https://www.svgrepo.com/show/12694/padlock.svg" width="12" height="12"/>
                                Encrypted
                            </small>
                        </label>
                        <input type="text" className="form-control" onChange={(e) => optionchanged('client_secret', e.target.value)} value={options.client_secret} />
                    </div>

                    <div className="col-md-12">
                        <label className="form-label text-muted mt-3">Scope(s)</label>
                        <input type="text" className="form-control" onChange={(e) => optionchanged('scopes', e.target.value)} value={options.scopes} />
                    </div>

                    {(grantType === 'auth_code') && 
                        <div>
                            <div className="col-md-12">
                                <label className="form-label text-muted mt-3">Authorization URL</label>
                                <input 
                                    type="text" 
                                    placeholder="https://api.example.com/oauth/authorize"
                                    className="form-control" 
                                    onChange={(e) => optionchanged('auth_url', e.target.value)} 
                                    value={options.auth_url} 
                                />
                            </div>

                            <div class="row mt-3">
                                <div className="col">
                                    <label class="form-label pt-2">Custom Authentication Parameters</label>
                                </div>
                                <div className="col-auto">
                                    <button 
                                        className="btn btn-outline-primary btn-sm"
                                        onClick={() => addNewKeyValuePair('custom_auth_params')}
                                    >
                                        + Add new
                                    </button>
                                </div>
                            </div>
                            <div className="col-md-12 mb-3">
                                {options.custom_auth_params.map((pair, index) => 
                                    <div class="input-group">
                                        <input 
                                            type="text" 
                                            value={pair[0]} 
                                            class="form-control"  
                                            placeholder="key"  
                                            autocomplete="off" 
                                            onChange={(e) => keyValuePairValueChanged(e, 0, 'custom_auth_params', index)}
                                        />
                                        <input 
                                            type="text" 
                                            value={pair[1]} 
                                            class="form-control"  
                                            placeholder="value"  
                                            autocomplete="off" 
                                            onChange={(e) => keyValuePairValueChanged(e, 1, 'custom_auth_params', index)}
                                        />
                                        <span 
                                            class="input-group-text"
                                            role="button"
                                            onClick={(e) => { removeKeyValuePair('custom_auth_params', index); } }
                                        >
                                            x
                                        </span>
                                    </div>
                                )}
                            
                            </div>

                            <label className="form-label text-muted mt-3">Client Authentication</label>
                            <SelectSearch 
                                options={[
                                    {name: 'Send as Basic Auth header', value: 'header'},
                                    {name: 'Send client credentials in body ', value: 'body'}
                                ]}
                                value={options.client_auth} 
                                search={false}
                                onChange={(value) => { optionchanged('client_auth', value)}}
                                filterOptions={fuzzySearch}
                                placeholder="Select.." 
                            />
                        </div>
                    }
                </div>
            }

            <div className="row mt-3">
                <div className="col">

                </div>
                <div className="col-auto">
                    <Button className="m-2" variant="primary" onClick={createDataSource}>
                        Save
                    </Button>
                </div>
            </div>
        </div>
    );
}
