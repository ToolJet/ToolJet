import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const appService = {
    getAll,
    createApp,
    getApp,
    saveApp,
    getAppUsers
};

function getAll() {
    const requestOptions = { method: 'GET', headers: authHeader() };
    return fetch(`${config.apiUrl}/apps`, requestOptions).then(handleResponse);
}

function createApp() {
    const body =  {
    }
    const headers = {
        ...authHeader(),
        'Content-Type': 'application/json'
    }
    const requestOptions = { method: 'POST', headers: headers, body: JSON.stringify(body) };
    return fetch(`${config.apiUrl}/apps`, requestOptions).then(handleResponse);
}

function getApp(id) {
    const requestOptions = { method: 'GET', headers: authHeader() };
    return fetch(`${config.apiUrl}/apps/${id}`, requestOptions).then(handleResponse);
}


function saveApp(id, name, definition) {
    const headers = {
        ...authHeader(),
        'Content-Type': 'application/json'
    }

    const body = {
        definition,
        name
    };

    const requestOptions = { method: 'PUT', headers: headers, body: JSON.stringify(body) };
    return fetch(`${config.apiUrl}/apps/${id}`, requestOptions).then(handleResponse);
}

function getAppUsers(id) {
    const requestOptions = { method: 'GET', headers: authHeader() };
    return fetch(`${config.apiUrl}/apps/${id}/users`, requestOptions).then(handleResponse);
}
