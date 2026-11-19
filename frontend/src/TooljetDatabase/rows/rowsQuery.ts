import PostgrestQueryBuilder from '@/_helpers/postgrestQueryBuilder';

// The store keys conditions by the popover's row index ({ "0": {...}, "2": {...} }); rows can be half-filled drafts.
export type FilterCondition = { column?: string; operator?: string; value?: string };
export type SortRule = { column?: string; order?: string };

export type RowsView = {
  filters: Record<string, FilterCondition>;
  sort: Record<string, SortRule>;
  page: number;
  pageSize: number;
};

// "null" only means NULL with the `is` operator; with any other operator PostgREST refuses the request.
export const isQueryableFilter = ({ column, operator, value }: FilterCondition): boolean =>
  !!column && !!operator && !!value && (operator === 'is' || value.toLowerCase() !== 'null');

const isCompleteSort = ({ column, order }: SortRule): boolean => !!column && !!order;

// The complete rules in priority order, one per column: a later rule on the same column never changes the order, so
// it is dropped here and the header numbers columns by the order the database actually uses.
export const appliedSorts = (sort: Record<string, SortRule> = {}): SortRule[] =>
  Object.values(sort)
    .filter(isCompleteSort)
    .filter((rule, index, rules) => rules.findIndex(({ column }) => column === rule.column) === index);

// Pure, so the same view always yields the same string: it is the rows query's cache key.
export const buildRowsQuery = ({ filters, sort, page, pageSize }: RowsView): string => {
  const query = new PostgrestQueryBuilder();
  Object.values(filters)
    .filter(isQueryableFilter)
    .forEach(({ column, operator, value }) => query.filter(column, operator, value));
  appliedSorts(sort).forEach(({ column, order }) => query.order(column, order));
  query.limit(pageSize).offset((page - 1) * pageSize);
  return query.url.toString();
};
