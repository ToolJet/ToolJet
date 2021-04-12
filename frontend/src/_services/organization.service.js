import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const organizationService = {
    getUsers
};

function getUsers(id) {
    const requestOptions = { method: 'GET', headers: authHeader() };
    return fetch(`${config.apiUrl}/organizations/${id}/users`, requestOptions).then(handleResponse);
}
