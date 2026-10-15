import { LayoutBox, SnapshotComponent, SnapshotEvent, SnapshotPage, SnapshotQuery, VersionSnapshot } from './types';

// Raw rows as they come out of the database for one version.
export type VersionRows = {
  version: {
    id: string;
    name: string;
    status: string | null;
    homePageId: string | null;
    showViewerNavigation: boolean;
    globalSettings: any;
    pageSettings: any;
  };
  pages: Array<{
    id: string;
    name: string;
    handle: string;
    index: number;
    disabled: boolean;
    hidden: any;
    icon: string | null;
    isPageGroup: boolean;
    pageGroupId: string | null;
    autoComputeLayout: boolean;
    pageHeader: any;
    pageFooter: any;
    type: string | null;
    url: string | null;
  }>;
  components: Array<{
    id: string;
    name: string;
    type: string;
    pageId: string;
    parent: string | null;
    properties: any;
    styles: any;
    general: any;
    generalStyles: any;
    displayPreferences: any;
    validation: any;
  }>;
  layouts: Array<{
    componentId: string;
    type: string;
    top: number;
    left: number;
    width: number;
    height: number;
    dimensionUnit?: string;
    widthPx?: number | null;
    fillWidth?: boolean | null;
    grow?: number | null;
  }>;
  queries: Array<{ id: string; name: string; dataSourceId: string | null; options: any }>;
  dataSources: Array<{ id: string; name: string; kind: string }>;
  events: Array<{ id: string; name: string; index: number; event: any; sourceId: string; target: string }>;
};

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

const asObject = (value: any): Record<string, any> => {
  if (value == null) return {};
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return typeof value === 'object' ? value : {};
};

// Rewrites every known uuid in a JSON value to a reference that survives a
// version copy. Unknown uuids (data source ids shared by both versions,
// organization ids) are left alone, so they still compare equal.
export function makeRewriter(refs: Map<string, string>) {
  const rewriteString = (text: string) => text.replace(UUID, (match) => refs.get(match.toLowerCase()) ?? match);
  const rewrite = (value: any): any => {
    if (typeof value === 'string') return rewriteString(value);
    if (Array.isArray(value)) return value.map(rewrite);
    if (value && typeof value === 'object') {
      const out: Record<string, any> = {};
      for (const [key, inner] of Object.entries(value)) out[rewriteString(key)] = rewrite(inner);
      return out;
    }
    return value;
  };
  return rewrite;
}

const box = (row: VersionRows['layouts'][number]): LayoutBox => {
  const out: LayoutBox = { top: row.top, left: row.left, width: row.width, height: row.height };
  if (row.dimensionUnit && row.dimensionUnit !== 'count') out.dimensionUnit = row.dimensionUnit;
  if (row.widthPx != null) out.widthPx = row.widthPx;
  if (row.fillWidth != null) out.fillWidth = row.fillWidth;
  if (row.grow != null) out.grow = row.grow;
  return out;
};

