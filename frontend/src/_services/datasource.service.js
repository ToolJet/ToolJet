import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const datasourceService = {
    create,
    getAll,
    test
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


function test(app_id, name, kind, options) {
    const body =  {
        app_id,
        name,
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
