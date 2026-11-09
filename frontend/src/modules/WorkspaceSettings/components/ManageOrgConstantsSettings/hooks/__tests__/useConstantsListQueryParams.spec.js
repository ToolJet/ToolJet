import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { useConstantsListQueryParams } from '../useConstantsListQueryParams';
import { useConstantsListStore } from '../../store/constantsListStore';

const WORKSPACE_ID = 'ws-1';
const STORAGE_KEY = `tj:constants-view:${WORKSPACE_ID}`;

function setup(route = '/settings/workspace-constants', workspaceId = WORKSPACE_ID) {
  const wrapper = ({ children }) => <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>;
  const { result, rerender } = renderHook(
    () => ({ view: useConstantsListQueryParams({ workspaceId }), location: useLocation() }),
    { wrapper }
  );
  return {
    rerender,
    view: () => result.current.view,
    params: () => Object.fromEntries(new URLSearchParams(result.current.location.search)),
  };
}

const store = () => useConstantsListStore.getState();

afterEach(() => {
  localStorage.clear();
  jest.restoreAllMocks();
});

describe('useConstantsListQueryParams', () => {
  test('falls back to the defaults with an empty URL and nothing saved', () => {
    const { view } = setup();

    expect(view()).toMatchObject({ env: null, tab: 'Global', sort: 'modified_desc', source: ['workspace', 'env'] });
  });

  test('reads the view from the URL', () => {
    const { view } = setup('/c?env=e2&tab=Secret&sort=modified_desc&source=env');

    expect(view()).toMatchObject({ env: 'e2', tab: 'Secret', sort: 'modified_desc', source: ['env'] });
  });

  test('setters write the URL and the view follows', () => {
    const { view, params } = setup();

    act(() => view().setEnv('e2'));
    act(() => view().setTab('Secret'));
    act(() => view().setSort('name_desc'));
    act(() => view().setSource(['workspace']));

    expect(params()).toEqual({ env: 'e2', tab: 'Secret', sort: 'name_desc', source: 'workspace' });
    expect(view()).toMatchObject({ env: 'e2', tab: 'Secret', sort: 'name_desc', source: ['workspace'] });
  });

  test('default values are left out of the URL', () => {
    const { view, params } = setup('/c?env=e2&tab=Secret&sort=name_desc&source=env');

    act(() => view().setEnv(null));
    act(() => view().setTab('Global'));
    act(() => view().setSort('modified_desc'));
    act(() => view().setSource(['env', 'workspace']));

    expect(params()).toEqual({});
  });

  test('an empty source selection means both sources', () => {
    const { view, params } = setup('/c?source=env');

    act(() => view().setSource([]));

    expect(params()).toEqual({});
    expect(view().source).toEqual(['workspace', 'env']);
  });

  test('Name A-Z is no longer the default, so it is written to the URL', () => {
    const { view, params } = setup();

    act(() => view().setSort('name_asc'));

    expect(params()).toEqual({ sort: 'name_asc' });
    expect(view().sort).toBe('name_asc');
  });

  test('unknown values are dropped', () => {
    const { view } = setup('/c?tab=Bogus&sort=size_desc&source=workspace,bogus');

    expect(view()).toMatchObject({ tab: 'Global', sort: 'modified_desc', source: ['workspace'] });
  });

  test('a source param with no known value falls back to both sources', () => {
    const { view } = setup('/c?source=bogus');

    expect(view().source).toEqual(['workspace', 'env']);
  });

  test('unrelated params are kept', () => {
    const { view, params } = setup('/c?branch=feature-x');

    act(() => view().setSort('name_desc'));

    expect(params()).toEqual({ branch: 'feature-x', sort: 'name_desc' });
  });

  describe('saved view', () => {
    test('the saved view is used when the URL has no params', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ env: 'e9', tab: 'Secret', sort: 'name_desc', source: ['env'] })
      );

      const { view } = setup();

      expect(view()).toMatchObject({ env: 'e9', tab: 'Secret', sort: 'name_desc', source: ['env'] });
    });

    test('a URL param wins over the saved value', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sort: 'name_desc', tab: 'Secret' }));

      const { view } = setup('/c?sort=modified_asc');

      expect(view()).toMatchObject({ sort: 'modified_asc', tab: 'Secret' });
    });

    test('unknown saved values are dropped', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sort: 'bogus', tab: 7, source: ['bogus'] }));

      const { view } = setup();

      expect(view()).toMatchObject({ sort: 'modified_desc', tab: 'Global', source: ['workspace', 'env'] });
    });

    test('a saved view is scoped to its workspace', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sort: 'name_desc' }));

      const { view } = setup('/c', 'ws-2');

      expect(view().sort).toBe('modified_desc');
    });

    test('setters save the whole view, including values that came from the URL', () => {
      const { view } = setup('/c?env=e2');

      act(() => view().setSort('modified_desc'));

      expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual({
        env: 'e2',
        tab: 'Global',
        sort: 'modified_desc',
        source: ['workspace', 'env'],
      });
    });

    test('choosing the default over a non-default saved value sticks', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sort: 'name_desc' }));
      const { view } = setup();

      act(() => view().setSort('modified_desc'));

      expect(view().sort).toBe('modified_desc');
    });

    test('a plain visit seeds the URL with the saved view, so a refresh or shared link keeps it', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ env: 'e9', tab: 'Secret', sort: 'name_asc', source: ['env'] })
      );

      const { params } = setup();

      expect(params()).toEqual({ env: 'e9', tab: 'Secret', sort: 'name_asc', source: 'env' });
    });

    test('seeding leaves defaults out and keeps what the URL already says', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ tab: 'Secret', sort: 'modified_desc', source: ['env'] }));

      const { params } = setup('/c?source=workspace&branch=feature-x');

      expect(params()).toEqual({ tab: 'Secret', source: 'workspace', branch: 'feature-x' });
    });

    test('a saved view written by another tab later does not change this view', () => {
      const { view, rerender } = setup();
      expect(view().sort).toBe('modified_desc');

      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sort: 'name_desc', tab: 'Secret' }));
      rerender();

      expect(view()).toMatchObject({ sort: 'modified_desc', tab: 'Global' });
    });

    test('a default chosen after seeding stays chosen on later renders', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sort: 'name_desc' }));
      const { view, params, rerender } = setup();
      expect(view().sort).toBe('name_desc');

      act(() => view().setSort('modified_desc'));
      rerender();

      expect(view().sort).toBe('modified_desc');
      expect(params()).toEqual({});
    });

    test('corrupt saved JSON falls back to the defaults', () => {
      localStorage.setItem(STORAGE_KEY, '{not json');

      const { view } = setup();

      expect(view().sort).toBe('modified_desc');
    });

    test('storage that throws does not break reading or writing the URL', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('blocked');
      });
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('blocked');
      });

      const { view, params } = setup('/c?tab=Secret');
      expect(view().tab).toBe('Secret');

      act(() => view().setSort('name_desc'));

      expect(params()).toEqual({ tab: 'Secret', sort: 'name_desc' });
      expect(view().sort).toBe('name_desc');
    });
  });

  describe('list resets', () => {
    test.each([
      ['sort', (view) => view.setSort('name_desc')],
      ['source', (view) => view.setSource(['env'])],
      ['env', (view) => view.setEnv('e2')],
      ['tab', (view) => view.setTab('Secret')],
    ])('changing %s goes back to page 1 and clears the selection', (_name, change) => {
      const { view } = setup();
      act(() => store().setPage(3));
      act(() => store().setRowSelection({ a: true }));

      act(() => change(view()));

      expect(store().query.page).toBe(1);
      expect(store().rowSelection).toEqual({});
    });

    test('changing tab keeps search, source and sort', () => {
      const { view } = setup('/c?sort=name_desc&source=env');
      act(() => store().setSearch('api'));

      act(() => view().setTab('Secret'));

      expect(store().query.searchKey).toBe('api');
      expect(view()).toMatchObject({ tab: 'Secret', sort: 'name_desc', source: ['env'] });
    });
  });
});
