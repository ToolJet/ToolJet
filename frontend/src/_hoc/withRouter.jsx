import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

export const withRouter = (WrappedComponent) => (props) => {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  return <WrappedComponent {...props} params={params} location={location} navigate={navigate} />;
};
