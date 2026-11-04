/**
 * A ListView remembers each Layout's child boxes in `properties.recordLayouts`, keyed by child component id.
 * Components get new ids on a new version, an app import and a page duplicate, so the keys must follow
 * (the same way Form's `buttonToSubmit` does); ids with no mapping are dropped.
 */
import { remapRecordLayoutIds } from '@helpers/record_layouts.helper';

const box = (left: number) => ({ top: 10, left, width: 6, height: 30 });

describe('remapRecordLayoutIds', () => {
  const properties = {
    mode: { value: 'list' },
    recordLayouts: { value: { list: { a: box(1), b: box(2), gone: box(3) }, grid: { a: box(4) } } },
  };

  it('moves every saved box under the new id of its child, in both Layouts', () => {
    const result = remapRecordLayoutIds(properties, { a: 'A2', b: 'B2' });

    expect(result.recordLayouts.value).toEqual({ list: { A2: box(1), B2: box(2) }, grid: { A2: box(4) } });
    expect(result.mode).toEqual({ value: 'list' });
  });

  it('drops ids that have no mapping', () => {
    const result = remapRecordLayoutIds(properties, { a: 'A2' });

    expect(Object.keys(result.recordLayouts.value.list)).toEqual(['A2']);
  });

  it('does not change the properties it was given', () => {
    const before = JSON.stringify(properties);

    remapRecordLayoutIds(properties, { a: 'A2' });

    expect(JSON.stringify(properties)).toBe(before);
  });

  it('returns properties without the memory, or with a malformed one, as they are', () => {
    const plain = { mode: { value: 'list' } };

    expect(remapRecordLayoutIds(plain, { a: 'A2' })).toBe(plain);
    expect(remapRecordLayoutIds(undefined as any, {})).toBeUndefined();
    const odd = { recordLayouts: { value: 'x' } };
    expect(remapRecordLayoutIds(odd, {})).toBe(odd);
  });

  it('does not map an inherited key such as constructor', () => {
    const result = remapRecordLayoutIds({ recordLayouts: { value: { list: { constructor: box(1) } } } }, {});

    expect(result.recordLayouts.value.list).toEqual({});
  });
});
