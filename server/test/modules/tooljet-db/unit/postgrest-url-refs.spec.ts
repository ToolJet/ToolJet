/** @group database */
import { extractTableRefs, rewriteTableRefs } from '@modules/tooljet-db/helpers/postgrest-url-refs';

const L1 = '11111111-1111-4111-8111-111111111111';
const L7 = '77777777-7777-4777-8777-777777777777';
const R1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const R7 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const map = new Map([
  [L1, R1],
  [L7, R7],
]);

describe('postgrest-url-refs', () => {
  describe('extractTableRefs', () => {
    it('should return the path uuid and no embedded refs for a plain read', () => {
      expect(extractTableRefs(`/${L1}?select=name,gpa`)).toEqual({ path: L1, embedded: [] });
    });

    it('should find an embedded resource in select', () => {
      expect(extractTableRefs(`/${L1}?select=*,${L7}(title)`)).toEqual({ path: L1, embedded: [L7] });
    });

    it('should find an embedded resource in order', () => {
      expect(extractTableRefs(`/${L1}?order=${L7}(title).asc`)).toEqual({ path: L1, embedded: [L7] });
    });

    it('should find a filter-key prefix', () => {
      expect(extractTableRefs(`/${L1}?${L7}.title=eq.x`)).toEqual({ path: L1, embedded: [L7] });
    });

    it('should NOT treat a uuid-shaped filter value as a reference', () => {
      expect(extractTableRefs(`/${L1}?owner_id=eq.${L7}`)).toEqual({ path: L1, embedded: [] });
    });

    it('should find refs at every nesting depth', () => {
      expect(extractTableRefs(`/${L1}?select=*,${L7}(title,${L1}(name))`)).toEqual({
        path: L1,
        embedded: [L7, L1],
      });
    });

    it('should find a ref behind an alias and behind a hint', () => {
      expect(extractTableRefs(`/${L1}?select=alias:${L7}(title)`).embedded).toEqual([L7]);
      expect(extractTableRefs(`/${L1}?select=${L7}!inner(title)`).embedded).toEqual([L7]);
    });

    it('should return a null path when the last segment is not a uuid', () => {
      expect(extractTableRefs('/rpc/some_function?a=1').path).toBeNull();
    });
  });

  describe('rewriteTableRefs', () => {
    it('should rewrite the path segment', () => {
      expect(rewriteTableRefs(`/${L1}?select=name`, map)).toBe(`/${R1}?select=name`);
    });

    it('should rewrite an embedded select resource', () => {
      expect(rewriteTableRefs(`/${L1}?select=*,${L7}(title)`, map)).toBe(`/${R1}?select=*,${R7}(title)`);
    });

    it('should rewrite an embedded order resource', () => {
      expect(rewriteTableRefs(`/${L1}?order=${L7}(title).asc`, map)).toBe(`/${R1}?order=${R7}(title).asc`);
    });

    it('should rewrite a filter-key prefix', () => {
      expect(rewriteTableRefs(`/${L1}?${L7}.title=eq.x`, map)).toBe(`/${R1}?${R7}.title=eq.x`);
    });

    it('should leave a uuid-shaped filter value byte identical', () => {
      expect(rewriteTableRefs(`/${L1}?owner_id=eq.${L7}`, map)).toBe(`/${R1}?owner_id=eq.${L7}`);
    });

    it('should rewrite a value-position uuid nowhere even when the same uuid is also embedded', () => {
      expect(rewriteTableRefs(`/${L1}?select=*,${L7}(title)&owner_id=eq.${L7}`, map)).toBe(
        `/${R1}?select=*,${R7}(title)&owner_id=eq.${L7}`
      );
    });

    it('should return a url with no uuids unchanged', () => {
      expect(rewriteTableRefs('/rpc/some_function?a=1', map)).toBe('/rpc/some_function?a=1');
    });
  });
});
