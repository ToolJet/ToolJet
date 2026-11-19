import queryString from 'query-string';

type SearchParamValue = string | number | boolean | null | undefined | ReadonlyArray<string | number | boolean | null>;

export type SearchParamsInput = Record<string, SearchParamValue>;

// Unset values (undefined, null, '', []) are dropped so callers can pass every possible param
// without branching; 0 and false are kept. Arrays serialize as `key=a,b`. No leading `?`.
export function buildSearchParams(params: SearchParamsInput): string {
  return queryString.stringify(params, { arrayFormat: 'comma', skipNull: true, skipEmptyString: true });
}
