import React, { useEffect, useState, useMemo } from 'react';
import useRouter from '@/_hooks/use-router';
import { authenticationService } from '@/_services';
import { Redirect } from 'react-router-dom';

export function Authorize() {
  const [error, setError] = useState('');
  const router = useRouter();

  const authSuccessHandler = useMemo(() => {
    router.history.push('/');
  }, [router]);

  const authFailureHandler = useMemo(() => {
    setError('Github login failed');
  }, [setError]);

  useEffect(() => {
    const errorMessage = router.query.error_description || router.query.error;
    if (errorMessage) {
      return setError(errorMessage);
    }

    authenticationService
      .signInViaOAuth({ token: router.query.code, origin: router.query.origin })
      .then(authSuccessHandler)
      .catch(authFailureHandler);
  }, [
    authFailureHandler,
    authSuccessHandler,
    router.query.code,
    router.query.error,
    router.query.error_description,
    router.query.origin,
  ]);

  return (
    <div>
      <div>Loading</div>
      {error && (
        <Redirect
          to={{
            pathname: '/login',
            state: { errorMessage: error },
          }}
        />
      )}
    </div>
  );
}
