import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const dataqueryService = {
    create
};

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
