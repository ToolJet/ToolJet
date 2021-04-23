import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const organizationUserService = {
    create,
    changeRole
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


function changeRole(id, role) {
    const body =  {
        role
    }
    const headers = {
        ...authHeader(),
        'Content-Type': 'application/json'
    }
    const requestOptions = { method: 'POST', headers: headers, body: JSON.stringify(body) };
    return fetch(`${config.apiUrl}/organization_users/${id}/change_role`, requestOptions).then(handleResponse);
}
