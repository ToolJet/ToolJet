import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { setFaviconAndTitle } from '@/_helpers/utils';

export const withRouter = (WrappedComponent) => (props) => {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { WHITE_LABEL_FAVICON, WHITE_LABEL_TEXT } = window.public_config;

  useEffect(() => {
    setFaviconAndTitle(WHITE_LABEL_FAVICON, WHITE_LABEL_TEXT, location);
  }, [WHITE_LABEL_FAVICON, WHITE_LABEL_TEXT, location]);

  return <WrappedComponent {...props} params={params} location={location} navigate={navigate} />;
};
