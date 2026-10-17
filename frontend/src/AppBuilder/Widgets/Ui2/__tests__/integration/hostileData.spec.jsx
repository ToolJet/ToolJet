/**
 * Hostile data through every UI 2.0 widget: HTML with handlers, attribute breakouts with quotes, javascript: and data:
 * URLs and markdown links go into every text, label, URL, HTML and markdown field (top-level and inside bound rows and
 * options). They arrive as an app's data does, from a query (`{{queries.hostile.data.<property>}}`), and nothing may
 * run or reach the DOM unsanitised: no script, frame, object or style element, no on*
 * attribute, no javascript:, vbscript: or data:text/html URL, no srcdoc. Known safe paths get their own cases: Table
 * HTML cells (DOMPurify), the Map's divIcon escaping and safeColor, and Chat's markdown.
 */
import { createWidgetHarness, measureChartsAt } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, waitFor } from '@testing-library/react';
import { MODULE_ID, binding, store } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import {
  CONFIGS,
  OPENS,
  TYPES,
  addPageCanvas,
  boxOf,
  defaultsOf,
  openOverlay,
} from '@/AppBuilder/Widgets/Ui2/__tests__/packPage';

measureChartsAt(400, 200);

// Every payload calls window.__xss when it runs.
const HTML =
  '<img src=x onerror="__xss(1)"><script>__xss(2)</script><svg onload="__xss(3)"></svg>' +
  '<iframe srcdoc="<script>parent.__xss(4)</script>"></iframe><style>*{display:none}</style><b>bold</b>';
const BREAKOUT = `"'><img src=x onerror=__xss(5)><a href='javascript:__xss(6)'>x</a>`;
const MARKDOWN = `[link](javascript:__xss(7)) ![img](javascript:__xss(8)) <a href="javascript:__xss(9)">a</a> ${HTML}`;
const URLS = ['javascript:__xss(10)', ' JaVaScRiPt:__xss(11)', 'data:text/html,<script>__xss(12)</script>'];

// Fields named for a link or an image take URLs; fields naming a data column (xField, idField...) are not text.
const URL_KEY = /(url|href|link|src|source|image|avatar|logo|photo|picture|website|linkTarget)$/i;
const FIELD_KEY = /Fields?$/;
// Inside bound rows and options: keys that pick a column, a type or a mode, not text a widget shows.
const STRUCTURAL = new Set([
  ...['id', 'key', 'type', 'kind', 'variant', 'format', 'mode', 'align', 'dataKey', 'field'],
  // Dates place an item (a calendar marker, an event): poisoned, the item is not drawn at all.
  ...['date', 'start', 'end', 'from', 'to'],
]);
// The tooltip is RenderWidget's (native), shown on hover.
const NATIVE_KEYS = new Set(['tooltip', 'tooltipFormat']);

const schemaTypes = (schema) =>
  !schema ? [] : schema.type === 'union' ? schema.schemas.flatMap(schemaTypes) : [schema.type];
const isFreeText = (meta) =>
  meta?.type === 'code' && (schemaTypes(meta.validation?.schema).includes('string') || !meta.validation?.schema);
const isData = (meta) =>
  meta?.type === 'code' && schemaTypes(meta.validation?.schema).some((t) => t === 'array' || t === 'object');

/** `value` with every text leaf replaced: URL-named keys by `url`, others by `text`. */
const poison = (value, text, url, key = '') => {
  if (typeof value === 'string') return URL_KEY.test(key) ? url : text;
  if (Array.isArray(value)) return value.map((v) => poison(v, text, url, key));
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, STRUCTURAL.has(k) ? v : poison(v, text, url, k)])
    );
  return value;
};
// Sample data for widgets whose own sample is built at run time (moment() in the definition), so defaultsOf cannot
// read it.
const SAMPLES = { ShadCalendar: { markers: [{ date: '2026-10-16', label: 'Stand-up' }], defaultMonth: '2026-10-01' } };

