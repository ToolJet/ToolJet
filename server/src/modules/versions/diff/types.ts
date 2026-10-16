// Shapes for the structural diff between two app versions.
//
// Copying a version mints new ids for every page, component, query and event,
// so nothing is matched by id. Pages match by handle, components by page handle
// plus name, queries by name, and events by their source, event and position.
// Every uuid inside a version's JSON is rewritten to a stable reference
// (@component:name, @query:name, @page:handle) before values are compared.

export type LayoutBox = {
  top: number;
  left: number;
  width: number;
  height: number;
  dimensionUnit?: string;
  widthPx?: number | null;
  fillWidth?: boolean | null;
  grow?: number | null;
};

export type SnapshotComponent = {
  id: string;
  key: string;
  name: string;
  type: string;
  pageKey: string;
  parent: string | null;
  properties: Record<string, any>;
  styles: Record<string, any>;
  general: Record<string, any>;
  generalStyles: Record<string, any>;
  displayPreferences: Record<string, any>;
  validation: Record<string, any>;
  layouts: { desktop?: LayoutBox; mobile?: LayoutBox };
};

export type SnapshotPage = {
  id: string;
  key: string;
  name: string;
  handle: string;
  index: number;
  disabled: boolean;
  hidden: any;
  icon: string | null;
  isPageGroup: boolean;
  pageGroup: string | null;
  autoComputeLayout: boolean;
  pageHeader: any;
  pageFooter: any;
  type: string | null;
  url: string | null;
};

export type SnapshotQuery = {
  id: string;
  key: string;
  name: string;
  dataSource: string;
  type?: string | null;
  options: Record<string, any>;
};

export type SnapshotEvent = {
  id: string;
  key: string;
  target: string;
  source: string;
  eventId: string;
  name: string;
  definition: Record<string, any>;
};

export type VersionSnapshot = {
  versionId: string;
  name: string;
  status: string | null;
  homePage: string | null;
  showViewerNavigation: boolean;
  globalSettings: Record<string, any>;
  pageSettings: Record<string, any>;
  pages: SnapshotPage[];
  components: SnapshotComponent[];
  queries: SnapshotQuery[];
  events: SnapshotEvent[];
};

export type ChangeStatus = 'added' | 'removed' | 'changed' | 'unchanged';

export type ChangeGroup =
  | 'property'
  | 'style'
  | 'general'
  | 'validation'
  | 'display'
  | 'layout'
  | 'parent'
  | 'type'
  | 'page'
  | 'query'
  | 'settings'
  | 'event';

export type Change = {
  group: ChangeGroup;
  path: string;
  label: string;
  from?: any;
  to?: any;
  summary: string;
};

export type EventDiff = {
  key: string;
  status: Exclude<ChangeStatus, 'unchanged'>;
  eventId: string;
  summary: string;
  from?: Record<string, any>;
  to?: Record<string, any>;
};

export type ComponentDiff = {
  key: string;
  name: string;
  type: string;
  status: ChangeStatus;
  baseId?: string;
  targetId?: string;
  parent: { base: string | null; target: string | null };
  layouts: {
    base: { desktop?: LayoutBox; mobile?: LayoutBox };
    target: { desktop?: LayoutBox; mobile?: LayoutBox };
  };
  changes: Change[];
  events: EventDiff[];
};

export type PageDiff = {
  key: string;
  name: string;
  status: ChangeStatus;
  baseId?: string;
  targetId?: string;
  changes: Change[];
  events: EventDiff[];
  components: ComponentDiff[];
  counts: { added: number; removed: number; changed: number };
};

export type QueryDiff = {
  key: string;
  name: string;
  status: Exclude<ChangeStatus, 'unchanged'>;
  dataSource: string;
  // The kind of query (Run JavaScript, PostgreSQL), when the data source still exists.
  type?: string | null;
  changes: Change[];
  events: EventDiff[];
  // Only for added and removed queries: everything they hold, for the code view.
  options?: Record<string, any>;
};

export type VersionDiff = {
  base: { id: string; name: string; status: string | null };
  // fingerprint: the content shown, so an approval can name exactly what was reviewed.
  target: { id: string; name: string; status: string | null; fingerprint?: string };
  identical: boolean;
  summary: {
    pages: { added: number; removed: number; changed: number };
    components: { added: number; removed: number; changed: number };
    queries: { added: number; removed: number; changed: number };
    events: { added: number; removed: number; changed: number };
    settings: number;
  };
  settings: Change[];
  pages: PageDiff[];
  queries: QueryDiff[];
};
