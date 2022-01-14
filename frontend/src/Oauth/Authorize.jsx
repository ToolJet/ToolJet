import React, { useEffect, useState, useCallback } from 'react';
import useRouter from '@/_hooks/use-router';
import { authenticationService } from '@/_services';
import { Redirect } from 'react-router-dom';

export function Authorize() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const authSuccessHandler = useCallback(() => {
    setSuccess(true);
  }, [setSuccess]);

  const authFailureHandler = useCallback(() => {
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
      {(success || error) && (
        <Redirect
          to={{
            pathname: '/login',
            state: { errorMessage: success ? '' : error },
          }}
        />
      )}
    </div>
  );
}
