import React, { useEffect, useState } from 'react';
import { RouteLoader } from './RouteLoader';
import { useSessionManagement } from '@/_hooks/useSessionManagement';

export const OrganizationInviteRoute = ({ children }) => {
  /* Needed to pass invite token to signup page if the user doesn't exist */
  const [extraProps, setExtraProps] = useState({});
  const { isLoading, isInvalidSession } = useSessionManagement({
    disableInValidSessionCallback: true,
  });

  useEffect(() => {
    if (isInvalidSession) {
      /* handle invalid session case: user doesn't have any session / an activated account */
      onInvalidSession();
    }
  }, [isInvalidSession]);

  const clonedElement = React.cloneElement(children, extraProps);

  const onInvalidSession = () => {
    /* validate invited user */
  };

  return <RouteLoader isLoading={isLoading}>{clonedElement}</RouteLoader>;
};
