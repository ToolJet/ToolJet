import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const datasourceService = {
    create,
    getAll,
    test,
    setOauth2Token,
    save,
    fetchOauth2BaseUrl
};

function getAll(appId) {
    const requestOptions = { method: 'GET', headers: authHeader() };
    return fetch(`${config.apiUrl}/data_sources?app_id=${appId}`, requestOptions).then(handleResponse);
}

function create(app_id, name, kind, options) {
    const body =  {
        app_id,
        name,
        kind,
        options
    }
    const headers = {
        ...authHeader(),
        'Content-Type': 'application/json'
    }
    const requestOptions = { method: 'POST', headers: headers, body: JSON.stringify(body) };
    return fetch(`${config.apiUrl}/data_sources`, requestOptions).then(handleResponse);
}

function save(id, app_id, name, options) {
    const body =  {
        app_id,
        name,
        options
    }
    const headers = {
        ...authHeader(),
        'Content-Type': 'application/json'
    }
    const requestOptions = { method: 'PUT', headers: headers, body: JSON.stringify(body) };
    return fetch(`${config.apiUrl}/data_sources/${id}`, requestOptions).then(handleResponse);
}


function test(kind, options) {
    const body =  {
        kind,
        options
    };

    const headers = {
        ...authHeader(),
        'Content-Type': 'application/json'
    }

    const requestOptions = { method: 'POST', headers: headers, body: JSON.stringify(body) };
    return fetch(`${config.apiUrl}/data_sources/test_connection`, requestOptions).then(handleResponse);
}

function setOauth2Token(dataSourceId, body) {
    const headers = {
        ...authHeader(),
        'Content-Type': 'application/json'
    }

    const requestOptions = { method: 'POST', headers: headers, body: JSON.stringify(body) };
    return fetch(`${config.apiUrl}/data_sources/${dataSourceId}/authorize_oauth2`, requestOptions).then(handleResponse);
}

function fetchOauth2BaseUrl(provider) {
    const headers = {
        ...authHeader(),
        'Content-Type': 'application/json'
    }

    const requestOptions = { method: 'POST', headers: headers, body: JSON.stringify({provider}) };
    return fetch(`${config.apiUrl}/data_sources/fetch_oauth2_base_url`, requestOptions).then(handleResponse);
}
