/**
 * A code search result's field is selected by the code editor showing it: navigation leaves a focus
 * request in the store and the editor that holds that field takes it (codeSearchHighlight).
 *
 * Real store and real CodeMirror views. Geometry is the only thing controlled: jsdom has no layout,
 * so an element counts as on screen unless it sits inside `[data-offscreen]` (an inactive tab pane).
 */
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import useStore from '@/AppBuilder/_stores/store';
import { codeSearchHighlight } from '@/AppBuilder/CodeEditor/codeSearchHighlight';
import type { FocusTarget } from '@/AppBuilder/_stores/slices/codeSearchSlice';

const FLASH = 'tj-code-search-flash';
const INSPECTOR = '.editor-sidebar .inspector';
const state = () => useStore.getState();
const views: EditorView[] = [];

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(Element.prototype, 'getClientRects').mockImplementation(function (this: Element) {
    return (this.closest('[data-offscreen]') ? [] : [{}]) as unknown as DOMRectList;
  });
  Element.prototype.scrollIntoView = jest.fn();
});

afterEach(() => {
  views.splice(0).forEach((view) => view.destroy());
  jest.useRealTimers();
  jest.restoreAllMocks();
  document.body.innerHTML = '';
});

const mount = (html: string) => {
  document.body.innerHTML = html;
};

// A code editor inside the element `selector` names, the way CodeHinter renders one.
const editorIn = (selector: string, doc: string) => {
  const view = new EditorView({
    state: EditorState.create({ doc, extensions: [codeSearchHighlight] }),
    parent: document.querySelector<HTMLElement>(selector) as HTMLElement,
  });
  views.push(view);
  return view;
};

const request = (target: Partial<FocusTarget>) =>
  state().requestCodeSearchFocus({
    scope: INSPECTOR,
    keys: [],
    inOpenedTab: false,
    text: '',
    start: 0,
    end: 0,
    ...target,
  });

// Editors take a request on a microtask and flash after the next frame.
const settle = async () => {
  await jest.advanceTimersByTimeAsync(50);
};

const selected = (view: EditorView) => {
  const { from, to } = view.state.selection.main;
  return view.state.sliceDoc(from, to);
};
// The flash goes on the editor's container: CodeMirror owns its root's class.
const flashed = (view: EditorView) => Boolean(view.dom.parentElement?.classList.contains(FLASH));

describe('a code editor takes the focus request for its own field', () => {
  test('selects the clicked occurrence, flashes, and clears the request', async () => {
    mount(`<div class="editor-sidebar"><div class="inspector"><div data-param="data" id="data"></div></div></div>`);
    const view = editorIn('#data', '{{queries.getUsers.data}}');

    request({ keys: ['data'], text: '{{queries.getUsers.data}}', start: 10, end: 18 });
    await settle();

    expect(selected(view)).toBe('getUsers');
    expect(flashed(view)).toBe(true);
    expect(state().codeSearch.focusRequest).toBeNull();
  });

  test('another field holding the same text leaves it, and so does one in a hidden tab', async () => {
    mount(`
      <div class="editor-sidebar"><div class="inspector">
        <div data-offscreen><div data-param="textColor" id="hidden"></div></div>
        <div data-param="color" id="color"></div>
        <div data-param="textColor" id="textColor"></div>
      </div></div>`);
    const hidden = editorIn('#hidden', 'var(--text)');
    const color = editorIn('#color', 'var(--text)');
    const textColor = editorIn('#textColor', 'var(--text)');

    request({ keys: ['textColor'], text: 'var(--text)', start: 0, end: 11 });
    await settle();

    expect([flashed(hidden), flashed(color), flashed(textColor)]).toEqual([false, false, true]);
  });

  test('an editor that mounts after the request takes it when it mounts', async () => {
    mount(`<div class="editor-sidebar"><div class="inspector"><div data-param="text" id="text"></div></div></div>`);

    request({ keys: ['text'], text: 'Hello {{name}}', start: 8, end: 12 });
    await settle();
    expect(state().codeSearch.focusRequest).not.toBeNull();

    const view = editorIn('#text', 'Hello {{name}}');
    await settle();

    expect(selected(view)).toBe('name');
    expect(state().codeSearch.focusRequest).toBeNull();
  });

  test('outside the requested panel, no editor takes it', async () => {
    mount(`
      <div class="query-manager"><div data-param="url" id="query"></div></div>
      <div class="editor-sidebar"><div class="inspector"></div></div>`);
    const view = editorIn('#query', 'https://x');

    request({ keys: ['url'], text: 'https://x', start: 0, end: 5 });
    await settle();

    expect(flashed(view)).toBe(false);
    expect(state().codeSearch.focusRequest).not.toBeNull();
  });

  test('a field shown twice is taken once', async () => {
    mount(`
      <div class="editor-sidebar"><div class="inspector">
        <div data-param="label" id="a"></div>
        <div data-param="label" id="b"></div>
      </div></div>`);
    const a = editorIn('#a', 'Submit');
    const b = editorIn('#b', 'Submit');

    request({ keys: ['label'], text: 'Submit', start: 0, end: 6 });
    await settle();

    expect([flashed(a), flashed(b)].filter(Boolean)).toHaveLength(1);
  });

  test("an editor with no tagged wrapper takes it only when nothing on screen carries the field's key", async () => {
    mount(`<div class="query-manager"><div id="untagged"></div></div>`);
    const untagged = editorIn('#untagged', 'SELECT 1');

    request({ scope: '.query-manager', keys: ['query'], text: 'SELECT 1', start: 0, end: 6 });
    await settle();
    expect(selected(untagged)).toBe('SELECT');

    mount(`<div class="query-manager"><div id="untagged"></div><div data-param="query">SELECT 1</div></div>`);
    const shadowed = editorIn('#untagged', 'SELECT 1');
    request({ scope: '.query-manager', keys: ['query'], text: 'SELECT 1', start: 0, end: 6 });
    await settle();
    expect(flashed(shadowed)).toBe(false);
  });

  test('inside an opened request tab, any of the path keys may be the tagged one', async () => {
    mount(`<div data-reveal-root="restTab:headers"><div data-param="value" id="value"></div></div>`);
    const view = editorIn('#value', 'Bearer {{token}}');

    request({
      scope: '[data-reveal-root="restTab:headers"]',
      keys: ['headers', '0', 'value'],
      inOpenedTab: true,
      text: 'Bearer {{token}}',
      start: 9,
      end: 14,
    });
    await settle();

    expect(selected(view)).toBe('token');
  });
});
