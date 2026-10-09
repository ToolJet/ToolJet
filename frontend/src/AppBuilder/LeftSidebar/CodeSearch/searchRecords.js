// Matches a term against the rows from buildSearchRecords and groups the hits for display:
// group (page / Queries / App) → entity → one row per field, every occurrence in that row.
// Pure, like buildSearchRecords, so both can move into a Web Worker together.

export const MIN_TERM_LENGTH = 2;
export const MAX_RESULTS = 1000; // field rows
export const RESULT_TYPES = ['component', 'query', 'event', 'page', 'app'];
const PREVIEW_LEAD = 10; // characters kept before the first match, so the match is always in view
const PREVIEW_LENGTH = 160; // wider than the panel on purpose; CSS ellipsis does the visual cut

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Returns a global RegExp for the term, or { error } when the user's regex does not compile.
export const buildMatcher = (term, { caseSensitive = false, wholeWord = false, regex = false } = {}) => {
  const source = regex ? term : escapeRegExp(term);
  try {
    return { matcher: new RegExp(wholeWord ? `\\b(?:${source})\\b` : source, caseSensitive ? 'g' : 'gi') };
  } catch {
    return { error: 'Invalid regular expression' };
  }
};

const findMatches = (matcher, text) => {
  const matches = [];
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

// Text segments for one row: starts just before the first match, every match inside is marked.
// Whitespace runs collapse to one space so multi-line code previews as one line.
export const buildPreview = (text, matches) => {
  const from = Math.max(0, matches[0].start - PREVIEW_LEAD);
  const to = Math.min(text.length, from + PREVIEW_LENGTH);
  const clean = (value) => value.replace(/\s+/g, ' ');
  const segments = from > 0 ? [{ text: '…', match: false }] : [];
  let cursor = from;
  for (const { start, end } of matches) {
    if (start >= to) break;
    if (start > cursor) segments.push({ text: clean(text.slice(cursor, start)), match: false });
    segments.push({ text: clean(text.slice(start, Math.min(end, to))), match: true });
    cursor = Math.min(end, to);
  }
  if (cursor < to) segments.push({ text: clean(text.slice(cursor, to)), match: false });
  return segments;
};

const groupKeyOf = (record) =>
  record.pageId ? `page:${record.pageId}` : record.entityType === 'app' ? 'app' : 'queries';

export const searchRecords = (
  records,
  term,
  { caseSensitive = false, wholeWord = false, regex = false, type = 'all', currentPageOnly = false } = {},
  { currentPageId = null, pages = [] } = {}
) => {
  const typeCounts = Object.fromEntries(['all', ...RESULT_TYPES].map((key) => [key, 0]));
  const empty = { groups: [], rows: [], total: 0, fieldCount: 0, truncated: false, typeCounts, error: null };
  if (!term || term.length < MIN_TERM_LENGTH) return empty;

  const { matcher, error } = buildMatcher(term, { caseSensitive, wholeWord, regex });
  if (error) return { ...empty, error };

  // Current-page scope narrows the search itself; the type filter only narrows what is shown,
  // so chip counts always tell the user what a filter hides.
  const inScope = currentPageOnly ? (record) => record.pageId === currentPageId : () => true;

  const rows = [];
  let total = 0;
  let fieldCount = 0;
  for (const record of records) {
    if (!inScope(record)) continue;
    const matches = findMatches(matcher, record.text);
    if (!matches.length) continue;
    typeCounts.all += matches.length;
    typeCounts[record.entityType] += matches.length;
    if (type !== 'all' && record.entityType !== type) continue;
    total += matches.length;
    fieldCount++;
    if (rows.length < MAX_RESULTS) rows.push({ record, matches, preview: buildPreview(record.text, matches) });
  }

  const groups = new Map();
  for (const row of rows) {
    const { record } = row;
    const groupKey = groupKeyOf(record);
    if (!groups.has(groupKey))
      groups.set(groupKey, { key: groupKey, pageId: record.pageId, count: 0, entities: new Map() });
    const group = groups.get(groupKey);
    // Events display under the component / query / page that owns them.
    const entityId = record.ownerId || record.entityId;
    if (!group.entities.has(entityId)) {
      group.entities.set(entityId, {
        entityId,
        entityType: record.ownerType || record.entityType,
        entityName: record.entityName,
        entitySubtype: record.entitySubtype,
        componentType: record.componentType,
        query: record.query,
        defined: false,
        count: 0,
        rows: [],
      });
    }
    const entity = group.entities.get(entityId);
    entity.rows.push(row);
    entity.count += row.matches.length;
    group.count += row.matches.length;
  }

  const sameName = (name) => (caseSensitive ? name === term : String(name).toLowerCase() === term.toLowerCase());
  const pageOrder = new Map(pages.map((page, index) => [page.id, index]));
  const groupRank = (group) => {
    if (group.entities[0]?.defined) return -2;
    if (group.pageId === currentPageId) return -1;
    if (group.pageId) return pageOrder.get(group.pageId) ?? pages.length;
    return group.key === 'queries' ? pages.length + 1 : pages.length + 2;
  };

  const sortedGroups = [...groups.values()]
    .map((group) => {
      const entities = [...group.entities.values()];
      for (const entity of entities) entity.defined = sameName(entity.entityName);
      // The entity the term names is pinned first: "defined here", everything else references it.
      entities.sort((a, b) => Number(b.defined) - Number(a.defined));
      return { ...group, entities };
    })
    .sort((a, b) => groupRank(a) - groupRank(b));

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
