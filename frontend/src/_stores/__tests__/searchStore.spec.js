import { useSearchStore, DEFAULT_SEARCH_CONFIG } from '../searchStore';

describe('searchStore search config', () => {
  afterEach(() => {
    useSearchStore.getState().resetSearchConfig();
    useSearchStore.getState().clearSearch();
  });

  it('keeps the default debounce when a page only sets the placeholder', () => {
    useSearchStore.getState().setSearchConfig({ placeholder: 'Search for modules', debounceMs: undefined });

    expect(useSearchStore.getState().searchConfig).toEqual({
      placeholder: 'Search for modules',
      debounceMs: DEFAULT_SEARCH_CONFIG.debounceMs,
    });
  });

  it('applies a custom debounce', () => {
    useSearchStore.getState().setSearchConfig({ debounceMs: 500 });

    expect(useSearchStore.getState().searchConfig).toEqual({ placeholder: 'Search', debounceMs: 500 });
  });

  it('restores the defaults on reset', () => {
    useSearchStore.getState().setSearchConfig({ placeholder: 'Custom', debounceMs: 500 });
    useSearchStore.getState().resetSearchConfig();

    expect(useSearchStore.getState().searchConfig).toEqual(DEFAULT_SEARCH_CONFIG);
  });
});

describe('searchStore search query', () => {
  afterEach(() => {
    useSearchStore.getState().resetSearchConfig();
    useSearchStore.getState().clearSearch();
  });

  it('keeps the debounced query behind the typed one while a delay applies', () => {
    useSearchStore.getState().setSearchQuery('abc');

    expect(useSearchStore.getState()).toMatchObject({ searchQuery: 'abc', debouncedSearchQuery: '' });
  });

  it('updates the debounced query immediately when the delay is 0', () => {
    useSearchStore.getState().setSearchConfig({ debounceMs: 0 });
    useSearchStore.getState().setSearchQuery('abc');

    expect(useSearchStore.getState()).toMatchObject({ searchQuery: 'abc', debouncedSearchQuery: 'abc' });
  });

  it('catches the debounced query up when the delay is switched off mid-typing', () => {
    useSearchStore.getState().setSearchQuery('abc');
    useSearchStore.getState().setSearchConfig({ debounceMs: 0 });

    expect(useSearchStore.getState().debouncedSearchQuery).toBe('abc');
  });

  it('clears both queries at once', () => {
    useSearchStore.getState().setSearchQuery('abc');
    useSearchStore.getState().setDebouncedSearchQuery('abc');
    useSearchStore.getState().clearSearch();

    expect(useSearchStore.getState()).toMatchObject({ searchQuery: '', debouncedSearchQuery: '' });
  });
});
