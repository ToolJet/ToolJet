import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { retrieveWhiteLabelFavicon, retrieveWhiteLabelText, setFaviconAndTitle } from '@white-label/whiteLabelling';

export const withRouter = (WrappedComponent) => (props) => {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const whiteLabelFavicon = retrieveWhiteLabelFavicon();
  const whiteLabelText = retrieveWhiteLabelText();

  useEffect(() => {
    setFaviconAndTitle(location);
  }, [whiteLabelFavicon, whiteLabelText, location]);

  return <WrappedComponent {...props} params={params} location={location} navigate={navigate} />;
};
