/** @jest-environment node */
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  assertLibraryTarget,
  assertSameLibrary,
  buildLibraryVariableMap,
  toLibraryRunEntity,
} from '../../../../src/modules/data-queries/library/library-query.util';

const q = (over: Record<string, any> = {}) =>
  ({ id: 'q1', name: 'getCustomer', appVersionId: 'v1', kind: 'postgresql', options: {}, ...over }) as any;

describe('library-query.util', () => {
  describe('buildLibraryVariableMap', () => {
    it('fills globals.currentUser from the signed-in user, not from the client', () => {
      const { variableMap } = buildLibraryVariableMap(
        { query: 'where owner = {{globals.currentUser.email}}', parameters: [] },
        {},
        { currentUser: { id: 'u1', email: 'a@b.c', firstName: 'A', lastName: 'B' } }
      );
      expect(variableMap['{{globals.currentUser.email}}']).toBe('a@b.c');
    });

    it('gives logged-out (public app) runs an empty currentUser instead of failing', () => {
      const { variableMap } = buildLibraryVariableMap({ query: '{{globals.currentUser.email}}', parameters: [] }, {});
      expect(variableMap['{{globals.currentUser.email}}']).toBeUndefined();
    });

    it('resolves {{parameters.x}} from inputs', () => {
      const { variableMap } = buildLibraryVariableMap(
        { query: 'select * from c where id = {{parameters.id}}', parameters: [{ name: 'id', defaultValue: '1' }] },
        { id: 42 }
      );
      expect(variableMap['{{parameters.id}}']).toBe(42);
    });

    it('falls back to the default when the input is missing', () => {
      const { parameters } = buildLibraryVariableMap(
        { query: '{{parameters.id}}', parameters: [{ name: 'id', defaultValue: '7' }] },
        undefined
      );
      expect(parameters).toEqual({ id: '7' });
    });

    it('evaluates a {{…}} default, so {{5}} becomes the number 5', () => {
      const { parameters } = buildLibraryVariableMap(
        { query: '{{parameters.n}}', parameters: [{ name: 'n', defaultValue: '{{5}}' }] },
        {}
      );
      expect(parameters.n).toBe(5);
    });

    it('keeps object and array inputs intact', () => {
      const row = { id: 1, tags: ['a'] };
      const { variableMap } = buildLibraryVariableMap(
        {
          body: '{{parameters.row}}',
          ids: '{{parameters.ids.join(",")}}',
          parameters: [{ name: 'row' }, { name: 'ids' }],
        },
        { row, ids: [1, 2] }
      );
      expect(variableMap['{{parameters.row}}']).toEqual(row);
      expect(variableMap['{{parameters.ids.join(",")}}']).toBe('1,2');
    });

    it('ignores inputs that are not declared parameters', () => {
      const { parameters } = buildLibraryVariableMap({ query: 'x', parameters: [{ name: 'id' }] }, { id: 1, evil: 2 });
      expect(parameters).toEqual({ id: 1 });
    });

    it('leaves constants, secrets and globals.server for server-side resolution', () => {
      const { variableMap } = buildLibraryVariableMap(
        { url: '{{constants.base}}/{{secrets.key}}/{{globals.server.x}}', parameters: [] },
        {}
      );
      expect(Object.keys(variableMap)).toEqual([]);
    });

    it('builds keys from newline-flattened text, matching parseQueryOptions lookups', () => {
      const { variableMap } = buildLibraryVariableMap(
        { query: 'select {{\nparameters.id\n}}', parameters: [{ name: 'id' }] },
        { id: 3 }
      );
      expect(variableMap['{{ parameters.id }}']).toBe(3);
    });

    it('turns a bad variable template into a BadRequest that names the template', () => {
      const run = () => buildLibraryVariableMap({ query: '{{parameters.a.b}}', parameters: [{ name: 'a' }] }, {});
      expect(run).toThrow(BadRequestException);
      expect(run).toThrow('Could not resolve {{parameters.a.b}}');
    });

    it('turns a server-side reference in a parameter default into a BadRequest that names the default', () => {
      const run = () =>
        buildLibraryVariableMap(
          { query: '{{parameters.n}}', parameters: [{ name: 'n', defaultValue: '{{constants.x}}' }] },
          {}
        );
      expect(run).toThrow(BadRequestException);
      expect(run).toThrow('Could not resolve {{constants.x}}');
    });
  });

  describe('assertLibraryTarget', () => {
    const consumer = q({ id: 'c1', kind: 'library' });
    const org = { organizationId: 'o1' };

    it('rejects a consumer that is not a library query', () => {
      expect(() =>
        assertLibraryTarget({
          consumer: q({ kind: 'restapi' }),
          library: q(),
          consumerApp: org,
          libraryApp: { ...org, type: 'query_library' },
        })
      ).toThrow(new BadRequestException('Not a library query'));
    });

    it('404s when the library query is gone', () => {
      expect(() => assertLibraryTarget({ consumer, library: null, consumerApp: org, libraryApp: null })).toThrow(
        new NotFoundException('Library query not found')
      );
    });

    it('403s across workspaces', () => {
      expect(() =>
        assertLibraryTarget({
          consumer,
          library: q(),
          consumerApp: org,
          libraryApp: { organizationId: 'o2', type: 'query_library' },
        })
      ).toThrow(ForbiddenException);
    });

    it('rejects a target that is not inside a query library app', () => {
      expect(() =>
        assertLibraryTarget({ consumer, library: q(), consumerApp: org, libraryApp: { ...org, type: 'front-end' } })
      ).toThrow(new BadRequestException('Not a query library'));
    });

    it.each(['runpy', 'workflows', 'library'])('rejects %s library queries', (kind) => {
      expect(() =>
        assertLibraryTarget({
          consumer,
          library: q({ kind }),
          consumerApp: org,
          libraryApp: { ...org, type: 'query_library' },
        })
      ).toThrow(BadRequestException);
    });
  });

  describe('assertSameLibrary', () => {
    const runjsPrimary = () => q({ kind: 'runjs' });

    it('allows a sibling in the same library version when the primary is RunJS', () => {
      expect(() => assertSameLibrary(runjsPrimary(), q({ id: 'q2' }))).not.toThrow();
    });
    it('403s a sibling when the primary is not RunJS — only library RunJS calls siblings', () => {
      expect(() => assertSameLibrary(q({ kind: 'postgresql' }), q({ id: 'q2' }))).toThrow(
        new ForbiddenException('Only RunJS library queries can run other library queries')
      );
    });
    it('403s a query from another library', () => {
      expect(() => assertSameLibrary(runjsPrimary(), q({ id: 'q2', appVersionId: 'v9' }))).toThrow(
        new ForbiddenException('Library query is not in the same library')
      );
    });
    it('404s a missing sibling', () => {
      expect(() => assertSameLibrary(runjsPrimary(), null)).toThrow(NotFoundException);
    });
  });

  describe('toLibraryRunEntity', () => {
    it('runs the library query under the consumer id and permissions, with cloned options', () => {
      const library = q({ id: 'lib', options: { query: 'x' } });
      const consumer = q({ id: 'c1', permissions: [{ id: 'p' }] });
      const entity = toLibraryRunEntity(library, consumer);
      expect(entity.id).toBe('c1');
      expect(entity.permissions).toEqual([{ id: 'p' }]);
      expect(entity.options).toEqual({ query: 'x' });
      expect(entity.options).not.toBe(library.options);
    });
  });
});
