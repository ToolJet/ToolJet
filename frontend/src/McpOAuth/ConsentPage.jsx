import React, { useEffect, useState } from 'react';
import config from 'config';
import { Database, Info, LayoutGrid, UserRound, UsersRound, Workflow } from 'lucide-react';
import '@/_styles/componentdesign.scss';
import '@/_styles/typography.scss';
import './oauth.css';
import { captureMcpOAuthBootstrap, clearMcpOAuthBootstrap, getMcpOAuthBootstrap } from './bootstrap';

export const SCOPE_LABELS = {
  apps: 'Create and manage apps and their components',
  data: 'Access data sources, run queries, and manage ToolJet Database',
  workflows: 'Create, manage, and run workflows',
  workspace_users: 'Manage workspace users and custom groups',
};
const SCOPE_PRESENTATION = {
  apps: { title: 'Apps', icon: LayoutGrid },
  data: { title: 'Data sources & database', icon: Database },
  workflows: { title: 'Workflows', icon: Workflow },
  workspace_users: { title: 'Workspace members', icon: UsersRound },
};
const api = () => `${config.apiUrl.replace(/\/$/, '')}/mcp-oauth`;

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
      // ConsentPage can be mounted directly in tests or embedded builds where
      // index.jsx was not the entry point. Capture still scrubs synchronously.
      captureMcpOAuthBootstrap();
      const bootstrap = getMcpOAuthBootstrap(id);
      if (bootstrap) {
        const bootstrapped = await fetch(`${api()}/interactions/${id}/bootstrap`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bootstrap),
        });
        if (!bootstrapped.ok)
          throw new Error(
            'This workspace domain changed or the connection link expired. Start again from your AI client.'
          );
        clearMcpOAuthBootstrap(id);
      }
      const response = await fetch(`${api()}/interactions/${id}`, {
        credentials: 'include',
        headers: { 'x-tooljet-oauth-origin': window.location.origin },
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
      const session = await fetch(`${api()}/interactions/${id}/session`, {
        credentials: 'include',
        headers: { 'tj-workspace-id': info.organizationId, 'x-tooljet-oauth-origin': window.location.origin },
      });
      if (!active) return;
      if (session.status === 401) {
        const key = `tj_mcp_login_${id}`;
        // Storage can be blocked by browser privacy settings. A manual sign-in
        // link still works, while avoiding an automatic login loop.
        try {
          if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, '1');
            window.location.assign(info.loginUrl);
            return;
          }
        } catch {
          // Keep the explicit sign-in link available.
        }
        setNeedsLogin(true);
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
      const response = await fetch(`${api()}/interactions/${id}`, {
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

  // Keep consent hidden during the session check and while leaving for login.
  if (!email && !error && !needsLogin) {
    return (
      <main className="mcp-oauth-page">
        <p role="status">Connecting to ToolJet…</p>
      </main>
    );
  }

  return (
    <main className="mcp-oauth-page">
      <section className="mcp-oauth-card" aria-labelledby="mcp-oauth-title">
        <p className="mcp-oauth-brand">ToolJet</p>
        <h1 id="mcp-oauth-title">{email && flow ? `Connect ${flow.clientName} to ToolJet` : 'Connect to ToolJet'}</h1>
        {error && (
          <p role="alert" className="mcp-oauth-error">
            {error}
          </p>
        )}
        {flow && email && (
          <>
            <p className="mcp-oauth-subtitle">
              <strong>{flow.clientName}</strong> is requesting access to <strong>{flow.organizationName}</strong>.
            </p>
            <div className="mcp-oauth-account">
              <span className="mcp-oauth-icon">
                <UserRound size={22} aria-hidden="true" />
              </span>
              <div>
                <p className="mcp-oauth-muted">Signed in as</p>
                <strong>{email}</strong>
              </div>
            </div>
            <section className="mcp-oauth-permissions" aria-labelledby="mcp-oauth-permissions-title">
              <h2 id="mcp-oauth-permissions-title">Requested permissions</h2>
              <ul>
                {flow.scopes.map((scope) => {
                  const { title, icon: Icon } = SCOPE_PRESENTATION[scope] || { title: scope, icon: Info };
                  return (
                    <li key={scope}>
                      <span className="mcp-oauth-icon">
                        <Icon size={22} aria-hidden="true" />
                      </span>
                      <div>
                        <h3>{title}</h3>
                        {SCOPE_LABELS[scope] && <p className="mcp-oauth-muted">{SCOPE_LABELS[scope]}.</p>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
            <div className="mcp-oauth-access-note">
              <Info size={20} aria-hidden="true" />
              <p>{flow.clientName} can make changes and deletions only within your existing workspace permissions.</p>
            </div>
            <p className="mcp-oauth-disconnect mcp-oauth-muted">
              You can disconnect it anytime in{' '}
              <a
                href={`${(window.public_config?.SUB_PATH || '').replace(/\/$/, '')}/${encodeURIComponent(
                  flow.organizationId
                )}/profile-settings`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Profile settings
              </a>
              .
            </p>
            <footer className="mcp-oauth-footer">
              <p className="mcp-oauth-trust-note mcp-oauth-muted">
                Only continue if you started this connection. Client names are supplied by the client.
              </p>
              <div className="mcp-oauth-actions">
                <button type="button" disabled={busy} onClick={() => decide(false)}>
                  Cancel
                </button>
                <button type="button" className="mcp-oauth-primary" disabled={busy} onClick={() => decide(true)}>
                  {busy ? 'Please wait…' : 'Allow access'}
                </button>
              </div>
            </footer>
          </>
        )}
        {flow && needsLogin && (
          <a className="mcp-oauth-signin" href={flow.loginUrl}>
            Sign in to this workspace
          </a>
        )}
      </section>
    </main>
  );
}
