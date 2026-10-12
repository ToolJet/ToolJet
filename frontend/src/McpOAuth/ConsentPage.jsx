import React, { useEffect, useState } from 'react';
import config from 'config';
import './oauth.css';

export const SCOPE_LABELS = {
  apps: 'Create and manage apps and their components',
  data: 'Access datasources, run queries, and manage ToolJet Database',
  workflows: 'Create, manage, and run workflows',
  workspace_users: 'Manage workspace users and custom groups',
};
const api = `${config.apiUrl}/mcp-oauth`;

export default function ConsentPage() {
  const id = new URLSearchParams(window.location.search).get('request');
  const [flow, setFlow] = useState(null);
  const [email, setEmail] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    let active = true;
    setFlow(null);
    setEmail(null);
    setNeedsLogin(false);
    setError('');
    const load = async () => {
      if (window.top !== window.self) throw new Error('Open this connection in a separate browser tab to continue.');
      if (!/^[A-Za-z0-9_-]{43}$/.test(id || ''))
        throw new Error('This connection link is invalid. Start again from your AI client.');
      const response = await fetch(`${api}/interactions/${id}`, {
        credentials: 'include',
      });
      if (response.status === 404)
        throw new Error(
          'AI client connections are unavailable or this request has expired. Start again from your AI client.'
        );
      if (!response.ok)
        throw new Error(
          'This connection request expired or belongs to another browser. Start again from your AI client.'
        );
      const info = await response.json();
      if (!active) return;
      setFlow(info);
      const session = await fetch(`${api}/interactions/${id}/session`, {
        credentials: 'include',
        headers: { 'tj-workspace-id': info.organizationId },
      });
      if (!active) return;
      if (session.status === 401) {
        setNeedsLogin(true);
        const key = `tj_mcp_login_${id}`;
        // Storage can be blocked by browser privacy settings. A manual sign-in
        // link still works, while avoiding an automatic login loop.
        try {
          if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, '1');
            window.location.assign(info.loginUrl);
          }
        } catch {
          // Keep the explicit sign-in link available.
        }
        return;
      }
      if (session.status === 403)
        throw new Error(
          'You do not have access to connect an AI client in this workspace. Contact your workspace administrator.'
        );
      if (!session.ok) throw new Error('Unable to verify access to this workspace. Please sign in again.');
      const user = await session.json();
      if (active) {
        setEmail(user.email);
        try {
          sessionStorage.removeItem(`tj_mcp_login_${id}`);
        } catch {
          // Consent does not require browser storage.
        }
      }
    };
    load().catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [id]);

  const decide = async (allow) => {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`${api}/interactions/${id}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'tj-workspace-id': flow.organizationId,
          'x-tooljet-oauth-csrf': flow.csrfToken,
        },
        body: JSON.stringify({ allow }),
      });
      if (response.status === 401) {
        setEmail(null);
        setNeedsLogin(true);
        throw new Error('Your sign-in has expired. Sign in to this workspace again to continue.');
      }
      if (!response.ok) throw new Error('Unable to complete this connection. Start again from your AI client.');
      const result = await response.json();
      window.location.assign(result.redirectUrl);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <main className="mcp-oauth-page">
      <section className="mcp-oauth-card" aria-labelledby="mcp-oauth-title">
        <p className="mcp-oauth-brand">ToolJet</p>
        <h1 id="mcp-oauth-title">Authorize an AI client</h1>
        {error && (
          <p role="alert" className="mcp-oauth-error">
            {error}
          </p>
        )}
        {!flow && !error && <p role="status">Loading connection request…</p>}
        {flow && (
          <>
            <p>
              <strong>{flow.clientName}</strong> is requesting access to <strong>{flow.organizationName}</strong>.
            </p>
            <p className="mcp-oauth-muted">
              Client names are supplied by the client. Continue only if you started this connection.
            </p>
            <dl>
              <dt>Callback address</dt>
              <dd>{flow.redirectUri}</dd>
            </dl>
            <ul>
              {flow.scopes.map((scope) => (
                <li key={scope}>{SCOPE_LABELS[scope] || scope}</li>
              ))}
            </ul>
            <p>
              The client can perform the actions listed above, including changes and deletions, only within your current
              permissions in this workspace. You can disconnect it in Profile settings.
            </p>
            {email ? (
              <>
                <p>
                  Signed in as <strong>{email}</strong>
                </p>
                <div className="mcp-oauth-actions">
                  <button disabled={busy} onClick={() => decide(false)}>
                    Cancel
                  </button>
                  <button className="mcp-oauth-primary" disabled={busy} onClick={() => decide(true)}>
                    {busy ? 'Please wait…' : 'Allow access'}
                  </button>
                </div>
              </>
            ) : needsLogin ? (
              <a className="mcp-oauth-signin" href={flow.loginUrl}>
                Sign in to this workspace
              </a>
            ) : !error ? (
              <p role="status">Verifying workspace access…</p>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}
