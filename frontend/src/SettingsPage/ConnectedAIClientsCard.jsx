import React, { useEffect, useRef, useState } from 'react';
import config from 'config';
import { authHeader } from '@/_helpers';
import { authenticationService } from '@/_services';

const api = `${config.apiUrl}/mcp-oauth/connections`;

export default function ConnectedAIClientsCard() {
  const [connections, setConnections] = useState(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(null);
  const workspace = authenticationService.currentSessionValue?.current_organization_id;
  const currentWorkspace = useRef(workspace);
  currentWorkspace.current = workspace;
  useEffect(() => {
    setConnections(null);
    setError('');
    setPending(null);
    if (!workspace) return;
    let active = true;
    fetch(api, {
      credentials: 'include',
      headers: authHeader(false, workspace),
    })
      .then(async (response) => {
        if (response.status === 404) return null;
        if (!response.ok) throw new Error('Unable to load connected AI clients.');
        return response.json();
      })
      .then((data) => active && setConnections(data))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [workspace]);
  const disconnect = async (id) => {
    setPending(id);
    setError('');
    try {
      const response = await fetch(`${api}/${id}/revoke`, {
        method: 'POST',
        credentials: 'include',
        headers: { ...authHeader(false, workspace), 'x-tooljet-oauth': '1' },
      });
      if (!response.ok) throw new Error('Unable to disconnect this client. Please try again.');
      if (currentWorkspace.current === workspace) setConnections((items) => items?.filter((item) => item.id !== id));
    } catch (err) {
      if (currentWorkspace.current === workspace) setError(err.message);
    } finally {
      if (currentWorkspace.current === workspace) setPending(null);
    }
  };
  if (!connections && !error) return null;
  return (
    <div className="card profile-page-card tw-mt-16">
      <div className="card-body">
        <h3 className="card-title">Connected AI clients</h3>
        <p>Connections authorized by you in this workspace.</p>
        {error && (
          <p role="alert" className="text-danger">
            {error}
          </p>
        )}
        {connections?.length === 0 && <p>No connected AI clients.</p>}
        {connections?.map((connection) => (
          <div key={connection.id} className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <strong>{connection.client_name}</strong>
              <div className="text-muted">{connection.scopes.join(', ')}</div>
            </div>
            <button
              type="button"
              className="btn btn-outline-danger"
              aria-label={`Disconnect ${connection.client_name}`}
              disabled={pending !== null}
              onClick={() => disconnect(connection.id)}
            >
              {pending === connection.id ? 'Disconnecting…' : 'Disconnect'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
