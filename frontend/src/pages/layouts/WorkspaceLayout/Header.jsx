import React from 'react';
import { Link } from 'react-router-dom';

import { getPrivateRoute } from '@/_helpers/routes';
import { useWhiteLabellingStore } from '@/_stores/whiteLabellingStore';
import { authenticationService } from '@/_services/authentication.service.js';
import Logo from '@assets/images/tj-logo.svg';

import WorkspaceSelector from './WorkspaceSelector';

export default function Header() {
  return (
    <header className="tw-flex tw-items-center tw-gap-2 tw-h-[var(--header-height)] tw-border-b tw-border-border-weak tw-pr-8">
      <WorkspaceLogo />

      <WorkspaceSelector />
    </header>
  );
}

function WorkspaceLogo() {
  const logo = useWhiteLabellingStore((state) => state.whiteLabelLogo);
  const isWhiteLabellingDataLoading = useWhiteLabellingStore((state) => state.loadingWhiteLabelDetails);

  const isEndUser = authenticationService.currentSessionValue?.role?.name === 'end-user';

  return (
    <div className="tw-flex tw-justify-center tw-items-center tw-size-12">
      <Link
        to={isEndUser ? getPrivateRoute('dashboard') : getPrivateRoute('home')}
        //   TODO: onClick logic should not be here instead on unmount of datasource page check if there are unsaved changes and then show the dialog. This is just a temporary solution to show the dialog when user clicks on the logo in the header.
        //   onClick={(event) => checkForUnsavedChanges(getPrivateRoute('dashboard'), event)}
      >
        {isWhiteLabellingDataLoading ? (
          ''
        ) : logo ? (
          <img
            width="26px"
            height="26px"
            src={logo}
            onError={(e) => {
              e.currentTarget.onerror = null; // prevent infinite loop
              e.currentTarget.src = 'assets/images/logo-fallback.svg';
            }}
          />
        ) : (
          <Logo />
        )}
      </Link>
    </div>
  );
}
