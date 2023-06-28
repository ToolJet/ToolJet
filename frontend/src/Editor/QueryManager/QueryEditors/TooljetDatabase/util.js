import { get } from 'lodash';
/**
 * Checks if the queryOptions object contains a filter with an 'eq' (equal) operator and a value equal to '{{null}}'.
 *
 * @function hasEqualWithNull
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
 * const result = hasEqualWithNull(queryOptions); // true
 */
export const hasEqualWithNull = (queryOptions, operation) => {
  const filters = get(queryOptions, `${operation}.where_filters`);
  if (filters) {
    const filterKeys = Object.keys(filters);
    for (let i = 0; i < filterKeys.length; i++) {
      const filter = filters[filterKeys[i]];
      if (filter.operator !== 'is' && filter.value === null) {
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
