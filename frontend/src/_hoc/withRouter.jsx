import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useWhiteLabellingStore } from '@/_stores/whiteLabellingStore';
import { setFaviconAndTitle } from '@/_helpers/utils';

export const withRouter = (WrappedComponent) => (props) => {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { whiteLabelFavicon, whiteLabelText } = useWhiteLabellingStore.getState();

  useEffect(() => {
    setFaviconAndTitle(whiteLabelFavicon, whiteLabelText);
  }, [whiteLabelFavicon, whiteLabelText]);

  return <WrappedComponent {...props} params={params} location={location} navigate={navigate} />;
};
