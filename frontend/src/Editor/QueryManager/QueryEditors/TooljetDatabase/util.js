import { get } from 'lodash';

/**
 * Checks if the queryOptions object contains a filter with an 'eq' (equal) operator and a value equal to '{{null}}'.
 *
 * @function hasEmptyStringOrNullValue
 * @param {Object} queryOptions - The query options object to check for the presence of the specified filter.
 * @property {Object} queryOptions.list_rows.where_filters - An object containing the filters to be checked.
 * @returns {boolean} - Returns true if the specified filter is found, false otherwise.
 *
 * @example
 * const queryOptions = {
 *   list_rows: {
 *     where_filters: {
 *       filter1: {
 *         operator: 'eq',
 *         value: '{{null}}',
 *       },
 *     },
 *   },
 * };
 *
 * const result = hasEmptyStringOrNullValue(queryOptions); // true
 */
export const hasEmptyStringOrNullValue = (queryOptions, operation) => {
  const filters = get(queryOptions, `${operation}.where_filters`);
  if (filters) {
    const filterKeys = Object.keys(filters);
    for (let i = 0; i < filterKeys.length; i++) {
      const filter = filters[filterKeys[i]];
      if (filter.operator !== 'is' && (filter.value === '' || filter.value === null)) {
        return true;
      }
    }
  }
  return false;
};

export const isOperatorOptions = [
  { value: 'null', label: 'null' },
  { value: 'notNull', label: 'not null' },
];

export const filterOperatorOptions = [
  { label: 'equals', value: '=' },
  { label: 'greater than', value: '>' },
  { label: 'greater than or equal', value: '>=' },
  { label: 'less than', value: '<' },
  { label: 'less than or equal', value: '<=' },
  { label: 'not equal', value: '!=' },
  { label: 'like', value: 'LIKE' },
  { label: 'not like', value: 'NOT LIKE' },
  { label: 'ilike', value: 'ILIKE' },
  { label: 'not ilike', value: 'NOT ILIKE' },
  { label: 'match', value: '~' },
  { label: 'imatch', value: '~*' },
  { label: 'in', value: 'IN' },
  { label: 'not in', value: 'NOT IN' },
  { label: 'is', value: 'IS' },
];

export const nullOperatorOptions = [
  { label: 'null', value: 'NULL' },
  { label: 'not null', value: 'NOT NULL' },
];
