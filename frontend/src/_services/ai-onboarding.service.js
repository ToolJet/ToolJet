import { authHeader, handleResponse, handleResponseWithoutValidation } from '@/_helpers';
import config from 'config';
import { authenticationService } from './authentication.service';

export const aiOnboardingService = {
  signInViaOAuth,
  signUpWithEmail,
  deleteAiCookies,
};

function signInViaOAuth(ssoType, ssoResponse) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify({ ...ssoResponse }),
  };

  return fetch(`${config.apiUrl}/ai/onboarding/sign-in/common/${ssoType}`, requestOptions)
    .then(handleResponseWithoutValidation)
    .then((user) => {
      if (!user.redirect_url) {
        authenticationService.updateCurrentSession(user);
      }
      return user;
    });
}

function signUpWithEmail(userData) {
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(userData),
  };

  return fetch(`${config.apiUrl}/ai/onboarding`, requestOptions)
    .then(handleResponseWithoutValidation)
    .then((user) => {
      if (!user.redirect_url) {
        authenticationService.updateCurrentSession(user);
      }
      return user;
    });
}

function deleteAiCookies() {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };

  return fetch(`${config.apiUrl}/ai/onboarding/delete-ai-cookies`, requestOptions).then(handleResponse);
}
