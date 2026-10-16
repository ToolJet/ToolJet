// Matches a term against the rows from buildSearchRecords and groups the hits for display:
// section (Components / Queries / Events / Pages & app) → entity → one row per field, every
// occurrence in that row.
// Pure, like buildSearchRecords; both run in the code-search worker (codeSearch.worker.ts).

import {
  buildSearchRecords,
  type EntityType,
  type PlainDefs,
  type SearchInput,
  type SearchRecord,
} from './buildSearchRecords';
import { replaceIdsWithName } from '@/AppBuilder/_stores/utils/replaceIdsWithName';

export interface MatchOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  regex?: boolean;
}

export interface SearchFilters extends MatchOptions {
  type?: 'all' | EntityType;
  currentPageOnly?: boolean;
}

export interface Match {
  start: number;
  end: number;
  occurrence: number;
}

// One clicked occurrence: what navigation opens and highlights.
export type SearchMatch = Match & { record: SearchRecord };

export interface PreviewSegment {
  text: string;
  match: boolean;
  occurrence?: number;
}

export interface ResultRow {
  record: SearchRecord;
  matches: Match[];
  preview: PreviewSegment[];
}

export interface ResultEntity {
  entityId: string;
  entityType: EntityType;
  entityName: string;
  entitySubtype?: string;
  componentType?: string;
  query?: SearchRecord['query'];
  // The page a component (or an event's owner) is on; shown as a tag, since sections don't split by page.
  pageId?: string | null;
  defined: boolean;
  count: number;
  rows: ResultRow[];
}

export type SectionKey = 'components' | 'queries' | 'events' | 'pages';

export interface ResultGroup {
  key: SectionKey;
  count: number;
  entities: ResultEntity[];
}

export interface SearchResult {
  groups: ResultGroup[];
  rows: ResultRow[];
  total: number;
  fieldCount: number;
  truncated: boolean;
  typeCounts: Record<'all' | EntityType, number>;
  error: string | null;
}

// A page as the searcher needs it: its id for ordering, plus whatever buildSearchRecords reads.
type SearchPage = { id: string; components?: Record<string, { component?: { name?: string } }> };

// What the panel posts: the app definition (only when it changed) and the search to run.
export interface SearchInputDefinition extends Omit<SearchInput, 'pages' | 'translate' | keyof PlainDefs> {
  pages: SearchPage[];
  queryIdNameMapping?: Record<string, string>;
  defs: PlainDefs;
}

export interface SearchRequest {
  input?: SearchInputDefinition;
  term: string;
  filters?: SearchFilters;
  currentPageId?: string | null;
}

export const MIN_TERM_LENGTH = 2;
export const MAX_RESULTS = 1000; // field rows
export const RESULT_TYPES: EntityType[] = ['component', 'query', 'event', 'page', 'app'];
const PREVIEW_LEAD = 10; // characters kept before the first match, so the match is always in view
const PREVIEW_LENGTH = 160; // wider than the panel on purpose; CSS ellipsis does the visual cut

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Returns a global RegExp for the term, or { error } when the user's regex does not compile.
export const buildMatcher = (
  term: string,
  { caseSensitive = false, wholeWord = false, regex = false }: MatchOptions = {}
): { matcher?: RegExp; error?: string } => {
  const source = regex ? term : escapeRegExp(term);
  try {
    return { matcher: new RegExp(wholeWord ? `\\b(?:${source})\\b` : source, caseSensitive ? 'g' : 'gi') };
  } catch {
    return { error: 'Invalid regular expression' };
  }
};

const findMatches = (matcher: RegExp, text: string) => {
  const matches: Match[] = [];
  matcher.lastIndex = 0;
  let hit;
  while ((hit = matcher.exec(text)) !== null) {
    if (hit[0] === '') {
      matcher.lastIndex++; // zero-width regex (e.g. `^`) would loop forever
      continue;
    }
    matches.push({ start: hit.index, end: hit.index + hit[0].length, occurrence: matches.length });
  }
  return matches;
};

// Where the preview starts: after the last separator in the lead before the first match, so it opens
// on the matched token (`email: 'olivia…`, not `…05/2022', email:`). No separator → a fixed lead,
// cut mid-token, so only that start is marked with `…`.
const PREVIEW_BREAK = /[\s,;{}()[\]]/;
const previewStart = (text: string, matchStart: number) => {
  const leadFrom = Math.max(0, matchStart - PREVIEW_LEAD);
  for (let i = matchStart - 1; i >= leadFrom; i--) if (PREVIEW_BREAK.test(text[i])) return { from: i + 1, cut: false };
  return { from: leadFrom, cut: leadFrom > 0 };
};

// Text segments for one row: starts on the first match's token, every match inside is marked.
// Whitespace runs collapse to one space so multi-line code previews as one line.
// A title (a row with no short label, e.g. `Row clicked → Show Alert`) is shown whole.
export const buildPreview = (text: string, matches: Match[], { title = false } = {}): PreviewSegment[] => {
  const { from, cut } = title ? { from: 0, cut: false } : previewStart(text, matches[0].start);
  const to = Math.min(text.length, from + PREVIEW_LENGTH);
  const clean = (value: string) => value.replace(/\s+/g, ' ');
  const segments: PreviewSegment[] = cut ? [{ text: '…', match: false }] : [];
  let cursor = from;
  for (const { start, end, occurrence } of matches) {
    if (start >= to) break;
    if (start > cursor) segments.push({ text: clean(text.slice(cursor, start)), match: false });
    segments.push({ text: clean(text.slice(start, Math.min(end, to))), match: true, occurrence });
    cursor = Math.min(end, to);
  }
  if (cursor < to) segments.push({ text: clean(text.slice(cursor, to)), match: false });
  return segments;
};

