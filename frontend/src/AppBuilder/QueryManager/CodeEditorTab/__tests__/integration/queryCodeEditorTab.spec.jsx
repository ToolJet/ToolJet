/**
 * A RunJS/RunPython query's code can be edited in a separate browser tab. The app tab opens that tab
 * with window.open and renders the editor into it, so the tab shares the app's store: edits land in
 * the same query, save through the app tab's autosave, and follow its freeze state. The tab lives as
 * long as the app tab does.
 *
 * Real store and real CodeMirror. Only the browser boundary is controlled: window.open hands back a
 * fake tab that owns a separate jsdom document, and HTTP goes through MSW.
 */
import '@/test/setupMsw';
import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import { EditorView } from '@codemirror/view';
import { toast } from 'react-hot-toast';
import { server } from '@/test/msw/server';
import useStore from '@/AppBuilder/_stores/store';
import { seedApp } from '@/test/app-builder/seed';
import QueryCodeEditorTabs from '@/AppBuilder/QueryManager/CodeEditorTab/QueryCodeEditorTabs';
import OpenCodeEditorTabButton from '@/AppBuilder/QueryManager/CodeEditorTab/OpenCodeEditorTabButton';
import { codeEditorTabWindowName } from '@/AppBuilder/QueryManager/CodeEditorTab/codeEditorTabWindows';

// Icon adapter only (external package): the shared lucide mock crashes any ui/Button with an icon.
jest.mock('lucide-react/dynamic.mjs', () => ({ __esModule: true, DynamicIcon: () => null, iconNames: [] }));

const state = () => useStore.getState();

const runjsQuery = { id: 'q-js', name: 'jsQuery', kind: 'runjs', options: { code: 'return 1;' }, data_source_id: null };
const runpyQuery = { id: 'q-py', name: 'pyQuery', kind: 'runpy', options: { code: 'print(1)' }, data_source_id: null };
const restQuery = { id: 'q-rest', name: 'restQuery', kind: 'restapi', options: { url: '' }, data_source_id: null };

// A browser tab the app opened: its own document, closable, with its own page lifecycle events.
const makeTab = () => {
  const doc = document.implementation.createHTMLDocument('');
  const listeners = {};
  const tab = {
    document: doc,
    closed: false,
    focus: jest.fn(),
    close: jest.fn(() => {
      tab.closed = true;
    }),
    addEventListener: (type, fn) => (listeners[type] = [...(listeners[type] ?? []), fn]),
    removeEventListener: (type, fn) => (listeners[type] = (listeners[type] ?? []).filter((l) => l !== fn)),
    fire: (type) => (listeners[type] ?? []).forEach((fn) => fn(new Event(type))),
  };
  return tab;
};

let tab;
let saves;

const openButton = () => document.querySelector('[data-cy="query-open-code-editor-tab"]');
const tabRoot = () => tab.document.querySelector('[data-cy="query-code-editor-tab"]');
const tabEditor = () => EditorView.findFromDOM(tab.document.querySelector('.cm-editor'));
const typeInTab = (text) =>
  act(() => {
    const view = tabEditor();
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } });
  });

const openTab = (queryId) => {
  // The editor is routed in the app (its keybindings read the location).
  render(
    <MemoryRouter>
      <QueryCodeEditorTabs />
    </MemoryRouter>
  );
  act(() => {
    state().queryPanel.setSelectedQuery(queryId);
  });
  render(<OpenCodeEditorTabButton />);
  fireEvent.click(openButton());
};

beforeEach(() => {
  // jsdom has no IntersectionObserver; the editor only uses it to hide autocomplete off screen.
  window.IntersectionObserver = jest.fn(() => ({ observe: jest.fn(), disconnect: jest.fn() }));
  saves = [];
  server.use(
    http.patch('http://localhost:3000/api/data-queries/:id/versions/:versionId', async ({ params, request }) => {
      saves.push({ id: params.id, versionId: params.versionId, body: await request.json() });
      return HttpResponse.json({ updated_at: new Date().toISOString() });
    })
  );
  seedApp({});
  act(() => {
    state().setCurrentVersionId('version-1');
    state().dataQuery.setQueries([runjsQuery, runpyQuery, restQuery]);
  });
  tab = makeTab();
  jest.spyOn(window, 'open').mockImplementation(() => tab);
  const style = document.createElement('style');
  style.textContent = '.tj-app-style { color: red; }';
  document.head.appendChild(style);
});

afterEach(() => {
  jest.restoreAllMocks();
  document.head.innerHTML = '';
});