/** Every top-level text, URL and data property of `type`, poisoned with `text` and `url`: { property: value }. */
const poisoned = (type, text, url) => {
  const defaults = { ...defaultsOf(type), ...SAMPLES[type] };
  const out = {};
  for (const [key, meta] of Object.entries(CONFIGS[type].properties || {})) {
    if (NATIVE_KEYS.has(key) || FIELD_KEY.test(key)) continue;
    if (SAMPLES[type]?.[key] !== undefined && typeof SAMPLES[type][key] === 'string') out[key] = SAMPLES[type][key];
    else if (isFreeText(meta)) out[key] = URL_KEY.test(key) ? url : text;
    else if (isData(meta) && defaults[key] && typeof defaults[key] === 'object')
      out[key] = poison(defaults[key], text, url);
  }
  return out;
};

/** `values` as the data of a query named `hostile`, and each property bound to its value there. Call before render. */
const fromQuery = (values) => {
  store().dataQuery.setQueries([{ id: 'hostile', name: 'hostile', kind: 'runjs', options: {} }], MODULE_ID);
  store().setQueryMapping(MODULE_ID);
  store().setResolvedQuery('hostile', { data: values, isLoading: false }, MODULE_ID);
  return Object.fromEntries(Object.keys(values).map((key) => [key, binding(`{{queries.hostile.data.${key}}}`)]));
};

