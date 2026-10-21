import React, { useEffect, useState } from 'react';
import { dataqueryService } from '@/_services';
import { getWorkspaceId } from '@/_helpers/utils';

export default function LibraryUsagePanel({ versionId }) {
  const [apps, setApps] = useState(null);

  useEffect(() => {
    if (!versionId) return;
    dataqueryService
      .getLibraryUsage(versionId)
      .then(({ apps = [] }) => setApps(apps))
      .catch(() => setApps([]));
  }, [versionId]);

  if (apps === null) return null;
  return (
    <aside className="query-library-usage" data-cy="query-library-usage">
      <div className="query-library-usage__title">Used by ({apps.length})</div>
      {apps.length === 0 ? (
        <p className="query-library-usage__empty">No apps use this library yet.</p>
      ) : (
        <ul>
          {apps.map((app) => (
            <li key={app.id}>
              <a href={`/${getWorkspaceId()}/apps/${app.id}`} target="_blank" rel="noreferrer">
                {app.name}
              </a>
              <span className="query-library-usage__count">{app.queries.length}</span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
