import React, { useEffect } from 'react';
import useRouter from '@/_hooks/use-router';
import config from 'config';
import toast from 'react-hot-toast';

// In-memory PAT token store
let inMemoryPatToken = null;

export function setPatToken(patToken) {
  inMemoryPatToken = patToken;
}

export function getPatToken() {
  if (inMemoryPatToken) return inMemoryPatToken;
}

export default function EmbedAppRedirect() {
  const router = useRouter();
  const { appId } = router.query;

  useEffect(() => {
    // 🔐 Ensure the page is embedded
    if (window.self === window.top) {
      // Not inside an iframe
      toast.error('This page must be embedded inside a parent application.');
      return;
    }
    const token = new URLSearchParams(window.location.search).get('personal-access-token');

    if (!token || typeof appId !== 'string') {
      parent?.postMessage({ type: 'TJ_EMBED_APP_LOGOUT', error: 400, message: 'Missing token or appId' }, '*');
      return;
    }

    const initiateSession = async () => {
      try {
        const res = await fetch(`${config.apiUrl}/ext/users/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ appId, accessToken: token }),
        });
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            toast.error('Your pat is expired. Please refresh or contact your admin.');
            // 🔔 Show toast if token is expired or invalid
            parent?.postMessage(
              {
                type: 'TJ_EMBED_APP_LOGOUT',
                error: res.status,
                message: 'Your pat is expired. Please refresh or contact your admin.',
              },
              '*'
            );
          }
          return;
        }

        const result = await res.json();
        // ✅ Store PAT in memory
        setPatToken(result.signedPat);
        window.name = result.signedPat;
        window.location.href = `applications/${appId}`;
      } catch (error) {
        parent?.postMessage({ type: 'TJ_EMBED_APP_LOGOUT', error: 500, message: 'Network error' }, '*');
      }
    };

    initiateSession();
  }, [appId]);

  return <div>Loading embedded app...</div>;
}
