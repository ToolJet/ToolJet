// Pure helpers for the bottom panel's split-view Inspector. The tree they read is the one built by
// useInspectorTreeData: root → categories (queries, components, …) → entries (a query, a component, …),
// where component entries may nest their child components.

export const ALL_CATEGORIES = 'all';

// Short labels for the category filter; the tree's own names carry qualifiers such as "(current page)".
export const CATEGORY_LABELS = {
  queries: 'Queries',
  components: 'Components',
  globals: 'Globals',
  variables: 'Variables',
  page: 'Page',
  constants: 'Constants',
  input: 'Input',
};

export const getCategoryLabel = (category) => CATEGORY_LABELS[category.id] ?? category.name;

const isPlaceholder = (entry) => Boolean(entry?.metadata?.noData);

// An entry matches when its own name does; otherwise it survives only through matching descendants.
const filterEntries = (entries = [], needle) =>
  entries.reduce((matches, entry) => {
    if (isPlaceholder(entry)) return matches;
    if (!needle || entry.name.toLowerCase().includes(needle)) return [...matches, entry];
    const children = filterEntries(entry.children, needle);
    return children.length ? [...matches, { ...entry, children }] : matches;
  }, []);

/**
 * Narrow the category list to one category and/or entries whose names contain the query.
 * "No data" placeholder children are always dropped; while searching, categories without matches are hidden.
 */
export const filterInspectorCategories = (categories = [], { query = '', category = ALL_CATEGORIES } = {}) => {
  const needle = query.trim().toLowerCase();
  return categories
    .filter((item) => category === ALL_CATEGORIES || item.id === category)
    .map((item) => ({ ...item, children: filterEntries(item.children, needle) }))
    .filter((item) => !needle || item.children.length > 0);
};

export const getEntryPath = (entry) => entry?.metadata?.path ?? entry?.id;

// True when `selectedPath` is the entry itself or a value inside it (e.g. components.table1.data).
export const isPathWithin = (selectedPath, entryPath) =>
  Boolean(selectedPath && entryPath) && (selectedPath === entryPath || selectedPath.startsWith(`${entryPath}.`));

// Entity-level actions (run query, go to component, …) only make sense on the entity, not a nested value.
export const isEntityPath = (path) => typeof path === 'string' && path.split('.').length === 2;

export const getPathCategory = (path) => (typeof path === 'string' ? path.split('.')[0] : null);