const URL_ATTRS = ['href', 'src', 'action', 'formaction', 'xlink:href', 'data', 'poster', 'background', 'cite'];
const BAD_URL = /^(javascript|vbscript|data:text\/html)/;
/** What in `root` could run: dangerous elements, handler attributes, script URLs, srcdoc. Empty when safe. */
const unsafeNodes = (root) => {
  const found = [];
  for (const el of root.querySelectorAll('script, iframe, frame, object, embed, base, meta, link')) {
    found.push(`<${el.tagName.toLowerCase()}>`);
  }
  // The payload's own style rule (libraries add style elements of their own).
  for (const el of root.querySelectorAll('style'))
    if (el.textContent.includes('*{display:none}')) found.push('<style>');
  for (const el of root.querySelectorAll('*')) {
    for (const { name, value } of el.attributes) {
      const n = name.toLowerCase();
      // eslint-disable-next-line no-control-regex
      const v = value.toLowerCase().replace(/[\s\u0000-\u001f]/g, '');
      if (n.startsWith('on')) found.push(`${el.tagName.toLowerCase()}[${n}]`);
      else if (n === 'srcdoc') found.push(`${el.tagName.toLowerCase()}[srcdoc]`);
      else if (URL_ATTRS.includes(n) && BAD_URL.test(v)) found.push(`${el.tagName.toLowerCase()}[${n}=${value}]`);
      else if (n === 'style' && /javascript:|expression\(/.test(v)) found.push(`${el.tagName.toLowerCase()}[style]`);
    }
  }
  return [...new Set(found)];
};

// Widgets that show none of the payload: the Carousel draws its captions on the slide's image, and a script URL is no
// image (safeImageUrl), so its slides show the no-image state.
const SHOWS_NO_TEXT = new Set(['ShadCarousel']);

const CASES = [
  ['HTML and javascript: URLs', HTML, URLS[0]],
  ['quote breakouts and mixed-case script URLs', BREAKOUT, URLS[1]],
  ['markdown and data:text/html URLs', MARKDOWN, URLS[2]],
];
const settle = () => act(() => new Promise((r) => setTimeout(r, 30)));

const harnessFor = (type) => {
  const box = boxOf(type);
  return createWidgetHarness({
    componentType: type,
    handle: 'xss1',
    id: 'xss1',
    widgetWidth: box.width,
    widgetHeight: box.height,
    capabilities: { dnd: true },
  });
};
let removeCanvas;
beforeEach(() => {
  window.__xss = jest.fn();
  removeCanvas = addPageCanvas();
});
afterEach(() => {
  removeCanvas();
  delete window.__xss;
});

/** Mounts `type` with `properties`, opens its overlay, and returns what could run. */
const exercise = async (widget, type, properties) => {
  const { container } = widget.render({ currentMode: 'view', properties });
  await waitFor(() => expect(container.firstChild).toBeTruthy());
  await settle();
  if (OPENS.has(type)) {
    await openOverlay(widget.exposed(), container);
    await settle();
  }
  return unsafeNodes(document.body);
};

describe.each(TYPES)('%s with hostile data', (type) => {
  const widget = harnessFor(type);
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test.each(CASES)(`[${type}-XSS-001] %s: nothing runs, nothing unsafe reaches the DOM`, async (_, text, url) => {
    expect(await exercise(widget, type, fromQuery(poisoned(type, text, url)))).toEqual([]);
    expect(window.__xss).not.toHaveBeenCalled();
    // Not vacuous: the payload is on the page, as text or an escaped attribute.
    if (!SHOWS_NO_TEXT.has(type)) expect(document.body.innerHTML).toMatch(/__xss|bold/);
  });
});

describe('known safe paths', () => {
  test('[ShadTable-XSS-002] an HTML column renders sanitised HTML', async () => {
    const widget = harnessFor('ShadTable');
    await widget.setup();
    const { container } = widget.render({
      currentMode: 'view',
      properties: fromQuery({
        data: [{ id: 1, name: HTML, site: URLS[0] }],
        columns: [
          { key: 'name', name: BREAKOUT, columnType: 'html' },
          { key: 'site', name: 'Site', columnType: 'link' },
        ],
      }),
    });
    await waitFor(() => expect(container.querySelector('tbody b')).toHaveTextContent('bold'));
    expect(unsafeNodes(document.body)).toEqual([]);
    expect(window.__xss).not.toHaveBeenCalled();
    widget.teardown();
  });

  test('[ShadMap-XSS-002] marker labels, popups and colours are escaped', async () => {
    const widget = harnessFor('ShadMap');
    await widget.setup();
    widget.render({
      currentMode: 'view',
      properties: {
        ...fromQuery({
          data: [
            {
              id: BREAKOUT,
              lat: 37.77,
              lng: -122.42,
              title: HTML,
              label: BREAKOUT,
              color: `red" onmouseover="__xss(13)`,
            },
            { id: 2, lat: 37.78, lng: -122.41, title: BREAKOUT, label: HTML, color: 'url(javascript:__xss(14))' },
          ],
        }),
        titleField: binding('title'),
        labelField: binding('label'),
        clusterMarkers: binding('{{false}}'),
      },
    });
    await waitFor(() => expect(document.querySelector('[data-marker]')).toBeTruthy());
    fireEvent.click(document.querySelector('[data-marker]'));
    await settle();
    expect(unsafeNodes(document.body)).toEqual([]);
    expect(window.__xss).not.toHaveBeenCalled();
    widget.teardown();
  });

  // jest stubs react-markdown and its plugins (jest.config.js), so the real output is checked in browsers
  // (npm run test:ui2-browsers); here, the order that makes it safe: raw HTML parsed, then sanitised.
  test('[ShadChat-XSS-002] replies parse raw HTML and then sanitise it, dropping script and style elements', () => {
    const { CHAT_REHYPE_PLUGINS, CHAT_MARKDOWN_SCHEMA } = require('@/AppBuilder/Widgets/Ui2/Chat/ChatParts');
    expect(CHAT_REHYPE_PLUGINS).toHaveLength(2);
    expect(CHAT_REHYPE_PLUGINS[1]).toEqual([expect.anything(), CHAT_MARKDOWN_SCHEMA]);
    expect(CHAT_MARKDOWN_SCHEMA.strip).toEqual(['script', 'style']);
  });
});
