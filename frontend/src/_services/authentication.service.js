import { history, handleResponse } from '@/_helpers';
import config from 'config';

let currentUser
try{
  currentUser = JSON.parse(localStorage.getItem('currentUser'))
}catch(err){
  console.log(err)
}

export const authenticationService = {
  login,
  logout,
  signup,
  updateCurrentUserDetails,
  currentUser,
  get currentUserValue() {
    return currentUser;
  },
};

function login(email, password) {
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  };

  return fetch(`${config.apiUrl}/authenticate`, requestOptions)
    .then(handleResponse)
    .then((user) => {
      // store user details and jwt token in local storage to keep user logged in between page refreshes
      localStorage.setItem('currentUser', JSON.stringify(user));
      return user;
    });
}

function updateCurrentUserDetails(details) {
  const currentUserDetails = currentUser;
  const updatedUserDetails = Object.assign({}, currentUserDetails, details);
  localStorage.setItem('currentUser', JSON.stringify(updatedUserDetails));
}

function signup(email) {
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  };

  return fetch(`${config.apiUrl}/signup`, requestOptions)
    .then(handleResponse)
    .then((user) => {
      return user;
    });
}

function logout() {
  // remove user from local storage to log user out
  localStorage.removeItem('currentUser');
  history.push(`/login?redirectTo=${window.location.pathname}`);
}
