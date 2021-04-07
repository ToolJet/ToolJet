import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const dataqueryService = {
    create,
    getAll,
    run,
    update
};

function getAll(appId) {
    const requestOptions = { method: 'GET', headers: authHeader() };
    return fetch(`${config.apiUrl}/data_queries?app_id=${appId}`, requestOptions).then(handleResponse);
}

function create(app_id, name, kind, options, data_source_id) {
    const body =  {
        app_id,
        name,
        kind,
        options,
        data_source_id
    }
    const headers = {
        ...authHeader(),
        'Content-Type': 'application/json'
    }
    const requestOptions = { method: 'POST', headers: headers, body: JSON.stringify(body) };
    return fetch(`${config.apiUrl}/data_queries`, requestOptions).then(handleResponse);
}

function update(id, options) {
    const body =  {
        options,
    }
    const headers = {
        ...authHeader(),
        'Content-Type': 'application/json'
    }
    const requestOptions = { method: 'PATCH', headers: headers, body: JSON.stringify(body) };
    return fetch(`${config.apiUrl}/data_queries/${id}`, requestOptions).then(handleResponse);
}

function run(queryId, queryVariables) {
    const body =  {
        query_variables: queryVariables
    }
    const headers = {
        ...authHeader(),
        'Content-Type': 'application/json'
    }
    const requestOptions = { method: 'POST', headers: headers, body: JSON.stringify(body) };
    return fetch(`${config.apiUrl}/data_queries/${queryId}/run`, requestOptions).then(handleResponse);
}
