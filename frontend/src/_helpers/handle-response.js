import { authenticationService } from '@/_services';
import React from 'react';
import * as ReactDOM from 'react-dom';
import LegalReasonsErrorModal from '../_components/LegalReasonsErrorModal';

export function handleResponse(response) {
  return response.text().then((text) => {
    const data = text && JSON.parse(text);
    if (!response.ok) {
      if ([401].indexOf(response.status) !== -1) {
        // auto logout if 401 Unauthorized or 403 Forbidden response returned from api
        authenticationService.logout();
        // location.reload(true);
      } else if ([451].indexOf(response.status) !== -1) {
        // a popup will show when the response meet the following conditions
        const paths = ['apps', 'organization_users', 'license_terms', 'license-terms', 'oidc', 'library_apps'];
        const url = response.url;
        const lastSegment = url.substring(url.lastIndexOf('/') + 1);
        if (paths.includes(lastSegment)) {
          let message;
          let feature;
          if (data?.message?.includes('expired')) {
            message = 'Oops! Your current plan has expired.  Please update your license key to use this feature.';
          } else if (url.includes('apps')) {
            message =
              'Oops! Your current plan has exceeded its apps limit.  Please upgrade your plan now to create a new app.';
            feature = 'Apps count';
          } else if (url.includes('library_apps')) {
            message =
              'Oops! Your current plan has exceeded its apps limit.  Please upgrade your plan now to create a new app.';
            feature = 'Apps count';
          } else if (url.includes('users') || url.includes('organization_users')) {
            message =
              'Oops! Your current plan has exceeded its users limit. Please upgrade your plan now to create a new user.';
            feature = 'Users count';
          } else if (url.includes('oidc')) {
            message =
              "Oops! Your current plan doesn't have access to this feature. Please upgrade your plan now to use this.";
            feature = 'OIDC';
          } else if (url.includes('audit_logs')) {
            message =
              "Oops! Your current plan doesn't have access to this feature. Please upgrade your plan now to use this.";
            feature = 'Audit logs';
          }
          const darkMode = localStorage.getItem('darkMode') === 'true';
          const modalEl = React.createElement(LegalReasonsErrorModal, {
            showModal: true,
            message,
            feature,
            darkMode,
          });
          ReactDOM.render(modalEl, document.getElementById('modal-div'));
        }
      }

      const error = (data && data.message) || response.statusText;
      return Promise.reject({ error, data, statusCode: response?.status });
    }

    return data;
  });
}
export function handleResponseWithoutValidation(response) {
  return response.text().then((text) => {
    const data = text && JSON.parse(text);
    if (!response.ok) {
      const error = (data && data.message) || response.statusText;
      return Promise.reject({ error, data });
    }

    return data;
  });
}
