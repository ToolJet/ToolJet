import React from 'react';
import * as ReactDOM from 'react-dom';
import LegalReasonsErrorModal from '../_components/LegalReasonsErrorModal';
import SolidIcon from '../_ui/Icon/SolidIcons';
import { copyToClipboard } from '@/_helpers/appUtils';
import { sessionService } from '@/_services';
import { redirectToSwitchOrArchivedAppPage } from './routes';

const copyFunction = (input) => {
  let text = document.getElementById(input).innerHTML;
  copyToClipboard(text);
};

export function handleResponse(response, avoidRedirection = false, queryParamToUpdate = null) {
  return response.text().then((text) => {
    let modalBody = (
      <>
        <div data-cy="info-text">To upgrade your plan, please reach out to us at</div>
        <div className="form-group my-3">
          <div className="d-flex justify-content-between form-control align-items-center">
            <p className="m-0" id="support-email" data-cy="support-email">
              hello@tooljet.com
            </p>
            <SolidIcon name="copy" width="16" onClick={() => copyFunction('support-email')} />
          </div>
        </div>
      </>
    );
    const data = text && JSON.parse(text);
    if (!response.ok) {
      if ([401].indexOf(response.status) !== -1) {
        // auto logout if 401 Unauthorized or 403 Forbidden response returned from api
        const errorMessageJson = typeof data.message === 'string' ? JSON.parse(data.message) : undefined;
        const workspaceId = errorMessageJson?.organizationId;
        avoidRedirection ? sessionService.logout(false, workspaceId) : location.reload(true);
      } else if ([451].indexOf(response.status) !== -1) {
        // a popup will show when the response meet the following conditions
        const url = response.url;
        let message = data?.message ?? '';
        let feature;

        if (!message) {
          if (url.includes('apps')) {
            message =
              'Oops! Your current plan has exceeded its apps limit.  Please upgrade your plan now to create a new app.';
            feature = 'Apps count';
          } else if (url.includes('library_apps')) {
            message =
              'Oops! Your current plan has exceeded its apps limit.  Please upgrade your plan now to create a new app.';
            feature = 'Apps count';
          } else if (url.includes('users') || url.includes('organization-users')) {
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
        }
        const darkMode = localStorage.getItem('darkMode') === 'true';
        const modalEl = React.createElement(LegalReasonsErrorModal, {
          showModal: true,
          message,
          body: message.includes('apps') && modalBody,
          feature,
          darkMode,
        });

        if (!message?.includes('expired')) {
          ReactDOM.render(modalEl, document.getElementById('modal-div'));
        }
      } else if ([400].indexOf(response.status) !== -1) {
        redirectToSwitchOrArchivedAppPage(data);
      }
      const error = (data && data.message) || response.statusText;
      return Promise.reject({ error, data, statusCode: response?.status });
    }

    // Update the URL if queryParamToUpdate is provided
    if (queryParamToUpdate) {
      const { param, value } = queryParamToUpdate;
      if (data?.[value]) {
        const newUrl = new URL(window.location.href);
        if (!newUrl.searchParams.has(param)) {
          newUrl.searchParams.set(param, data[value]);
          window.history.replaceState(null, '', newUrl.toString());
        }
      }
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
