import { ERROR_MESSAGES } from '@/_helpers/constants';
import { redirectToDashboard, getPrivateRoute, getSubpath } from '@/_helpers/routes';
import React from 'react';
import { Modal } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import './static-modal.scss';

export default function ErrorPage({ darkMode }) {
  const params = useParams();
  const errorType = params?.errorType;
  const errorMsg = ERROR_MESSAGES[errorType];

  if (!errorMsg) redirectToDashboard();

  const searchParams = new URLSearchParams(location.search);
  const appSlug = searchParams.get('appSlug');

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <ErrorModal errorMsg={errorMsg} appSlug={appSlug} show={true} darkMode={darkMode} />
    </div>
  );
}

export const ErrorModal = ({ errorMsg, appSlug, ...props }) => {
  const { t } = useTranslation();

  // Redirect to edit app URL in a new tab
  const openAppEditorInNewTab = () => {
    const subpath = getSubpath();
    const path = subpath
      ? `${subpath}${getPrivateRoute('editor', { slug: appSlug })}`
      : getPrivateRoute('editor', { slug: appSlug });
    window.open(path, '_blank');
  };

  return (
    <div className="custom-backdrop">
      <Modal
        {...props}
        className={`organization-switch-modal static-error-modal ${props.darkMode ? 'dark-mode' : ''}`}
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header>
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="64" height="64" rx="12" fill="#FFF0EE" />
            <g opacity="0.4">
              <path
                d="M32.8331 15.3333H31.1664C30.2459 15.3333 29.4998 16.0795 29.4998 17V47C29.4998 47.9205 30.2459 48.6666 31.1664 48.6666H32.8331C33.7536 48.6666 34.4998 47.9205 34.4998 47V17C34.4998 16.0795 33.7536 15.3333 32.8331 15.3333Z"
                fill="#E54D2E"
              />
            </g>
            <path
              d="M18.4432 31.1669L29.4998 24.7834L34.4998 21.8966L38.0526 19.8454C38.4354 19.6244 38.8904 19.5645 39.3173 19.6789L43.8707 20.8989C44.7599 21.1372 45.2875 22.0511 45.0493 22.9402L43.8292 27.4936C43.7148 27.9206 43.4354 28.2846 43.0526 28.5056L34.4998 33.4436L29.4998 36.3304L23.4432 39.8271C22.6461 40.2873 21.6268 40.0142 21.1665 39.2171L17.8332 33.4436C17.373 32.6464 17.6461 31.6271 18.4432 31.1669Z"
              fill="#E54D2E"
            />
          </svg>
          <span className="header-text" data-cy="modal-header">
            {t('globals.static-error-modal.title', errorMsg?.title)}
          </span>
          <p className="description" data-cy="modal-description">
            {t('globals.static-error-modal.description', errorMsg?.message)}
          </p>
        </Modal.Header>
        <Modal.Footer>
          {errorMsg?.retry && (
            <button
              className="btn btn-primary action-btn"
              style={{
                width: '315px',
                height: '40px',
                backgroundColor: '#F0F4FF',
                color: 'rgba(var(--tblr-btn-color), 1)',
                marginBottom: '5px',
                display: 'flex',
                alignItems: 'center',
              }}
              onClick={() => window.history.back()}
              data-cy="retry-button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="21"
                height="21"
                viewBox="0 0 21 21"
                fill="none"
                style={{ marginRight: '8px' }}
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M9.04781 4.74972C11.4683 4.12777 13.9525 5.09359 15.3103 7.06516L9.04781 4.74972ZM15.3103 7.06516H13.0002C12.54 7.06516 12.1669 7.43826 12.1669 7.8985C12.1669 8.35873 12.54 8.73183 13.0002 8.73183H16.6754C16.6882 8.73213 16.701 8.73213 16.7138 8.73183H17.1669C17.6271 8.73183 18.0002 8.35873 18.0002 7.8985V3.73183C18.0002 3.27159 17.6271 2.8985 17.1669 2.8985C16.7066 2.8985 16.3335 3.27159 16.3335 3.73183V5.65205C14.5274 3.42705 11.5358 2.38951 8.6328 3.13556L8.63262 3.1356C7.31403 3.47477 6.11263 4.16649 5.15728 5.13656C4.20193 6.10663 3.52867 7.31846 3.2097 8.64209C2.89073 9.96571 2.93808 11.3512 3.34669 12.65C3.75529 13.9487 4.50972 15.1118 5.52907 16.0143C6.54843 16.9169 7.79425 17.525 9.13292 17.7733C10.4716 18.0217 11.8526 17.9009 13.1279 17.4241C14.4032 16.9472 15.5246 16.1322 16.3718 15.0664C17.2191 14.0006 17.7603 12.7243 17.9373 11.3744C17.9971 10.918 17.6757 10.4996 17.2194 10.4397C16.7631 10.3799 16.3446 10.7013 16.2848 11.1576C16.1471 12.2076 15.7262 13.2003 15.0672 14.0292C14.4082 14.8582 13.536 15.4921 12.5441 15.863C11.5523 16.2339 10.4781 16.3278 9.43693 16.1346C8.39574 15.9415 7.42677 15.4685 6.63394 14.7665C5.84111 14.0645 5.25433 13.1599 4.93653 12.1498C4.61873 11.1396 4.5819 10.062 4.82998 9.03255C5.07807 8.00306 5.60172 7.06053 6.34477 6.30603C7.08778 5.55157 8.02213 5.01359 9.04763 4.74977"
                  fill="rgba(var(--tblr-btn-color), 1)"
                />
              </svg>
              {t('globals.workspace-modal.continue-btn', 'Retry')}
            </button>
          )}
          {appSlug && (
            <button
              className={'btn btn-primary action-btn'}
              onClick={() => openAppEditorInNewTab()}
              data-cy="open-app-button"
            >
              {t('globals.workspace-modal.continue-btn', 'Open app')}
            </button>
          )}
          <button
            className={errorMsg?.retry || appSlug ? 'btn btn-primary' : 'btn btn-primary action-btn'}
            onClick={() => redirectToDashboard()}
            data-cy="back-to-home-button"
          >
            {t('globals.workspace-modal.continue-btn', errorMsg?.cta)}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};
