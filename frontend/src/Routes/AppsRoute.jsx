/*
 AppRoute component should handle all editor and preview route related cases.
*/
import React, { useEffect, useState } from 'react';
import { RouteLoader } from './RouteLoader';
import { useSessionManagement } from '@/_hooks/useSessionManagement';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { handleAppAccess } from '@/_helpers/handleAppAccess';
import { getQueryParams } from '@/_helpers/routes';
import queryString from 'query-string';
import useStore from '@/AppBuilder/_stores/store';

export const AppsRoute = ({ children, componentType }) => {
  const params = useParams();
  const location = useLocation();
  const [extraProps, setExtraProps] = useState({});
  const { isLoading, isValidSession, isInvalidSession, setLoading } = useSessionManagement({
    disableValidSessionCallback: true,
    /* Only for preiview / released apps */
    disableInValidSessionCallback: componentType !== 'editor',
  });
  const clonedElement = React.cloneElement(children, extraProps);
  const navigate = useNavigate();
  const switchPage = useStore((state) => state.switchPage);

  /* 
   any extra logic specifc to the route can be done 
   when the session is valid state updates to true.
  */
  useEffect(() => {
    if (isValidSession) {
      onValidSession();
    }

    return () => window.removeEventListener('popstate', handleBrowserNavigation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValidSession]);

  useEffect(() => {
    if (isInvalidSession) {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInvalidSession]);

  /* 
   validate the app access if the route either /apps/ or /application/ and 
   user has a valid session also user isn't switching between pages on editor 
*/
  const onValidSession = async () => {
    const isSwitchingPages = location.state?.isSwitchingPage;

    if (!isSwitchingPages) {
      const { slug, versionId, environmentId, pageHandle } = params;
      /* Validate the app permissions */
      let accessDetails = await handleAppAccess(componentType, slug, versionId, environmentId);
      const { versionName, environmentName, ...restDetails } = accessDetails;
      if (versionName) {
        const restQueryParams = getQueryParams();
        const search = queryString.stringify({
          env: environmentName,
          version: versionName,
          ...restQueryParams,
        });
        /* means. the User is trying to load old preview URL. Let's change these to query params */
        navigate(
          { pathname: `/applications/${slug}${pageHandle ? `/${pageHandle}` : ''}`, search },
          { replace: true, state: location?.state }
        );
      }
      setExtraProps(restDetails);
      setLoading(false);
    }

    // handle back and forward navigation
    window.addEventListener('popstate', handleBrowserNavigation);
  };

  const handleBrowserNavigation = (e) => {
    const { id, handle } = e.state;
    switchPage(id, handle, [], true);
  };

  return <RouteLoader isLoading={isLoading}>{clonedElement}</RouteLoader>;
};
