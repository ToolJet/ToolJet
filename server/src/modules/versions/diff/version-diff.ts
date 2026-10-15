import {
  Change,
  ChangeGroup,
  ComponentDiff,
  EventDiff,
  PageDiff,
  QueryDiff,
  SnapshotComponent,
  SnapshotEvent,
  SnapshotPage,
  VersionDiff,
  VersionSnapshot,
} from './types';
import { describeEvent, describeLayoutChange, describeValueChange, humanize, show, unwrap } from './describe';

const isPlainObject = (value: any) => !!value && typeof value === 'object' && !Array.isArray(value);

// A key that is missing on one side and empty on the other is not a change:
// ToolJet stores what the client sent and merges the widget's defaults on
// read, so older rows often lack keys that newer rows carry as empty.
export const isEmpty = (value: any): boolean => {
  if (value === undefined || value === null || value === '') return true;
  if (Array.isArray(value)) return value.length === 0;
  if (isPlainObject(value)) {
    const keys = Object.keys(value);
    if (keys.length === 0) return true;
    if (keys.every((key) => key === 'value' || key === 'fxActive')) return isEmpty(value.value);
  }
  return false;
};

export const stable = (value: any): string => {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (isPlainObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stable(value[key])}`)
      .join(',')}}`;
  }
  // Whitespace just inside {{ }} is formatting, not a change.
  if (typeof value === 'string') return JSON.stringify(value.replace(/\{\{\s+/g, '{{').replace(/\s+\}\}/g, '}}'));
  return JSON.stringify(value ?? null);
};

export const same = (a: any, b: any) => (isEmpty(a) && isEmpty(b)) || stable(a) === stable(b);

const binding = (value: any) => {
  const inner = unwrap(value);
  if (typeof inner !== 'string') return inner;
  const match = inner.match(/^\{\{\s*(true|false)\s*\}\}$/);
  return match ? match[1] === 'true' : inner;
};

function sectionChanges(group: ChangeGroup, prefix: string, from: Record<string, any>, to: Record<string, any>) {
  const changes: Change[] = [];
  const keys = new Set([...Object.keys(from ?? {}), ...Object.keys(to ?? {})]);
  for (const key of [...keys].sort()) {
    const a = from?.[key];
    const b = to?.[key];
    if (same(a, b)) continue;
    const label = humanize(key);
    let summary = describeValueChange(label, a, b);
    if (group === 'display' && (key === 'showOnDesktop' || key === 'showOnMobile')) {
      const where = key === 'showOnMobile' ? 'mobile' : 'desktop';
      summary =
        binding(b) === false ? `Now hidden on ${where}` : binding(b) === true ? `Now shown on ${where}` : summary;
    }
    if (group === 'property' && key === 'visibility') {
      summary = binding(b) === false ? 'Now hidden' : binding(b) === true ? 'Now visible' : summary;
    }
    if (group === 'property' && key === 'disabledState') {
      summary = binding(b) === true ? 'Now disabled' : binding(b) === false ? 'Now enabled' : summary;
    }
    changes.push({ group, path: `${prefix}.${key}`, label, from: a, to: b, summary });
  }
  return changes;
}

const lineCount = (value: any) => {
  const text = unwrap(value);
  return typeof text === 'string' ? text.split('\n') : null;
};

// Long text (SQL, code, request bodies) is summarised by line counts rather
// than quoted.
function queryOptionChanges(from: Record<string, any>, to: Record<string, any>) {
  return sectionChanges('query', 'options', from, to).map((change) => {
    const a = lineCount(change.from);
    const b = lineCount(change.to);
    if (a && b && (a.length > 1 || b.length > 1 || a.join('').length > 48 || b.join('').length > 48)) {
      const before = new Set(a.map((line) => line.trim()));
      const after = new Set(b.map((line) => line.trim()));
      const added = [...after].filter((line) => line && !before.has(line)).length;
      const removed = [...before].filter((line) => line && !after.has(line)).length;
      const parts = [added && `${added} line${added === 1 ? '' : 's'} added`, removed && `${removed} removed`].filter(
        Boolean
      );
      return { ...change, summary: `${change.label} edited${parts.length ? ` (${parts.join(', ')})` : ''}` };
    }
    return change;
  });
}

