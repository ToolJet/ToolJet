// Filtering for the template gallery: pure functions over the manifest list. The gallery memoises their results.
// OR within a group (any ticked category), AND across groups and search.

const matchesSearch = (template, query) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [template.name, template.description, ...(template.features ?? [])].some((text) =>
    text?.toLowerCase().includes(q)
  );
};
const matchesCategory = (template, categories) => !categories.size || categories.has(template.category);
const matchesSource = (template, sources) =>
  !sources.size || (template.sources ?? []).some((source) => sources.has(source.id));

export const filterTemplates = (templates, { query, categories, sources }) =>
  templates.filter((t) => matchesSearch(t, query) && matchesCategory(t, categories) && matchesSource(t, sources));

// Each option's count is how many templates have that option, given the search and the OTHER group's ticks.
// A group's own ticks are ignored, because ticking more options in one group widens the results (OR).
export function facetCounts(templates, { query, categories, sources }) {
  const searched = templates.filter((t) => matchesSearch(t, query));
  const category = {};
  for (const t of searched.filter((t) => matchesSource(t, sources))) {
    category[t.category] = (category[t.category] ?? 0) + 1;
  }
  const source = {};
  for (const t of searched.filter((t) => matchesCategory(t, categories))) {
    for (const s of t.sources ?? []) source[s.id] = (source[s.id] ?? 0) + 1;
  }
  return { category, source };
}

const byLabel = (a, b) => a.label.localeCompare(b.label);

export const categoryOptions = (templates, titles) =>
  [...new Set(templates.map((t) => t.category))].map((id) => ({ id, label: titles[id] || id })).sort(byLabel);

export const sourceOptions = (templates) =>
  [...new Map(templates.flatMap((t) => t.sources ?? []).map((s) => [s.id, { id: s.id, label: s.name }])).values()].sort(
    byLabel
  );

export const toDataCy = (text) => String(text).toLowerCase().replace(/\s+/g, '-');
