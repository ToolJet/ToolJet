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
          if (res.status === 401 || res.status === 403) {
            toast.error('Your pat is expired. Please refresh or contact your admin.');
            // 🔔 Show toast if token is expired or invalid
            parent.postMessage(
              { error: res.status, message: 'Your pat is expired. Please refresh or contact your admin.' },
              '*'
            );
          }
          return;
        }

        const result = await res.json();
        console.log('Response data:', result);
        // ✅ Store PAT in memory
        setPatToken(result.signedPat);
        window.name = result.signedPat;
        console.log('patToken', result.signedPat);
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
