import { BadRequestException } from '@nestjs/common';
import {
  assertLibraryConsumerOptions,
  libraryScopeViolations,
  splitAppLevelOptions,
} from '@modules/data-queries/library/add-to-library.util';

describe('add-to-library.util', () => {
  it('splits app-level options from query logic', () => {
    expect(
      splitAppLevelOptions({
        query: 'x',
        runOnPageLoad: true,
        transformations: { javascript: 'return data' },
        query_timeout: 10,
      })
    ).toEqual({
      appLevel: { runOnPageLoad: true, transformations: { javascript: 'return data' } },
      queryLogic: { query: 'x', query_timeout: 10 },
    });
  });

  describe('libraryScopeViolations', () => {
    it('allows the library scope in templates', () => {
      expect(
        libraryScopeViolations('postgresql', {
          query: 'select {{input.id}}, {{constants.x}}, {{globals.currentUser.email}}',
        })
      ).toEqual([]);
    });

    it('reports parameters, which a library query does not have', () => {
      expect(libraryScopeViolations('postgresql', { query: 'select {{parameters.p}}' })).toEqual(['parameters']);
      expect(libraryScopeViolations('runjs', { code: 'return parameters.p' })).toEqual(['parameters']);
    });

    it('reports app state, ordered and deduped', () => {
      expect(
        libraryScopeViolations('restapi', {
          url: '{{components.t1.value}}',
          headers: [
            ['a', '{{globals.theme.name}}'],
            ['b', '{{components.t2.value}}'],
          ],
        })
      ).toEqual(['components', 'globals.theme']);
    });

    it('handles RunJS code', () => {
      expect(libraryScopeViolations('runjs', { code: 'const page = 1; return page + input.n;' })).toEqual([]);
      expect(libraryScopeViolations('runjs', { code: 'return components.t1.data' })).toEqual(['components']);
    });

    it('allows secrets only in templates', () => {
      expect(libraryScopeViolations('runjs', { code: 'return secrets.k' })).toEqual(['secrets']);
      expect(libraryScopeViolations('restapi', { url: '{{queries.q.data}}' })).toEqual(['queries']);
      expect(libraryScopeViolations('restapi', { url: '{{secrets.k}}' })).toEqual([]);
    });

    it('allows globals.server only in templates', () => {
      expect(libraryScopeViolations('restapi', { url: '{{globals.server.x}}' })).toEqual([]);
      expect(libraryScopeViolations('runjs', { code: 'return globals.server.x' })).toEqual(['globals.server']);
    });

    it('flags queries in RunJS code', () => {
      expect(libraryScopeViolations('runjs', { code: 'return queries.a.run()' })).toEqual(['queries']);
    });

    it('treats assignment targets as reads, not declarations', () => {
      expect(libraryScopeViolations('runjs', { code: 'components += 1; return components.a' })).toEqual(['components']);
      expect(libraryScopeViolations('runjs', { code: 'page = 2; return page' })).toEqual(['page']);
      expect(libraryScopeViolations('runjs', { code: 'let n = 0; n += 1; return n' })).toEqual([]);
    });

    it('flags unparseable templates', () => {
      expect(libraryScopeViolations('postgresql', { query: '{{ input.( }}' })).toEqual(['unparseable']);
    });

    it('ignores keys that are not resolved on the server', () => {
      expect(libraryScopeViolations('restapi', { url: 'x', transformation: '{{components.a}}' })).toEqual([]);
    });

    it('reads templates that span lines', () => {
      expect(libraryScopeViolations('postgresql', { query: '{{\n  page.id\n}}' })).toEqual(['page']);
    });
  });

  describe('assertLibraryConsumerOptions', () => {
    const MESSAGE = 'This query is now a library query. Reload the app to keep editing it.';

    it('throws when the stored library query has a libraryQueryId and the incoming options drop it', () => {
      expect(() => assertLibraryConsumerOptions('library', { libraryQueryId: 'q' }, { query: 'select 1' })).toThrow(
        new BadRequestException(MESSAGE)
      );
    });

    it('passes when the stored library query has not picked one yet', () => {
      expect(() => assertLibraryConsumerOptions('library', { inputs: {} }, { runOnPageLoad: true })).not.toThrow();
    });

    it('passes when the incoming options keep libraryQueryId', () => {
      expect(() =>
        assertLibraryConsumerOptions('library', { libraryQueryId: 'q' }, { libraryQueryId: 'q', inputs: {} })
      ).not.toThrow();
    });

    it('passes for a non-library kind', () => {
      expect(() => assertLibraryConsumerOptions('postgresql', { libraryQueryId: 'q' }, { query: 'x' })).not.toThrow();
    });
  });
});