// Fixed section order; pages and app-wide settings share the last one.
const SECTION_ORDER: SectionKey[] = ['components', 'queries', 'events', 'pages'];
export const SECTION_OF: Record<EntityType, SectionKey> = {
  component: 'components',
  query: 'queries',
  event: 'events',
  page: 'pages',
  app: 'pages',
};

export const searchRecords = (
  records: SearchRecord[],
  term: string,
  {
    caseSensitive = false,
    wholeWord = false,
    regex = false,
    type = 'all',
    currentPageOnly = false,
  }: SearchFilters = {},
  { currentPageId = null, pages = [] }: { currentPageId?: string | null; pages?: { id: string }[] } = {}
): SearchResult => {
  const typeCounts = Object.fromEntries(['all', ...RESULT_TYPES].map((key) => [key, 0])) as SearchResult['typeCounts'];
  const empty: SearchResult = {
    groups: [],
    rows: [],
    total: 0,
    fieldCount: 0,
    truncated: false,
    typeCounts,
    error: null,
  };
  if (!term || term.length < MIN_TERM_LENGTH) return empty;

  const { matcher, error } = buildMatcher(term, { caseSensitive, wholeWord, regex });
  if (error) return { ...empty, error };

  // Current-page scope narrows the search itself; the type filter only narrows what is shown,
  // so chip counts always tell the user what a filter hides.
  const inScope = currentPageOnly ? (record: SearchRecord) => record.pageId === currentPageId : () => true;

  const rows: ResultRow[] = [];
  let total = 0;
  let fieldCount = 0;
  for (const record of records) {
    if (!inScope(record)) continue;
    const matches = findMatches(matcher as RegExp, record.text);
    if (!matches.length) continue;
    typeCounts.all += matches.length;
    typeCounts[record.entityType] += matches.length;
    if (type !== 'all' && record.entityType !== type) continue;
    total += matches.length;
    fieldCount++;
    if (rows.length < MAX_RESULTS)
      rows.push({ record, matches, preview: buildPreview(record.text, matches, { title: !record.shortLabel }) });
  }

  // Entities are keyed by id while grouping, then listed in display order.
  type GroupDraft = Omit<ResultGroup, 'entities'> & { entities: Map<string, ResultEntity> };
  const groups = new Map<SectionKey, GroupDraft>();
  for (const row of rows) {
    const { record } = row;
    const groupKey = SECTION_OF[record.entityType];
    if (!groups.has(groupKey)) groups.set(groupKey, { key: groupKey, count: 0, entities: new Map() });
    const group = groups.get(groupKey) as GroupDraft;
    // In Events, handlers are listed under the component / query / page that owns them.
    const entityId = record.ownerId || record.entityId;
    if (!group.entities.has(entityId)) {
      group.entities.set(entityId, {
        entityId,
        entityType: record.ownerType || record.entityType,
        entityName: record.entityName,
        entitySubtype: record.entitySubtype,
        componentType: record.componentType,
        query: record.query,
        pageId: record.pageId,
        defined: false,
        count: 0,
        rows: [],
      });
    }
    const entity = group.entities.get(entityId) as ResultEntity;
    entity.rows.push(row);
    entity.count += row.matches.length;
    group.count += row.matches.length;
  }

  const sameName = (name: string) =>
    caseSensitive ? name === term : String(name).toLowerCase() === term.toLowerCase();
  const pageOrder = new Map(pages.map((page, index) => [page.id, index]));
  // The entity the term names first ("defined here"; everything else references it), then the
  // current page's, then by page order; app-wide entities (no page) last.
  const entityRank = (entity: ResultEntity) => {
    if (entity.defined) return -2;
    if (entity.pageId && entity.pageId === currentPageId) return -1;
    return entity.pageId ? pageOrder.get(entity.pageId) ?? pages.length : pages.length + 1;
  };

  const sortedGroups: ResultGroup[] = SECTION_ORDER.flatMap((key) => {
    const group = groups.get(key);
    if (!group) return [];
    const entities = [...group.entities.values()];
    for (const entity of entities) entity.defined = sameName(entity.entityName);
    entities.sort((a, b) => entityRank(a) - entityRank(b));
    return [{ ...group, entities }];
  });

  // Rows in display order, for keyboard navigation and the flat list view.
  const orderedRows = sortedGroups.flatMap((group) => group.entities.flatMap((entity) => entity.rows));

  return {
    groups: sortedGroups,
    rows: orderedRows,
    total,
    fieldCount,
    truncated: fieldCount > rows.length,
    typeCounts,
    error: null,
  };
};

// One search session: `input` (the app definition, see CodeSearch.jsx) rebuilds the records; a
// search without it reuses the last ones, so only definition changes pay for indexing. Page order
// comes from the indexed pages, so a search only sends `currentPageId`.
export const createSearcher = () => {
  let records: SearchRecord[] = [];
  let pages: SearchPage[] = [];
  return ({ input, term, filters, currentPageId }: SearchRequest): SearchResult => {
    if (input) {
      const { queryIdNameMapping, defs, ...rest } = input;
      pages = input.pages;
      const mappings = {
        components: Object.fromEntries(
          pages.flatMap((page) =>
            Object.entries(page.components || {}).map(([id, { component } = {}]) => [id, component?.name])
          )
        ),
        queries: queryIdNameMapping || {},
      };
      records = buildSearchRecords({ ...rest, ...defs, translate: (text) => replaceIdsWithName(text, mappings) });
    }
    return searchRecords(records, term, filters, { currentPageId, pages });
  };
};
