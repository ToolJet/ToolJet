/**
 * Bottom-panel Debugger: the log list on the left follows the search box, the level filter and the
 * page scope; the detail pane on the right follows the list; Clear empties both.
 */
import React from 'react';
import { act, fireEvent, screen, within } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import RuntimeDebugger from '@/AppBuilder/QueryPanel/RuntimeDebugger/RuntimeDebugger';
import { seedApp, componentDefinition } from '@/test/app-builder';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import { render } from '@/test/test-utils';

const controls = createAppBuilderControls();
const state = () => useStore.getState();
const list = () => screen.getByRole('list', { name: 'Logs' });
const detail = () => screen.getByRole('region', { name: 'Selected log' });
const rows = () => within(list()).queryAllByRole('button');

const query = (logLevel, key, message) => ({ logLevel, type: 'query', key, message });

beforeEach(() => {
  controls.observers.install();
  seedApp({ c1: componentDefinition('c1', 'button1', 'Button') });
  // The store stamps each log with the page it arrived on, so log one while on another page.
  act(() => {
    state().setPages(
      [...state().modules.canvas.pages, { id: 'page-2', handle: 'second', name: 'Second', components: {} }],
      'canvas'
    );
    state().setCurrentPageId('page-2', 'canvas');
    state().debugger.log(query('error', 'otherPageQuery', 'timed out'));
    state().setCurrentPageId('page-1', 'canvas');
    state().debugger.logMultiple([
      query('error', 'fetchOrders', 'connection refused'),
      query('success', 'fetchUsers', 'Completed'),
    ]);
  });
  render(<RuntimeDebugger darkMode={false} onClose={() => {}} />);
});

afterEach(() => controls.restore());

test('lists the logs of the current page and shows the first one in the detail pane', () => {
  expect(rows()).toHaveLength(2);
  expect(list()).not.toHaveTextContent('timed out');
  expect(detail()).toHaveTextContent('fetchOrders');
  expect(detail()).toHaveTextContent('connection refused');
});

test('clicking a log shows that log in the detail pane', () => {
  fireEvent.click(within(list()).getByRole('button', { name: /Completed/ }));

  expect(detail()).toHaveTextContent('fetchUsers');
  expect(detail()).not.toHaveTextContent('connection refused');
});

test('typing in the search box keeps only the matching logs', () => {
  fireEvent.change(screen.getByRole('textbox', { name: 'Filter logs' }), { target: { value: 'users' } });

  expect(rows()).toHaveLength(1);
  expect(list()).toHaveTextContent('Completed');
  expect(detail()).toHaveTextContent('fetchUsers');
});

test('a search with no match says so instead of claiming there are no logs', () => {
  fireEvent.change(screen.getByRole('textbox', { name: 'Filter logs' }), { target: { value: 'zzqqxx' } });

  expect(rows()).toHaveLength(0);
  expect(list()).toHaveTextContent('No logs match');
});

test('the level filter keeps only logs of that level', () => {
  fireEvent.click(screen.getByRole('tab', { name: /Success/ }));

  expect(rows()).toHaveLength(1);
  expect(list()).toHaveTextContent('Completed');
});

test('"All pages" adds the logs of other pages', () => {
  fireEvent.click(screen.getByRole('radio', { name: 'All pages' }));

  expect(rows()).toHaveLength(3);
  expect(list()).toHaveTextContent('timed out');
});

test('Clear logs empties the list and the detail pane', () => {
  fireEvent.click(screen.getByRole('button', { name: 'Clear logs' }));

  expect(rows()).toHaveLength(0);
  expect(list()).toHaveTextContent('No logs yet');
  expect(detail()).not.toHaveTextContent('fetchOrders');
  expect(state().debugger.logs).toEqual([]);
});
