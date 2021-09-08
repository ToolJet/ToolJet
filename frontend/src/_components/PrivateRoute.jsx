import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { history } from '@/_helpers';
import { authenticationService } from '@/_services';

export const PrivateRoute = ({ component: Component, switchDarkMode, darkMode, ...rest }) => {
  const [destination, setDestination] = React.useState('/');
  const url = history.location.pathname;


  React.useEffect(() => {
    setDestination(url);
  },[])

  React.useEffect(() => {
    const currentUser = authenticationService.currentUserValue;
    if(currentUser && destination.startsWith('/applications/')) {
      return history.push(destination);
    }
  },[url])
  return (
    <Route
    {...rest}
    render={(props) => {
      const currentUser = authenticationService.currentUserValue;
      if (!currentUser && !props.location.pathname.startsWith('/applications/')) {
        // not logged in so redirect to login page with the return url
        return <Redirect to={{ pathname: '/login', state: { from: props.location } }} />;
      }

      // authorised so return component
      return <Component {...props} switchDarkMode={switchDarkMode} darkMode={darkMode}/>;
    }}
  />
  );
}
