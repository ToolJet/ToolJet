import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const dataqueryService = {
    create,
    getAll
};

function getAll(appId) {
    const requestOptions = { method: 'GET', headers: authHeader() };
    return fetch(`${config.apiUrl}/data_queries?app_id=${appId}`, requestOptions).then(handleResponse);
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
    return fetch(`${config.apiUrl}/data_queries`, requestOptions).then(handleResponse);
}