describe('opening the code editor in a new tab', () => {
  test('is offered for RunJS and RunPython queries only', () => {
    render(<OpenCodeEditorTabButton />);
    act(() => state().queryPanel.setSelectedQuery('q-rest'));
    expect(openButton()).toBeNull();

    act(() => state().queryPanel.setSelectedQuery('q-py'));
    expect(openButton()).toBeTruthy();

    act(() => state().queryPanel.setSelectedQuery('q-js'));
    expect(openButton()).toBeTruthy();
  });

  test('opens a tab named after the query and renders its code there with the app styles', () => {
    openTab('q-js');

    expect(window.open).toHaveBeenCalledWith('', codeEditorTabWindowName('q-js'));
    expect(state().queryPanel.codeEditorTabQueryIds).toEqual(['q-js']);
    expect(tabRoot()).toBeTruthy();
    expect(tab.document.title).toContain('jsQuery');
    expect(tabEditor().state.doc.toString()).toBe('return 1;');
    expect(tab.document.head.textContent).toContain('.tj-app-style');
  });

  test("lays the editor out for the tab, not for the app's query panel", () => {
    const panel = document.createElement('div');
    panel.innerHTML = '<div class="query-details"><div class="code-hinter-wrapper"></div></div>';
    document.body.appendChild(panel);

    openTab('q-js');

    const wrapper = tab.document.querySelector('.code-hinter-wrapper');
    expect(wrapper.classList.contains('code-editor-query-panel')).toBe(false);
    panel.remove();
  });

  test('tells the builder when the browser blocks the new tab', () => {
    window.open.mockReturnValue(null);
    const error = jest.spyOn(toast, 'error');

    openTab('q-js');

    expect(error).toHaveBeenCalledWith(expect.stringContaining('pop-ups'));
    expect(state().queryPanel.codeEditorTabQueryIds).toEqual([]);
  });

  test('focuses the existing tab instead of opening a second one', () => {
    openTab('q-js');
    fireEvent.click(openButton());

    expect(state().queryPanel.codeEditorTabQueryIds).toEqual(['q-js']);
    expect(tab.focus).toHaveBeenCalled();
  });
});

describe('editing in the tab', () => {
  test('updates the query in the app and saves it, even when another query is selected', async () => {
    openTab('q-py');
    act(() => state().queryPanel.setSelectedQuery('q-js'));

    typeInTab('print(2)');

    await waitFor(() => expect(saves).toHaveLength(1));
    expect(saves[0]).toMatchObject({ id: 'q-py', versionId: 'version-1', body: { options: { code: 'print(2)' } } });
    const stored = state().dataQuery.queries.modules.canvas.find((query) => query.id === 'q-py');
    expect(stored.options.code).toBe('print(2)');
    expect(state().queryPanel.selectedQuery.options.code).toBe('return 1;');
  });

  test('shows the edit in the query panel when that query is selected', async () => {
    openTab('q-js');

    typeInTab('return 2;');

    // Saving the selected query is the query panel's autosave, as for edits made in the panel.
    await waitFor(() => expect(state().queryPanel.selectedQuery.options.code).toBe('return 2;'));
  });

  test('picks up edits made in the app', () => {
    openTab('q-js');

    act(() => state().dataQuery.updateDataQueryById('q-js', { code: 'return 3;' }));

    expect(tabEditor().state.doc.toString()).toBe('return 3;');
  });

  test('is read-only while the version is frozen', () => {
    act(() => useStore.setState({ isEditorFreezed: true }));
    openTab('q-js');

    expect(tabEditor().state.readOnly).toBe(true);
    expect(tabRoot().textContent).toContain('Read only');
  });

  test('says the query is gone when it leaves the open version', () => {
    openTab('q-js');

    act(() => state().dataQuery.setQueries([runpyQuery]));

    expect(tab.document.querySelector('[data-cy="query-code-editor-tab-unavailable"]')).toBeTruthy();
    expect(tab.document.querySelector('.cm-editor')).toBeNull();
  });
});

describe('tab lifecycle', () => {
  test('closing the tab saves its last edit and forgets the tab', async () => {
    openTab('q-js');
    act(() => state().queryPanel.setSelectedQuery('q-py'));
    typeInTab('return 4;');

    act(() => {
      tab.closed = true;
      tab.fire('pagehide');
    });

    await waitFor(() => expect(saves.at(-1)?.body.options.code).toBe('return 4;'));
    expect(state().queryPanel.codeEditorTabQueryIds).toEqual([]);
  });

  test('closing the app tab closes the editor tab', () => {
    openTab('q-js');

    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });

    expect(tab.close).toHaveBeenCalled();
  });
});
