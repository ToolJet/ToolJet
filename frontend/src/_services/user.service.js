import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const userService = {
    getAll,
    createUser,
    deleteUser,
    setPasswordFromToken
};

function getAll() {
    const requestOptions = { method: 'GET', headers: authHeader() };
    return fetch(`${config.apiUrl}/users`, requestOptions).then(handleResponse);
}

function createUser(first_name, last_name, email, role) {
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
    return fetch(`${config.apiUrl}/users`, requestOptions).then(handleResponse);
}

function deleteUser(id) {
    const headers = {
        ...authHeader(),
        'Content-Type': 'application/json'
    }
    const requestOptions = { method: 'DELETE', headers: headers, body: JSON.stringify({}) };
    return fetch(`${config.apiUrl}/users/${id}`, requestOptions).then(handleResponse);
}

function setPasswordFromToken(token, password) {
    const body =  {
        token,
        password
    }
    const headers = {
        ...authHeader(),
        'Content-Type': 'application/json'
    }
    const requestOptions = { method: 'POST', headers: headers, body: JSON.stringify(body) };
    return fetch(`${config.apiUrl}/user/set_password_from_token`, requestOptions).then(handleResponse);

}
