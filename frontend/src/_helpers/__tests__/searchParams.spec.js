import { buildSearchParams } from '../searchParams';

describe('buildSearchParams', () => {
  it('serializes primitives and encodes values', () => {
    expect(buildSearchParams({ type: 'front-end', searchKey: 'my app', page: 2 })).toBe(
      'page=2&searchKey=my%20app&type=front-end'
    );
  });

  it('drops undefined, null, empty strings and empty arrays', () => {
    expect(buildSearchParams({ a: undefined, b: null, c: '', d: [], e: [''], f: 'kept' })).toBe('f=kept');
  });

  it('keeps 0 and false', () => {
    expect(buildSearchParams({ page: 0, all: false })).toBe('all=false&page=0');
  });

  it('joins arrays with commas', () => {
    expect(buildSearchParams({ release_status: ['released', 'unreleased'] })).toBe(
      'release_status=released,unreleased'
    );
  });

  it('returns an empty string when nothing is set', () => {
    expect(buildSearchParams({})).toBe('');
    expect(buildSearchParams({ a: undefined })).toBe('');
  });
});