function eventDiffs(base: SnapshotEvent[], target: SnapshotEvent[]): EventDiff[] {
  const out: EventDiff[] = [];
  const before = new Map(base.map((event) => [event.key, event]));
  const after = new Map(target.map((event) => [event.key, event]));
  for (const event of target) {
    const old = before.get(event.key);
    if (!old)
      out.push({
        key: event.key,
        status: 'added',
        eventId: event.eventId,
        summary: `Added: ${describeEvent(event.definition)}`,
        to: event.definition,
      });
    else if (!same(old.definition, event.definition)) {
      const fields = [...new Set([...Object.keys(old.definition), ...Object.keys(event.definition)])]
        .filter((field) => !same(old.definition[field], event.definition[field]))
        .map((field) => humanize(field).toLowerCase());
      out.push({
        key: event.key,
        status: 'changed',
        eventId: event.eventId,
        summary: `Changed ${fields.join(', ')}: ${describeEvent(event.definition)}`,
        from: old.definition,
        to: event.definition,
      });
    }
  }
  for (const event of base) {
    if (!after.has(event.key))
      out.push({
        key: event.key,
        status: 'removed',
        eventId: event.eventId,
        summary: `Removed: ${describeEvent(event.definition)}`,
        from: event.definition,
      });
  }
  return out;
}

const groupBy = <T>(items: T[], key: (item: T) => string) => {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    map.set(k, [...(map.get(k) ?? []), item]);
  }
  return map;
};

function componentDiff(
  a: SnapshotComponent | undefined,
  b: SnapshotComponent | undefined,
  baseEvents: SnapshotEvent[],
  targetEvents: SnapshotEvent[],
  mobileIsComputed: boolean
): ComponentDiff {
  const subject = b ?? a;
  const diff: ComponentDiff = {
    key: subject.key,
    name: subject.name,
    type: subject.type,
    status: !a ? 'added' : !b ? 'removed' : 'unchanged',
    baseId: a?.id,
    targetId: b?.id,
    parent: { base: a?.parent ?? null, target: b?.parent ?? null },
    layouts: { base: a?.layouts ?? {}, target: b?.layouts ?? {} },
    changes: [],
    events: eventDiffs(baseEvents, targetEvents),
  };
  if (!a || !b) return diff;

  const changes: Change[] = [];
  if (a.type !== b.type)
    changes.push({
      group: 'type',
      path: 'type',
      label: 'Type',
      from: a.type,
      to: b.type,
      summary: `Replaced ${a.type} with ${b.type}`,
    });
  if ((a.parent ?? null) !== (b.parent ?? null)) {
    const where = (parent: string | null) => (parent ? parent : 'the page');
    changes.push({
      group: 'parent',
      path: 'parent',
      label: 'Container',
      from: a.parent,
      to: b.parent,
      summary: `Moved from ${where(a.parent)} into ${where(b.parent)}`,
    });
  }
  for (const kind of ['desktop', 'mobile'] as const) {
    // With auto-computed mobile layout the mobile boxes are derived from the
    // desktop ones, so reporting them would double every move.
    if (kind === 'mobile' && mobileIsComputed) continue;
    for (const summary of describeLayoutChange(kind, a.layouts[kind], b.layouts[kind])) {
      changes.push({
        group: 'layout',
        path: `layouts.${kind}`,
        label: 'Layout',
        from: a.layouts[kind],
        to: b.layouts[kind],
        summary,
      });
    }
  }
  changes.push(...sectionChanges('property', 'properties', a.properties, b.properties));
  changes.push(...sectionChanges('style', 'styles', a.styles, b.styles));
  changes.push(...sectionChanges('general', 'general', a.general, b.general));
  changes.push(...sectionChanges('style', 'generalStyles', a.generalStyles, b.generalStyles));
  changes.push(...sectionChanges('display', 'displayPreferences', a.displayPreferences, b.displayPreferences));
  changes.push(...sectionChanges('validation', 'validation', a.validation, b.validation));
  diff.changes = changes;
  if (changes.length || diff.events.length) diff.status = 'changed';
  return diff;
}

const PAGE_FIELDS: Array<[keyof SnapshotPage, string]> = [
  ['name', 'Name'],
  ['disabled', 'Disabled'],
  ['hidden', 'Hidden from navigation'],
  ['icon', 'Icon'],
  ['pageGroup', 'Page group'],
  ['autoComputeLayout', 'Auto mobile layout'],
  ['pageHeader', 'Page header'],
  ['pageFooter', 'Page footer'],
  ['type', 'Page type'],
  ['url', 'Link'],
];

