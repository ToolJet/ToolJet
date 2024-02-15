import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { setWindowTitle } from '@/_helpers/utils';

export const withRouter = (WrappedComponent) => (props) => {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setWindowTitle(null, location);
  }, [location]);

  return <WrappedComponent {...props} params={params} location={location} navigate={navigate} />;
};
