import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const appService = {
    createApp,
    getApp,
    saveApp
};

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


function saveApp(id, definition) {
    const headers = {
        ...authHeader(),
        'Content-Type': 'application/json'
    }
    const requestOptions = { method: 'PUT', headers: headers, body: JSON.stringify({ definition }) };
    return fetch(`${config.apiUrl}/apps/${id}`, requestOptions).then(handleResponse);
}