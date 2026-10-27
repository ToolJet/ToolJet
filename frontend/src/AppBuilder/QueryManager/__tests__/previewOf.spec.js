import { previewOf, PREVIEW_TRUNCATED_LENGTH } from '@/AppBuilder/QueryManager/utils';
import { reservedKeywordReplacer } from '@/_lib/reserved-keyword-replacer';

// The query preview used to stringify the whole result (and parse it back for the JSON tab) on every render. For a
// result of millions of rows the text passes the browser's string limit: the query manager failed with "couldn't be
// loaded", or the tab ran out of memory. It now writes the same text once per result, up to a limit.
describe('previewOf', () => {
  test.each([
    ['null', null, ''],
    ['undefined', undefined, 'undefined'],
    ['zero', 0, '0'],
    ['false', false, 'false'],
    ['empty string', '', ''],
    ['text', 'hello', 'hello'],
    ['number', 42, '42'],
  ])('%s is shown as before', (_, value, raw) => {
    expect(previewOf(value)).toEqual({ raw, tree: value, truncated: false });
  });

  test.each([
    [
      'rows',
      [
        { id: 1, name: 'a', tags: ['x', 'y'] },
        { id: 2, name: null },
      ],
    ],
    ['nested', { data: [1, 2, 3], meta: { page: 1, when: new Date(Date.UTC(2026, 0, 2)) }, ok: true }],
    ['holes and functions', { a: undefined, b: () => 1, c: [undefined, () => 1, NaN, Infinity] }],
    ['boxed and empty', { n: Object(1), s: Object('t'), e: {}, l: [] }],
    ['window and document', { w: window, d: document, inner: [window] }],
  ])('objects give exactly the text and copy as before: %s', (_, value) => {
    const text = JSON.stringify(value, reservedKeywordReplacer);
    expect(previewOf(value)).toEqual({ raw: text, tree: JSON.parse(text), truncated: false });
  });

  test('a large result stops at the limit and the tree shows the result itself', () => {
    const rows = Array.from({ length: 100000 }, (_, id) => ({ id, title: `photo ${id}`, nested: { a: [id, id] } }));
    const { raw, tree, truncated } = previewOf(rows, 5000);
    expect(truncated).toBe(true);
    expect(raw).toHaveLength(5000);
    expect(JSON.stringify(rows).startsWith(raw)).toBe(true);
    expect(tree).toBe(rows);
  });

  test('past the limit, the Raw tab shows only the start of the text', () => {
    const rows = Array.from({ length: 100000 }, (_, id) => ({ id, title: `photo ${id}` }));
    const { raw, truncated } = previewOf(rows, 2 * PREVIEW_TRUNCATED_LENGTH);
    expect(truncated).toBe(true);
    expect(raw).toHaveLength(PREVIEW_TRUNCATED_LENGTH);
    expect(JSON.stringify(rows).startsWith(raw)).toBe(true);
  });

  test('a large array inside an object is cut too', () => {
    const value = { data: Array.from({ length: 100000 }, (_, i) => i), status: 'ok' };
    const { raw, tree, truncated } = previewOf(value, 1000);
    expect(truncated).toBe(true);
    expect(JSON.stringify(value).startsWith(raw)).toBe(true);
    expect(tree).toBe(value);
  });

  test('circular data is shown instead of failing', () => {
    const value = { name: 'loop' };
    value.self = value;
    expect(previewOf(value)).toEqual({
      raw: '{"name":"loop","self":"[Circular]"}',
      tree: { name: 'loop', self: '[Circular]' },
      truncated: false,
    });
  });
});
