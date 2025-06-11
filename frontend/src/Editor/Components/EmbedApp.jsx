import React, { useEffect } from 'react';
import useRouter from '@/_hooks/use-router';
import config from 'config';

// In-memory PAT token store
let inMemoryPatToken = null;

export function setPatToken(patObj) {
  inMemoryPatToken = patObj;
}

export function getPatToken() {
  if (inMemoryPatToken) return inMemoryPatToken;
}

export default function EmbedAppRedirect() {
  const router = useRouter();
  const { appId } = router.query;

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('personal-access-token');

    if (!token || typeof appId !== 'string') {
      parent.postMessage({ error: 400, message: 'Missing token or appId' }, '*');
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
          parent.postMessage({ error: res.status, message: 'unauthorized' }, '*');
          return;
        }

        const patObj = await res.json();
        // ✅ Store PAT in memory
        setPatToken(patObj);
        window.name = JSON.stringify(patObj);
        window.location.href = `applications/${appId}`;
      } catch (error) {
        console.log(error, 'error');
        parent.postMessage({ error: 500, message: 'Network error' }, '*');
      }
    };

    initiateSession();
  }, [appId]);

  return <div>Loading embedded app...</div>;
}
