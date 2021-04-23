import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const organizationUserService = {
    create
};

function create(first_name, last_name, email, role) {
    const body =  {
        first_name,
        last_name,
        email,
        role
    }
    const headers = {
        ...authHeader(),
        'Content-Type': 'application/json'
    }
    const requestOptions = { method: 'POST', headers: headers, body: JSON.stringify(body) };
    return fetch(`${config.apiUrl}/organization_users`, requestOptions).then(handleResponse);
}
