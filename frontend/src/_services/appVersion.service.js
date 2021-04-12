import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const appVersionService = {
    getAll
};

function getAll(appId) {
    const requestOptions = { method: 'GET', headers: authHeader() };
    return fetch(`${config.apiUrl}/apps/${appId}/versions`, requestOptions).then(handleResponse);
}
