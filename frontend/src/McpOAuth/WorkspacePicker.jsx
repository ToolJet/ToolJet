import React, { useEffect, useState } from 'react';

export default function WorkspacePicker({ flow, endpoint }) {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState('');
  const [manual, setManual] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch(`${endpoint}/workspaces`, {
      credentials: 'include',
      headers: { 'x-tooljet-oauth-origin': window.location.origin },
    })
      .then(async (response) => {
        if (response.status === 401) return;
        if (!response.ok) throw new Error('Unable to load your workspaces. Start again from your AI client.');
        const result = await response.json();
        if (active) {
          setAccount(result);
          if (result.workspaces.length === 1) setWorkspace(result.workspaces[0].id);
        }
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [endpoint]);

  const submit = async (cancel = false) => {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`${endpoint}/${cancel ? 'cancel' : 'workspace'}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-tooljet-oauth-csrf': flow.csrfToken },
        body: JSON.stringify(cancel ? {} : { workspace: workspace.trim() }),
      });
      if (!response.ok)
        throw new Error(
          response.status === 400 && !cancel
            ? 'This workspace or connection link is unavailable. Check the workspace URL or start again from your AI client.'
            : 'Unable to continue this connection. Start again from your AI client.'
        );
      const result = await response.json();
      window.location.assign(result.redirectUrl);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  if (loading) return <p role="status">Checking your ToolJet account…</p>;

  return (
    <div className="mcp-oauth-picker">
      <h2>{account && !manual ? 'Choose a workspace' : 'Connect your workspace'}</h2>
      <p className="mcp-oauth-muted">
        Connect {flow.clientName} to one workspace. You will review permissions before approving.
      </p>
      {error && (
        <p role="alert" className="mcp-oauth-error">
          {error}
        </p>
      )}
      {account && (
        <p>
          Signed in as <strong>{account.email}</strong>
        </p>
      )}
      {!account && !manual && (
        <a className="mcp-oauth-signin mcp-oauth-primary" href={flow.loginUrl}>
          Sign in to ToolJet
        </a>
      )}
      {account &&
        !manual &&
        (account.workspaces.length ? (
          <label>
            Workspace
            <select value={workspace} disabled={busy} onChange={(event) => setWorkspace(event.target.value)}>
              <option value="">Select a workspace</option>
              {account.workspaces.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p>
            No active workspaces are available for this account. Sign in with another account or contact your workspace
            administrator.
          </p>
        ))}
      {manual && (
        <label>
          Workspace URL, ID or slug
          <input
            autoFocus
            value={workspace}
            disabled={busy}
            onChange={(event) => setWorkspace(event.target.value)}
            placeholder="Paste your ToolJet workspace URL"
            autoComplete="off"
          />
          <span className="mcp-oauth-muted">Continue to your workspace’s sign-in page, including company SSO.</span>
        </label>
      )}
      {(manual || account?.workspaces.length > 0) && (
        <p className="mcp-oauth-muted">Your workspace may require its own SSO or a fresh sign-in.</p>
      )}
      <div className="mcp-oauth-actions">
        <button type="button" disabled={busy} onClick={() => submit(true)}>
          Cancel
        </button>
        {(manual || account?.workspaces.length > 0) && (
          <button
            type="button"
            className="mcp-oauth-primary"
            disabled={busy || !workspace.trim()}
            onClick={() => submit()}
          >
            {busy ? 'Please wait…' : 'Continue'}
          </button>
        )}
      </div>
      <div className="mcp-oauth-picker-links">
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setManual(!manual);
            setWorkspace('');
            setError('');
          }}
        >
          {manual ? 'Back' : 'Sign in with your workspace'}
        </button>
        {account && <a href={flow.loginUrl}>Use another account</a>}
      </div>
    </div>
  );
}
