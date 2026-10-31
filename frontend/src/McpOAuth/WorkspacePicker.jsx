import React from 'react';

export default function WorkspacePicker({ workspaces, workspace, onChange, busy }) {
  return (
    <div className="mcp-oauth-picker">
      {workspaces?.length ? (
        <label>
          Workspace
          <select value={workspace} disabled={busy} onChange={(event) => onChange(event.target.value)}>
            <option value="">Select a workspace</option>
            {workspaces.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p>No active workspaces are available for this account. Contact your workspace administrator.</p>
      )}
    </div>
  );
}
