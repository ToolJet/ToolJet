import React, { useEffect, useState } from 'react';
import { upperFirst } from 'lodash';
import { libraryQueryService } from '@/_services';
import { getWorkspaceId } from '@/_helpers/utils';
import { getSubpath } from '@/_helpers/routes';

// Only the consumers of this one library query, as { id, name, queries } entries.
const forQuery = (entries = [], libraryQueryId) =>
  entries
    .map((entry) => ({ ...entry, queries: entry.queries.filter((query) => query.libraryQueryId === libraryQueryId) }))
    .filter((entry) => entry.queries.length > 0);

function UsageGroup({ title, entries, workspaceId }) {
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
                <a
                  href={`${getSubpath() ?? ''}/${workspaceId || getWorkspaceId()}/apps/${entry.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {entry.name}
                </a>
                <span>
                  {` · ${query.appVersionName} · ${query.name} · ${
                    query.versionName
                  }${query.status === 'DRAFT' ? ' · Draft' : ''}${query.pinnedEnvironment ? ` · ${upperFirst(query.pinnedEnvironment)}` : ''}`}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </section>
  );
}

const UsageAside = ({ children }) => (
  <aside className="query-library-usage" data-cy="query-library-usage">
    {children}
  </aside>
);

const UsageNote = ({ children }) => <p className="query-library-usage__empty">{children}</p>;

const Unused = ({ workspaceId }) => (
  <UsageAside>
    <UsageGroup workspaceId={workspaceId} title="Used by apps" entries={[]} />
    <UsageGroup workspaceId={workspaceId} title="Used by modules" entries={[]} />
  </UsageAside>
);

export default function LibraryUsagePanel({ libraryQueryId, workspaceId }) {
  const [usage, setUsage] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!libraryQueryId) return;
    let ignore = false;
    setUsage(null);
    setFailed(false);
    libraryQueryService
      .getUsage({ workspaceId })
      .then((response) => !ignore && setUsage(response))
      .catch(() => !ignore && setFailed(true));
    return () => {
      ignore = true;
    };
  }, [libraryQueryId, workspaceId]);

  if (!libraryQueryId) return <Unused workspaceId={workspaceId} />;
  if (failed)
    return (
      <UsageAside>
        <UsageNote>Couldn&apos;t load usage</UsageNote>
      </UsageAside>
    );
  if (usage === null) return <UsageAside />;
  const apps = forQuery(usage.apps, libraryQueryId);
  const modules = forQuery(usage.modules, libraryQueryId);
  if (apps.length === 0 && modules.length === 0) return <Unused workspaceId={workspaceId} />;
  return (
    <UsageAside>
      <UsageGroup workspaceId={workspaceId} title="Used by apps" entries={apps} />
      <UsageGroup workspaceId={workspaceId} title="Used by modules" entries={modules} />
    </UsageAside>
  );
}