function pageChanges(a: SnapshotPage, b: SnapshotPage, baseOrder: number, targetOrder: number): Change[] {
  const changes: Change[] = [];
  for (const [field, label] of PAGE_FIELDS) {
    if (same(a[field], b[field])) continue;
    const summary =
      typeof b[field] === 'boolean'
        ? `${label} turned ${b[field] ? 'on' : 'off'}`
        : field === 'pageHeader' || field === 'pageFooter' || field === 'hidden'
          ? `${label} changed`
          : describeValueChange(label, a[field], b[field]);
    changes.push({ group: 'page', path: String(field), label, from: a[field], to: b[field], summary });
  }
  if (baseOrder !== targetOrder)
    changes.push({
      group: 'page',
      path: 'index',
      label: 'Position',
      from: baseOrder + 1,
      to: targetOrder + 1,
      summary: `Moved from position ${baseOrder + 1} to ${targetOrder + 1} in the page list`,
    });
  return changes;
}

function settingsChanges(base: VersionSnapshot, target: VersionSnapshot): Change[] {
  const changes: Change[] = [];
  const globals = { ...base.globalSettings, ...target.globalSettings };
  for (const key of Object.keys(globals).sort()) {
    const a = base.globalSettings[key];
    const b = target.globalSettings[key];
    if (same(a, b)) continue;
    let summary = describeValueChange(humanize(key), a, b);
    if (key === 'theme') {
      const from = a?.name;
      const to = b?.name;
      summary =
        from && to && from !== to
          ? `Theme changed from "${from}" to "${to}"`
          : `Theme ${to ? `"${to}" ` : ''}colours or fonts changed`;
    }
    changes.push({ group: 'settings', path: `globalSettings.${key}`, label: humanize(key), from: a, to: b, summary });
  }
  for (const change of sectionChanges('settings', 'pageSettings', base.pageSettings, target.pageSettings)) {
    changes.push({
      ...change,
      summary: `Navigation: ${change.summary.charAt(0).toLowerCase()}${change.summary.slice(1)}`,
    });
  }
  if ((base.homePage ?? null) !== (target.homePage ?? null))
    changes.push({
      group: 'settings',
      path: 'homePage',
      label: 'Home page',
      from: base.homePage,
      to: target.homePage,
      summary: `Home page changed from ${show(base.homePage)} to ${show(target.homePage)}`,
    });
  if (base.showViewerNavigation !== target.showViewerNavigation)
    changes.push({
      group: 'settings',
      path: 'showViewerNavigation',
      label: 'Page navigation',
      from: base.showViewerNavigation,
      to: target.showViewerNavigation,
      summary: `Page navigation ${target.showViewerNavigation ? 'shown' : 'hidden'}`,
    });
  return changes;
}

const ORDER = { added: 0, changed: 1, removed: 2, unchanged: 3 };
const count = (items: Array<{ status: string }>) => ({
  added: items.filter((item) => item.status === 'added').length,
  removed: items.filter((item) => item.status === 'removed').length,
  changed: items.filter((item) => item.status === 'changed').length,
});

