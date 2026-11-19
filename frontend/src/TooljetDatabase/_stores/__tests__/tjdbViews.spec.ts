// Each open table keeps its own view (filters, sort, page, page size, scroll position) in the store.
import { DEFAULT_VIEW, selectView, useTjdbStore } from '../tjdbStore';

const actions = () => useTjdbStore.getState().actions;
const view = () => selectView(useTjdbStore.getState());
const FILTER = { 0: { column: 'status', operator: 'eq', value: 'open' } };
const SORT = { 0: { column: 'id', order: 'desc' } };

beforeEach(() => {
  actions().resetStore();
  actions().openTableView('orders');
});

describe('tjdbStore | view per table', () => {
  it('shows defaults for a table that was never open', () => {
    expect(view()).toEqual(DEFAULT_VIEW);
  });

  it('gives a table back the view it left when you switch to it again', () => {
    actions().setQueryFilters(FILTER);
    actions().setSortFilters(SORT);
    actions().setPageSize(100);
    actions().setPageCount(3);
    actions().setScrollTop('orders', 480);

    actions().openTableView('users');
    expect(view()).toEqual(DEFAULT_VIEW);
    actions().setQueryFilters({ 0: { column: 'name', operator: 'eq', value: 'a' } });

    actions().openTableView('orders');
    expect(view()).toEqual({
      queryFilters: FILTER,
      sortFilters: SORT,
      pageSize: 100,
      pageCount: 3,
      scrollTop: 480,
    });
  });

  it('keeps one table from reading the other table view', () => {
    actions().setQueryFilters(FILTER);

    actions().openTableView('users');

    expect(view().queryFilters).toEqual({});
  });

  it.each([
    ['filters', () => actions().setQueryFilters(FILTER)],
    ['sort', () => actions().setSortFilters(SORT)],
    ['page size', () => actions().setPageSize(100)],
  ])('returns to page 1 when the %s change', (_name, change) => {
    actions().setPageCount(4);

    change();

    expect(view().pageCount).toBe(1);
  });

  it('writes a page change to the open table only', () => {
    actions().setPageCount(2);
    actions().openTableView('users');
    actions().setPageCount((previous: number) => previous + 1);

    expect(view().pageCount).toBe(2);
    actions().openTableView('orders');
    expect(view().pageCount).toBe(2);
  });

  it('writes nothing while no table is open', () => {
    actions().resetStore();

    actions().setQueryFilters(FILTER);

    expect(useTjdbStore.getState().views).toEqual({});
  });

  it('forgets every view when the environment changes', async () => {
    actions().setQueryFilters(FILTER);
    actions().openTableView('users');
    actions().setPageSize(100);

    await actions().switchEnvironment({ id: 'env-2', priority: 2 });

    expect(useTjdbStore.getState().views).toEqual({});
    expect(view()).toEqual(DEFAULT_VIEW);
    actions().openTableView('orders');
    expect(view()).toEqual(DEFAULT_VIEW);
  });

  it('forgets the views of tables that are no longer open', () => {
    actions().setQueryFilters(FILTER);
    actions().openTableView('users');
    actions().setQueryFilters(FILTER);

    actions().pruneViews(['users']);

    expect(Object.keys(useTjdbStore.getState().views)).toEqual(['users']);
  });
});

describe('tjdbStore | reset view', () => {
  it('forgets the view of a table that is not open and leaves the open one alone', () => {
    actions().setQueryFilters(FILTER);
    actions().openTableView('users');
    actions().setQueryFilters(FILTER);
    actions().setPageCount(3);

    actions().resetView('orders');

    expect(useTjdbStore.getState().views.orders).toBeUndefined();
    expect(view()).toMatchObject({ queryFilters: FILTER, pageCount: 3 });
  });

  it('puts the open table back on the default view', () => {
    actions().setQueryFilters(FILTER);
    actions().setSortFilters(SORT);
    actions().setScrollTop('orders', 300);

    actions().resetView('orders');

    expect(view()).toEqual(DEFAULT_VIEW);
    actions().setPageCount(2);
    expect(view().pageCount).toBe(2);
  });

  it('does nothing for a table with no view', () => {
    actions().resetView('users');

    expect(useTjdbStore.getState().views).toEqual({});
  });
});

describe('tjdbStore | scroll position', () => {
  it('is saved for the table it is reported for, not the open one', () => {
    actions().setScrollTop('users', 90);

    expect(useTjdbStore.getState().views.users.scrollTop).toBe(90);
    expect(view().scrollTop).toBe(0);
  });

  it('does not create a view for a table that sits at the top', () => {
    actions().setScrollTop('users', 0);

    expect(useTjdbStore.getState().views.users).toBeUndefined();
  });
});
