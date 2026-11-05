// Preview runs a query on its own, so a query with parameters runs with their default values. When those are empty,
// a filter such as `status ilike {{parameters.status}}` matches nothing and Preview shows 0 or [], while the app (which
// passes its own values) shows real rows. Preview names the parameters that ran empty, so the result is not read as
// lost data.

const isBlank = (value) => value === undefined || value === null || (typeof value === 'string' && value.trim() === '');

/** The names of the query's declared parameters that this run gave no value. */
export const emptyPreviewParameters = (declared, values) => {
  if (!Array.isArray(declared)) return [];
  return declared
    .map((parameter) => parameter?.name)
    .filter((name) => typeof name === 'string' && name !== '')
    .filter((name) => isBlank(values?.[name]));
};

/** The note under Preview, or null when every parameter had a value. */
export const emptyParametersNote = (names) => {
  if (!names?.length) return null;
  const list = names.join(', ');
  return names.length === 1
    ? `Ran with an empty parameter (${list}). The app passes its own value when it runs this query.`
    : `Ran with empty parameters (${list}). The app passes its own values when it runs this query.`;
};