export function diffVersions(
  base: VersionSnapshot,
  target: VersionSnapshot,
  options: { includeUnchanged?: boolean } = {}
): VersionDiff {
  // Events hang off the thing that fires them, so the change list can show
  // "Submit button: on click now runs create_deal" under the button.
  const ownerOf = (snapshot: VersionSnapshot) => {
    const componentByName = new Map(snapshot.components.map((component) => [component.name, component]));
    return (event: SnapshotEvent) => {
      const [kind, ...rest] = event.source.replace(/^@/, '').split(':');
      const name = rest.join(':');
      if (kind === 'component') return `component:${componentByName.get(name)?.key ?? name}`;
      if (kind === 'query') return `query:${name}`;
      if (kind === 'page') return `page:${name}`;
      return `other:${event.source}`;
    };
  };
  const baseEvents = groupBy(base.events, ownerOf(base));
  const targetEvents = groupBy(target.events, ownerOf(target));

  const basePages = new Map(base.pages.map((page) => [page.key, page]));
  const targetPages = new Map(target.pages.map((page) => [page.key, page]));
  const baseOrder = new Map(base.pages.map((page, i) => [page.key, i]));
  const targetOrder = new Map(target.pages.map((page, i) => [page.key, i]));
  const baseComponents = groupBy(base.components, (component) => component.pageKey);
  const targetComponents = groupBy(target.components, (component) => component.pageKey);

  const pageKeys = [
    ...target.pages.map((page) => page.key),
    ...base.pages.map((page) => page.key).filter((key) => !targetPages.has(key)),
  ];
  const pages: PageDiff[] = pageKeys.map((key) => {
    const a = basePages.get(key);
    const b = targetPages.get(key);
    const subject = b ?? a;
    const mobileIsComputed = !!(b ?? a).autoComputeLayout;
    const before = new Map((baseComponents.get(key) ?? []).map((component) => [component.name, component]));
    const after = new Map((targetComponents.get(key) ?? []).map((component) => [component.name, component]));
    const names = [...after.keys(), ...[...before.keys()].filter((name) => !after.has(name))];
    const components = names
      .map((name) => {
        const componentKey = `${key}/${name}`;
        return componentDiff(
          before.get(name),
          after.get(name),
          baseEvents.get(`component:${componentKey}`) ?? [],
          targetEvents.get(`component:${componentKey}`) ?? [],
          mobileIsComputed
        );
      })
      .filter((component) => options.includeUnchanged || component.status !== 'unchanged')
      .sort((x, y) => ORDER[x.status] - ORDER[y.status] || x.name.localeCompare(y.name));
    const events = eventDiffs(baseEvents.get(`page:${key}`) ?? [], targetEvents.get(`page:${key}`) ?? []);
    const changes = a && b ? pageChanges(a, b, baseOrder.get(key), targetOrder.get(key)) : [];
    const counts = count(components);
    const status = !a
      ? 'added'
      : !b
        ? 'removed'
        : changes.length || events.length || counts.added + counts.removed + counts.changed
          ? 'changed'
          : 'unchanged';
    return { key, name: subject.name, status, baseId: a?.id, targetId: b?.id, changes, events, components, counts };
  });

  const baseQueries = new Map(base.queries.map((query) => [query.key, query]));
  const targetQueries = new Map(target.queries.map((query) => [query.key, query]));
  const queryKeys = [
    ...target.queries.map((query) => query.key),
    ...base.queries.map((query) => query.key).filter((key) => !targetQueries.has(key)),
  ];
  const queries: QueryDiff[] = queryKeys
    .map((key) => {
      const a = baseQueries.get(key);
      const b = targetQueries.get(key);
      const subject = b ?? a;
      const events = eventDiffs(baseEvents.get(`query:${key}`) ?? [], targetEvents.get(`query:${key}`) ?? []);
      const changes: Change[] = [];
      if (a && b && a.dataSource !== b.dataSource)
        changes.push({
          group: 'query',
          path: 'dataSource',
          label: 'Data source',
          from: a.dataSource,
          to: b.dataSource,
          summary: `Data source changed from ${a.dataSource} to ${b.dataSource}`,
        });
      if (a && b) changes.push(...queryOptionChanges(a.options, b.options));
      const status = !a ? 'added' : !b ? 'removed' : changes.length || events.length ? 'changed' : 'unchanged';
      return { key, name: subject.name, status, dataSource: subject.dataSource, changes, events } as
        | QueryDiff
        | { status: 'unchanged' };
    })
    .filter((query): query is QueryDiff => query.status !== 'unchanged')
    .sort((x, y) => ORDER[x.status] - ORDER[y.status] || x.name.localeCompare(y.name));

  const settings = settingsChanges(base, target);
  const allComponents = pages.flatMap((page) => page.components);
  const allEvents = [
    ...pages.flatMap((page) => page.events),
    ...allComponents.flatMap((component) => component.events),
    ...queries.flatMap((query) => query.events),
  ];
  const summary = {
    pages: count(pages),
    components: count(allComponents),
    queries: count(queries),
    events: count(allEvents),
    settings: settings.length,
  };
  const identical = settings.length === 0 && queries.length === 0 && pages.every((page) => page.status === 'unchanged');

  return {
    base: { id: base.versionId, name: base.name, status: base.status },
    target: { id: target.versionId, name: target.name, status: target.status },
    identical,
    summary,
    settings,
    pages: options.includeUnchanged ? pages : pages.filter((page) => page.status !== 'unchanged'),
    queries,
  };
}
