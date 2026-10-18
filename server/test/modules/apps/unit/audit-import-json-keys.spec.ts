/**
 * Import rename: JSON keys named __proto__, constructor or prototype survive the copy, and nothing reaches Object.prototype.
 *
 * Adopted from the release audit evidence (repros/integrated/reviewSplitImportJsonKeys.spec.ts, 16 Oct), import path adapted.
 */
import { applyUi2RenamesToImport, rewriteStringsDeep } from '@modules/apps/services/ui2-legacy-names';

describe('import preserves JSON dictionary keys', () => {
  test.each(['__proto__', 'constructor', 'prototype', 'ordinary'])('%s survives identity traversal', (key) => {
    const input = JSON.parse(`{"${key}":{"marker":"kept"},"normal":1}`);
    const output = rewriteStringsDeep(input, (s) => s);
    expect(Object.prototype.hasOwnProperty.call(output, key)).toBe(true);
    expect(JSON.stringify(output)).toBe(JSON.stringify(input));
    expect(Object.getPrototypeOf(output)).toBe(Object.prototype);
  });
  test.each([true, false])('query options preserved when UI2 present=%s', (withUi2) => {
    const options = JSON.parse('{"payload":{"__proto__":{"marker":"kept"},"normal":1}}');
    const data = {
      pages: [{ id: 'page1', appVersionId: 'v1' }],
      components: [
        { id: 'component1', name: 'tags1', pageId: 'page1', type: withUi2 ? 'ShadTagsInput' : 'Text', properties: {} },
      ],
      dataQueries: [{ appVersionId: 'v1', options }],
    };
    const before = JSON.stringify(options);
    applyUi2RenamesToImport(data);
    expect(JSON.stringify(data.dataQueries[0].options)).toBe(before);
    expect((Object.prototype as any).marker).toBeUndefined();
  });
});
