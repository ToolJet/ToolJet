import { BehaviorSubject } from 'rxjs';
import { history, handleResponse } from '@/_helpers';
import config from 'config';

const currentUserSubject = new BehaviorSubject(JSON.parse(localStorage.getItem('currentUser')));

export const authenticationService = {
  login,
  logout,
  signup,
  updateCurrentUserDetails,
  currentUser: currentUserSubject.asObservable(),
  get currentUserValue() {
    return currentUserSubject.value;
  },
  signInViaOAuth,
  resetPassword,
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
      currentUserSubject.next(user);

      return user;
    });
}

function updateCurrentUserDetails(details) {
  const currentUserDetails = JSON.parse(localStorage.getItem('currentUser'));
  const updatedUserDetails = Object.assign({}, currentUserDetails, details);
  localStorage.setItem('currentUser', JSON.stringify(updatedUserDetails));
  currentUserSubject.next(updatedUserDetails);
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

function resetPassword(params) {
  const { token, password } = params;
  const body = JSON.stringify({ token, password });

  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  };

  return fetch(`${config.apiUrl}/reset_password`, requestOptions);
}

function logout() {
  // remove user from local storage to log user out
  localStorage.removeItem('currentUser');
  currentUserSubject.next(null);
  history.push(`/login?redirectTo=${window.location.pathname}`);
}

function signInViaOAuth(ssoResponse) {
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ssoResponse),
  };

  return fetch(`${config.apiUrl}/oauth/sign-in`, requestOptions)
    .then(handleResponse)
    .then((user) => {
      localStorage.setItem('currentUser', JSON.stringify(user));
      currentUserSubject.next(user);

      return user;
    });
}
