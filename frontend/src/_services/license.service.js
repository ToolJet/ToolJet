import config from 'config';
import { BehaviorSubject } from 'rxjs';
import { authHeader, handleResponse } from '@/_helpers';
import { appService } from './app.service';

const licenseTermsSubject = new BehaviorSubject({
  isExpired: null,
  isLicenseValid: null,
});

export const licenseService = {
  get,
  update,
  getFeatureAccess,
  getDomainsList,
  getTerms,
  licenseTerms: licenseTermsSubject.asObservable(),
  get licenseTermsValue() {
    return licenseTermsSubject.value;
  },
  updateLicenseTerms(data) {
    licenseTermsSubject.next(data);
  },
};

function get() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/license`, requestOptions).then(handleResponse);
}

async function update(body) {
  const requestOptions = { method: 'PATCH', headers: authHeader(), body: JSON.stringify(body), credentials: 'include' };
  const updatedData = await fetch(`${config.apiUrl}/license`, requestOptions).then(handleResponse).then(getTerms);
  //update global settings of application
  appService.getConfig().then((config) => {
    window.public_config = config;
  });
  return updatedData;
}

function getFeatureAccess() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/license/access`, requestOptions).then(handleResponse);
}

function getDomainsList() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/license/domains`, requestOptions).then(handleResponse);
}

function getTerms() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/license/terms`, requestOptions)
    .then(handleResponse)
    .then((data) => licenseService.updateLicenseTerms(data?.terms));
}
