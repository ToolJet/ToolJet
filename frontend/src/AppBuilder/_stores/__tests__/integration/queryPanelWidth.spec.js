/**
 * The right-side query panel's dragged width lives in the queryPanel slice, like the query
 * preview's height, so it survives switching queries; saving it also keeps it across reloads.
 */
import useStore from '@/AppBuilder/_stores/store';

const state = () => useStore.getState();

beforeEach(() => {
  window.localStorage.clear();
});

// Break this catches: the panel snaps back to its default width when another query is selected.
test('keeps the dragged width when the selected query changes', () => {
  state().queryPanel.setQueryPanelWidth(720);
  state().queryPanel.setSelectedQuery(null);

  expect(state().queryPanel.queryPanelWidth).toBe(720);
});

// Break this catches: every mousemove of a drag writes localStorage, or the end of the drag never does.
test('saves the width for the next reload only when asked to', () => {
  state().queryPanel.setQueryPanelWidth(640);
  expect(window.localStorage.getItem('queryPanelWidth')).toBeNull();

  state().queryPanel.setQueryPanelWidth(700, { persist: true });
  expect(state().queryPanel.queryPanelWidth).toBe(700);
  expect(window.localStorage.getItem('queryPanelWidth')).toBe('700');
});