export function buildSnapshot(rows: VersionRows): VersionSnapshot {
  const refs = new Map<string, string>();
  const pageKeyById = new Map<string, string>();

  for (const page of rows.pages) {
    const key = page.handle || page.name;
    pageKeyById.set(page.id, key);
    refs.set(page.id.toLowerCase(), `@page:${key}`);
  }
  for (const component of rows.components) refs.set(component.id.toLowerCase(), `@component:${component.name}`);
  for (const query of rows.queries) refs.set(query.id.toLowerCase(), `@query:${query.name}`);
  // Static data sources (REST, RunJS, ToolJet DB) are copied per version, so
  // their ids differ too. Global ones keep their id and need no rewrite.
  const KINDS: Record<string, string> = {
    tooljetdb: 'ToolJet Database',
    runjs: 'Run JavaScript',
    runpy: 'Run Python',
    restapi: 'REST API',
    workflows: 'Workflow',
  };
  const dataSourceLabel = new Map<string, string>();
  for (const source of rows.dataSources) {
    // Built-in sources carry internal names (tooljetdbdefault, runjsdefault).
    const builtIn = !source.name || source.name === source.kind || source.name === `${source.kind}default`;
    const label = builtIn ? (KINDS[source.kind] ?? source.kind) : source.name;
    dataSourceLabel.set(source.id, label);
    refs.set(source.id.toLowerCase(), `@datasource:${label}`);
  }

  const rewrite = makeRewriter(refs);

  const layoutsByComponent = new Map<string, { desktop?: LayoutBox; mobile?: LayoutBox }>();
  for (const layout of rows.layouts) {
    const entry = layoutsByComponent.get(layout.componentId) ?? {};
    if (layout.type === 'desktop' || layout.type === 'mobile') entry[layout.type] = box(layout);
    layoutsByComponent.set(layout.componentId, entry);
  }

  const pages: SnapshotPage[] = rows.pages
    .slice()
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .map((page) => ({
      id: page.id,
      key: pageKeyById.get(page.id),
      name: page.name,
      handle: page.handle,
      index: page.index,
      disabled: !!page.disabled,
      hidden: rewrite(page.hidden ?? null),
      icon: page.icon ?? null,
      isPageGroup: !!page.isPageGroup,
      pageGroup: page.pageGroupId ? rewrite(page.pageGroupId) : null,
      autoComputeLayout: !!page.autoComputeLayout,
      pageHeader: rewrite(page.pageHeader ?? null),
      pageFooter: rewrite(page.pageFooter ?? null),
      type: page.type ?? null,
      url: page.url ?? null,
    }));

  const components: SnapshotComponent[] = rows.components.map((component) => {
    const pageKey = pageKeyById.get(component.pageId) ?? component.pageId;
    return {
      id: component.id,
      key: `${pageKey}/${component.name}`,
      name: component.name,
      type: component.type,
      pageKey,
      parent: component.parent ? rewrite(component.parent).replace(/^@component:/, '') : null,
      properties: rewrite(asObject(component.properties)),
      styles: rewrite(asObject(component.styles)),
      general: rewrite(asObject(component.general)),
      generalStyles: rewrite(asObject(component.generalStyles)),
      displayPreferences: rewrite(asObject(component.displayPreferences)),
      validation: rewrite(asObject(component.validation)),
      layouts: layoutsByComponent.get(component.id) ?? {},
    };
  });

  const queries: SnapshotQuery[] = rows.queries.map((query) => ({
    id: query.id,
    key: query.name,
    name: query.name,
    dataSource: query.dataSourceId ? (dataSourceLabel.get(query.dataSourceId) ?? query.dataSourceId) : 'none',
    options: rewrite(asObject(query.options)),
  }));

  // Several handlers can share a source and an event (two actions on one
  // click). They are told apart by their order, not by their row index, which
  // has gaps after deletes.
  const ordinal = new Map<string, number>();
  const events: SnapshotEvent[] = rows.events
    .slice()
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .map((handler) => {
      const definition = rewrite(asObject(handler.event));
      const source = refs.get(String(handler.sourceId).toLowerCase()) ?? handler.sourceId;
      const eventId = definition.eventId ?? 'unknown';
      const base = `${handler.target}:${source}:${eventId}`;
      const n = (ordinal.get(base) ?? 0) + 1;
      ordinal.set(base, n);
      return {
        id: handler.id,
        key: `${base}#${n}`,
        target: handler.target,
        source,
        eventId,
        name: handler.name,
        definition,
      };
    });

  const version = rows.version;
  return {
    versionId: version.id,
    name: version.name,
    status: version.status ?? null,
    homePage: version.homePageId ? (pageKeyById.get(version.homePageId) ?? null) : null,
    showViewerNavigation: !!version.showViewerNavigation,
    globalSettings: rewrite(asObject(version.globalSettings)),
    pageSettings: rewrite(asObject(version.pageSettings)),
    pages,
    components,
    queries,
    events,
  };
}
