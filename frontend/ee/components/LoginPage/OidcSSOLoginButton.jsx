import config from "config";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

function useAuthorizationUrl() {
  const [url, setUrl] = useState();
  const [isFetching, setIsFetching] = useState(false);
  const [isFetched, setIsFetched] = useState(false);

  useEffect(() => {
    if (!isFetched && !isFetching) {
      setIsFetching(true);
      fetch(`${config.apiUrl}/oauth/oidc`, {
        method: "GET",
        credentials: "include",
      })
        .then((res) => res.json())
        .then((json) => {
          setUrl(json.authorizationUrl);
        })
        .catch((reason) => {
          toast.error(reason.error);
        })
        .finally(() => {
          setIsFetching(false);
          setIsFetched(true);
        });
    }
  }, []);

  return url;
}

export default function OIDCSSOLoginButton() {
  const authorizationUrl = useAuthorizationUrl();
  const [isRedirect, setRedirect] = useState(false);

  useEffect(() => {
    if (isRedirect) {
      window.location.href = authorizationUrl;
    }
  }, [isRedirect]);

  const oidcName = window.public_config.SSO_OIDC_NAME;

  const oidcLogin = (e) => {
    e.preventDefault();
    if (authorizationUrl) {
      setRedirect(true);
    } else {
      toast.error("could not create authorization url");
    }
  };
  return (
    <div>
      <button onClick={oidcLogin} className="btn border-0 rounded-2">
        <img src="/assets/images/sso-buttons/oidc.svg" className="h-4" />
        <span className="px-1">Sign in with {oidcName}</span>
      </button>
    </div>
  );
}
