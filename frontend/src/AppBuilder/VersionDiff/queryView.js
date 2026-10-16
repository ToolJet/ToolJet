// What the right pane shows for a query picked in the change list: its code (as line diffs, or in
// full when the query is new or gone) and its other settings, which the server describes.

export function queryView(query, entries) {
  const owner = `query:${query.key}`;
  const code = entries.filter((entry) => entry.owner === owner);
  const codeIds = new Set(code.map((entry) => entry.id));
  const wholeQuery = (query.status === 'added' || query.status === 'removed') && !!query.options;
  const settings = wholeQuery
    ? (query.settings ?? [])
        .filter((setting) => !codeIds.has(`${owner}|options.${setting.key}`))
        .map(({ label, value }) => ({ label, value }))
    : [
        ...(query.changes ?? [])
          .filter((change) => !codeIds.has(`${owner}|${change.path}`))
          .map((change) => ({ label: change.label, value: change.summary })),
        ...(query.events ?? [])
          .filter((event) => !codeIds.has(`${owner}|event:${event.key}`))
          .map((event) => ({ label: 'Event', value: event.summary })),
      ];
  return {
    key: query.key,
    name: query.name,
    type: query.type ?? null,
    dataSource: query.dataSource,
    status: query.status,
    wholeQuery,
    code,
    settings,
  };
}
