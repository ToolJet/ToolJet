// What the right pane shows for a query picked in the change list: its code (as line diffs, or in
// full against an empty side when the query is new or gone) and its other settings.

const isEmpty = (value) =>
  value === undefined ||
  value === null ||
  value === '' ||
  (Array.isArray(value) && value.length === 0) ||
  (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0);

const humanize = (key) => {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

const show = (value) => {
  if (value === true) return 'on';
  if (value === false) return 'off';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  const text = JSON.stringify(value);
  return text.length > 80 ? `${text.slice(0, 79)}…` : text;
};

export function queryView(query, entries) {
  const owner = `query:${query.key}`;
  const code = entries.filter((entry) => entry.owner === owner);
  const codeIds = new Set(code.map((entry) => entry.id));
  const wholeQuery = (query.status === 'added' || query.status === 'removed') && !!query.options;
  const settings = wholeQuery
    ? Object.entries(query.options)
        .filter(([key, value]) => !codeIds.has(`${owner}|options.${key}`) && !isEmpty(value))
        .map(([key, value]) => ({ label: humanize(key), value: show(value) }))
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
