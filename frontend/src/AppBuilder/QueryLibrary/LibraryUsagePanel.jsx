import React, { useEffect, useState } from 'react';
import { dataqueryService } from '@/_services';
import { getWorkspaceId } from '@/_helpers/utils';
import { libraryAppUrl } from './queryLibraryApp';

// Only the consumers of this one library query, as { id, name, queries } entries.
const forQuery = (entries = [], libraryQueryId) =>
  entries
    .map((entry) => ({ ...entry, queries: entry.queries.filter((query) => query.libraryQueryId === libraryQueryId) }))
    .filter((entry) => entry.queries.length > 0);

function UsageGroup({ title, entries }) {
  return (
    <section className="query-library-usage__group">
      <div className="query-library-usage__title">{`${title} (${entries.length})`}</div>
      {entries.length === 0 ? (
        <p className="query-library-usage__empty">None</p>
      ) : (
        <ul>
          {entries.flatMap((entry) =>
            entry.queries.map((query) => (
              <li key={`${entry.id}-${query.id}`}>
                <a href={libraryAppUrl(`/${getWorkspaceId()}/apps/${entry.id}`)} target="_blank" rel="noreferrer">
                  {entry.name}
                </a>
                <span>
                  {` · ${query.appVersionName} · ${query.name} · ${
                    !query.versionName || query.versionName === 'draft' ? 'Draft' : query.versionName
                  }`}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </section>
  );
}

export default function LibraryUsagePanel({ versionId, libraryQueryId }) {
  const [usage, setUsage] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!versionId || !libraryQueryId) return;
    let ignore = false;
    setUsage(null);
    setFailed(false);
    dataqueryService
      .getLibraryUsage(versionId)
      .then((response) => !ignore && setUsage(response))
      .catch(() => !ignore && setFailed(true));
    return () => {
      ignore = true;
    };
  }, [versionId, libraryQueryId]);

  if (!libraryQueryId) return null;
  if (failed) {
    return (
      <aside className="query-library-usage" data-cy="query-library-usage">
        <p className="query-library-usage__empty">Couldn&apos;t load usage</p>
      </aside>
    );
  }
  if (usage === null) return null;
  return (
    <aside className="query-library-usage" data-cy="query-library-usage">
      <UsageGroup title="Used by apps" entries={forQuery(usage.apps, libraryQueryId)} />
      <UsageGroup title="Used by modules" entries={forQuery(usage.modules, libraryQueryId)} />
    </aside>
  );
}
