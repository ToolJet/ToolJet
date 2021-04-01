import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const appService = {
    createApp,
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
