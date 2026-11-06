/** @jest-environment node */
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  assertLibraryTarget,
  assertLibraryDataSource,
  libraryUsedByMessage,
  toLibraryUsage,
  LibraryConsumer,
  assertReleasableLibraryDraft,
  assertSupportedLibraryKind,
  buildLibraryVariableMap,
  libraryServerReferences,
  withoutLibraryRequestDetails,
  replaceLibraryServerReferences,
  libraryTransformationOf,
  pickPinnedVersion,
  toLibraryPins,
  libraryReleaseBlock,
  libraryPromoteBlock,
  toLibraryCatalog,
  toLibraryRunEntity,
  toRunTarget,
  LibraryRunValues,
  LIBRARY_QUERY_MISSING,
} from '../../../../src/modules/data-queries/library/library-query.util';

const q = (over: Record<string, any> = {}) =>
  ({ id: 'q1', name: 'getCustomer', appVersionId: 'v1', kind: 'postgresql', options: {}, ...over }) as any;

describe('library-query.util', () => {
  describe('buildLibraryVariableMap', () => {
    it('fills globals.currentUser from the signed-in user, not from the client', () => {
      const { variableMap } = buildLibraryVariableMap(
        { query: 'where owner = {{globals.currentUser.email}}', inputs: [] },
        {},
        { currentUser: { id: 'u1', email: 'a@b.c', firstName: 'A', lastName: 'B' } }
      );
      expect(variableMap['{{globals.currentUser.email}}']).toBe('a@b.c');
    });

    it('gives logged-out (public app) runs an empty currentUser instead of failing', () => {
      const { variableMap } = buildLibraryVariableMap({ query: '{{globals.currentUser.email}}', inputs: [] }, {});
      expect(variableMap['{{globals.currentUser.email}}']).toBeUndefined();
    });

    it('resolves {{input.x}} from supplied input values', () => {
      const { variableMap } = buildLibraryVariableMap(
        { query: 'select * from c where id = {{input.id}}', inputs: [{ name: 'id', defaultValue: '1' }] },
        { inputs: { id: 42 } }
      );
      expect(variableMap['{{input.id}}']).toBe(42);
    });

    it('has no parameters: they are neither resolved nor returned', () => {
      const result = buildLibraryVariableMap(
        { query: '{{typeof parameters}}', parameters: [{ name: 'id', defaultValue: '7' }] },
        { parameters: { id: 1 } } as unknown as LibraryRunValues
      );
      expect(result.variableMap['{{typeof parameters}}']).toBe('undefined');
      expect(result).not.toHaveProperty('parameters');
      expect(result.scope).toEqual({ input: {} });
    });

    it('falls back to the default when the input value is missing', () => {
      const { input } = buildLibraryVariableMap(
        { query: '{{input.id}}', inputs: [{ name: 'id', defaultValue: '7' }] },
        undefined
      );
      expect(input).toEqual({ id: '7' });
    });

    it('keeps object and array inputs intact', () => {
      const row = { id: 1, tags: ['a'] };
      const { variableMap } = buildLibraryVariableMap(
        {
          body: '{{input.row}}',
          ids: '{{input.ids.join(",")}}',
          inputs: [{ name: 'row' }, { name: 'ids' }],
        },
        { inputs: { row, ids: [1, 2] } }
      );
      expect(variableMap['{{input.row}}']).toEqual(row);
      expect(variableMap['{{input.ids.join(",")}}']).toBe('1,2');
    });

    it('ignores supplied values that are not declared', () => {
      const { input } = buildLibraryVariableMap(
        { query: 'x', inputs: [{ name: 'region' }] },
        { inputs: { region: 'a', evil: 3 } }
      );
      expect(input).toEqual({ region: 'a' });
    });

    it('leaves constants, secrets and globals.server for server-side resolution', () => {
      const { variableMap } = buildLibraryVariableMap(
        { url: '{{constants.base}}/{{secrets.key}}/{{globals.server.x}}', inputs: [] },
        {}
      );
      expect(Object.keys(variableMap)).toEqual([]);
    });

    it('builds keys from newline-flattened text, matching parseQueryOptions lookups', () => {
      const { variableMap } = buildLibraryVariableMap(
        { query: 'select {{\ninput.id\n}}', inputs: [{ name: 'id' }] },
        { inputs: { id: 3 } }
      );
      expect(variableMap['{{ input.id }}']).toBe(3);
    });

    it('turns a bad variable template into a BadRequest that names the template', () => {
      const run = () => buildLibraryVariableMap({ query: '{{input.a.b}}', inputs: [{ name: 'a' }] }, {});
      expect(run).toThrow(BadRequestException);
      expect(run).toThrow('Could not resolve {{input.a.b}}');
    });

    it('should keep a constants default as text for the server to resolve', () => {
      const { input } = buildLibraryVariableMap(
        {
          query: '{{input.n}} {{input.r}}',
          inputs: [
            { name: 'r', defaultValue: 'eu-{{constants.region}}-{{1+1}}' },
            { name: 'n', defaultValue: '{{constants.x}}' },
          ],
        },
        {}
      );
      expect(input.n).toBe('{{constants.x}}');
      expect(input.r).toBe('eu-{{constants.region}}-2');
    });

    describe('server references in defaults', () => {
      const constants: Record<string, string> = { '{{constants.region}}': 'emea', '{{secrets.k}}': 'TOPSECRET' };
      const resolveServerText = (text: string) =>
        replaceLibraryServerReferences(text, new Map(Object.entries(constants)));

      it('should never expand a supplied value that names a secret', () => {
        const { variableMap, scope } = buildLibraryVariableMap(
          {
            query: "select '{{input.m}}' as label",
            inputs: [{ name: 'n', defaultValue: '{{secrets.k}}' }, { name: 'm' }],
          },
          { inputs: { m: '{{secrets.k}}' } },
          { resolveServerText }
        );
        expect(variableMap['{{input.m}}']).toBe('{{secrets.k}}');
        expect(scope.input).toEqual({ n: '{{secrets.k}}', m: '{{secrets.k}}' });
      });

      it('should let an expression run over a constants default', () => {
        const { variableMap } = buildLibraryVariableMap(
          {
            query: '{{input.region.toUpperCase()}} {{input.region}}',
            inputs: [{ name: 'region', defaultValue: '{{constants.region}}' }],
          },
          {},
          { resolveServerText }
        );
        expect(variableMap['{{input.region.toUpperCase()}}']).toBe('EMEA');
        expect(variableMap['{{input.region}}']).toBe('emea');
      });

      it('should resolve every occurrence in a default, with or without spaces', () => {
        const { input } = buildLibraryVariableMap(
          {
            query: 'x',
            inputs: [{ name: 'r', defaultValue: '{{constants.region}}-{{ constants.region }}-{{1+1}}' }],
          },
          {},
          { resolveServerText }
        );
        expect(input.r).toBe('emea-emea-2');
      });

      it('should keep the unresolved text in the scope sent to the browser', () => {
        const { input, scope } = buildLibraryVariableMap(
          { query: 'x', inputs: [{ name: 'r', defaultValue: 'eu-{{secrets.k}}' }] },
          {},
          { resolveServerText }
        );
        expect(input.r).toBe('eu-TOPSECRET');
        expect(scope.input).toEqual({ r: 'eu-{{secrets.k}}' });
      });

      it('should leave a default as text when no resolver is given or the reference is unknown', () => {
        expect(
          buildLibraryVariableMap({ query: 'x', inputs: [{ name: 'r', defaultValue: '{{constants.nope}}' }] }, {}).input
        ).toEqual({ r: '{{constants.nope}}' });
        expect(replaceLibraryServerReferences('{{constants.nope}}', new Map())).toBe('{{constants.nope}}');
      });

      it('should not leak a resolved default through a template error message', () => {
        const run = () =>
          buildLibraryVariableMap(
            {
              query: '{{JSON.parse(input.cfg)}}',
              inputs: [{ name: 'cfg', defaultValue: '{{secrets.cfg}}' }],
            },
            {},
            {
              resolveServerText: (text) =>
                replaceLibraryServerReferences(text, new Map([['{{secrets.cfg}}', 'TOPSECRET']])),
            }
          );
        expect(run).toThrow(BadRequestException);
        expect(run).toThrow('Could not resolve {{JSON.parse(input.cfg)}}');
        expect(run).not.toThrow('TOPSECRET');
        try {
          run();
        } catch (error) {
          expect(error.message).toContain('{{secrets.cfg}}');
          expect(error.message).not.toContain('TOPSECRET');
        }
      });

      it('should collect the distinct references from input defaults only', () => {
        expect(
          libraryServerReferences({
            query: '{{constants.fromQuery}}',
            inputs: [
              { name: 'a', defaultValue: '{{constants.region}}/{{ secrets.k }}' },
              { name: 'b', defaultValue: '{{constants.region}}' },
              { name: 'c', defaultValue: '{{globals.server.x}}' },
              { name: 'd', defaultValue: 5 },
            ],
            parameters: [{ name: 'e', defaultValue: '{{constants.fromParameter}}' }],
          })
        ).toEqual(['{{constants.region}}', '{{secrets.k}}']);
      });
    });

    it('should resolve moment in a template', () => {
      const { variableMap } = buildLibraryVariableMap(
        { query: "{{moment('2026-01-02').format('YYYY')}}", inputs: [] },
        {}
      );
      expect(variableMap["{{moment('2026-01-02').format('YYYY')}}"]).toBe('2026');
    });

    it('should resolve lodash in a template', () => {
      const { variableMap } = buildLibraryVariableMap(
        { query: '{{_.sum(input.nums)}}', inputs: [{ name: 'nums' }] },
        { inputs: { nums: [1, 2] } }
      );
      expect(variableMap['{{_.sum(input.nums)}}']).toBe(3);
    });

    it('should resolve moment and lodash in a default', () => {
      const { input } = buildLibraryVariableMap(
        {
          query: 'x',
          inputs: [
            { name: 'year', defaultValue: "{{moment('2026-01-02').format('YYYY')}}" },
            { name: 'total', defaultValue: '{{_.sum([1,2])}}' },
          ],
        },
        {}
      );
      expect(input).toEqual({ year: '2026', total: 3 });
    });

    it('should resolve a mixed-text default', () => {
      const { input } = buildLibraryVariableMap(
        {
          query: 'x',
          inputs: [
            { name: 'a', defaultValue: '{{1}}-{{2}}' },
            { name: 'b', defaultValue: 'id-{{1+1}}' },
            { name: 'c', defaultValue: 'row {{({ k: 1 })}}' },
            { name: 'i', defaultValue: '{{3}}{{4}}' },
          ],
        },
        {}
      );
      expect(input).toEqual({ a: '1-2', b: 'id-2', c: 'row {"k":1}', i: '34' });
    });

    it('should ignore inherited property names', () => {
      const { input } = buildLibraryVariableMap(
        {
          query: 'x',
          inputs: [
            { name: 'constructor', defaultValue: 'x' },
            { name: 'toString', defaultValue: 'y' },
          ],
        },
        {}
      );
      expect(input.constructor).toBe('x');
      expect(input.toString).toBe('y');
    });

    it('should not scan the transformation for templates', () => {
      const { variableMap } = buildLibraryVariableMap(
        {
          query: '{{input.a}}',
          inputs: [{ name: 'a', defaultValue: '1' }],
          enableTransformation: true,
          transformation: 'return data.map((r) => ({{input.nope.x}}))',
        },
        {}
      );
      expect(Object.keys(variableMap)).toEqual(['{{input.a}}']);
    });

    it('should fall back per name, not per object', () => {
      const { input } = buildLibraryVariableMap(
        {
          query: '{{input.region}} {{input.limit}}',
          inputs: [
            { name: 'region', defaultValue: 'apac' },
            { name: 'limit', defaultValue: '10' },
          ],
        },
        { inputs: { limit: 5 } }
      );
      expect(input).toEqual({ region: 'apac', limit: 5 });
    });

    it('evaluates a {{…}} input default, so {{5}} becomes the number 5', () => {
      const { input } = buildLibraryVariableMap(
        { query: '{{input.n}}', inputs: [{ name: 'n', defaultValue: '{{5}}' }] },
        {}
      );
      expect(input.n).toBe(5);
    });

    it('does not scan the inputs definitions for templates', () => {
      const { variableMap } = buildLibraryVariableMap(
        { query: 'select 1', inputs: [{ name: 'a', defaultValue: '{{1+1}}' }] },
        {}
      );
      expect(Object.keys(variableMap)).toEqual([]);
    });
  });

  describe('toRunTarget', () => {
    const draft = q({
      id: 'lib',
      name: 'getCustomer',
      kind: 'postgresql',
      dataSourceId: 'ds-draft',
      options: { query: 'draft' },
    });
    it('uses an explicit draft snapshot', () => {
      expect(toRunTarget(draft, { ...draft, name: 'draft' })).toEqual({
        queryId: 'lib',
        name: 'getCustomer',
        kind: 'postgresql',
        dataSourceId: 'ds-draft',
        options: { query: 'draft' },
        versionName: 'draft',
      });
    });
    it('uses the pinned snapshot, not the draft, when there is a version', () => {
      const version = {
        name: 'v3',
        versionNumber: 3,
        kind: 'mysql',
        dataSourceId: 'ds-v3',
        options: { query: 'v3' },
      } as any;
      expect(toRunTarget(draft, version)).toEqual({
        queryId: 'lib',
        name: 'getCustomer',
        kind: 'mysql',
        dataSourceId: 'ds-v3',
        options: { query: 'v3' },
        versionName: 'v3',
      });
    });
  });

  describe('assertLibraryTarget', () => {
    const consumer = q({ id: 'c1', kind: 'library' });
    const org = { organizationId: 'o1' };

    it('rejects a consumer that is not a library query', () => {
      expect(() =>
        assertLibraryTarget({
          consumer: q({ kind: 'restapi' }),
          library: q({ organizationId: 'o1' }),
          consumerApp: org,
        })
      ).toThrow(new BadRequestException('Not a library query'));
    });

    it('404s when the library query is gone', () => {
      expect(() => assertLibraryTarget({ consumer, library: null, consumerApp: org })).toThrow(
        new NotFoundException(LIBRARY_QUERY_MISSING)
      );
    });

    it('404s across workspaces', () => {
      expect(() =>
        assertLibraryTarget({
          consumer,
          library: q({ organizationId: 'o2' }),
          consumerApp: org,
        })
      ).toThrow(NotFoundException);
    });

    it('does not judge the draft kind: a pinned version may still run after the draft changed kind', () => {
      expect(() =>
        assertLibraryTarget({
          consumer,
          library: q({ kind: 'runpy', organizationId: 'o1' }),
          consumerApp: org,
        })
      ).not.toThrow();
    });
  });

  describe('assertSupportedLibraryKind', () => {
    it.each(['runpy', 'workflows', 'library'])('rejects %s library queries', (kind) => {
      expect(() => assertSupportedLibraryKind(kind)).toThrow(BadRequestException);
    });
    it.each(['postgresql', 'restapi', 'runjs'])('allows %s', (kind) => {
      expect(() => assertSupportedLibraryKind(kind)).not.toThrow();
    });
  });

  describe('toLibraryRunEntity', () => {
    it('runs the target under the consumer id and permissions, with cloned options', () => {
      const draft = q({ id: 'lib', appVersionId: 'lib-av', appVersion: { id: 'lib-av' }, options: { query: 'draft' } });
      const target = toRunTarget(draft, {
        versionNumber: 2,
        kind: 'postgresql',
        dataSourceId: 'ds-v2',
        options: { query: 'x' },
      } as any);
      const dataSource = { id: 'ds-v2', kind: 'postgresql' } as any;
      const consumer = q({ id: 'c1', appVersionId: 'consumer-av', permissions: [{ id: 'p' }] });
      const entity = toLibraryRunEntity(target, dataSource, consumer);
      expect(entity.id).toBe('c1');
      expect(entity.name).toBe('getCustomer');
      expect(entity.permissions).toEqual([{ id: 'p' }]);
      expect(entity.kind).toBe('postgresql');
      expect(entity.dataSourceId).toBe('ds-v2');
      expect(entity.dataSource).toBe(dataSource);
      // The library lives on its own app version (default branch), not the consumer's.
      expect(entity.appVersionId).toBe('consumer-av');
      expect(entity.appVersion).toBe(consumer.appVersion);
      expect(entity.options).toEqual({ query: 'x' });
      expect(entity.options).not.toBe(target.options);
    });
  });

  describe('pickPinnedVersion', () => {
    const version = { id: 'ver1', libraryQueryId: 'lib' } as any;
    it('returns the version of the same library query', () => {
      expect(pickPinnedVersion(version, 'lib')).toBe(version);
    });
    it('404s a version that is gone or soft-deleted', () => {
      expect(() => pickPinnedVersion(null, 'lib')).toThrow(new NotFoundException('Library query version not found'));
    });
    it('404s a version that belongs to another library query', () => {
      expect(() => pickPinnedVersion(version, 'other')).toThrow(
        new NotFoundException('Library query version not found')
      );
    });
  });

  describe('assertLibraryDataSource', () => {
    it('returns the data source', () => {
      const dataSource = { id: 'ds' } as any;
      expect(assertLibraryDataSource(dataSource)).toBe(dataSource);
    });
    it('404s when the pinned data source is gone', () => {
      expect(() => assertLibraryDataSource(null)).toThrow(new NotFoundException('Library query data source not found'));
    });
  });

  describe('libraryTransformationOf', () => {
    it('returns the transformation only while it is enabled', () => {
      expect(libraryTransformationOf({ enableTransformation: true, transformation: 'return data.length' })).toBe(
        'return data.length'
      );
      expect(libraryTransformationOf({ enableTransformation: false, transformation: 'return 1' })).toBeUndefined();
      expect(libraryTransformationOf({})).toBeUndefined();
    });
    it('refuses an enabled Python transformation', () => {
      expect(() =>
        libraryTransformationOf({ enableTransformation: true, transformationLanguage: 'python', transformation: 'x' })
      ).toThrow(new BadRequestException('Library transformations must be JavaScript'));
      expect(
        libraryTransformationOf({ enableTransformation: false, transformationLanguage: 'python', transformation: 'x' })
      ).toBeUndefined();
    });
    it('treats an enabled but empty transformation as an empty string', () => {
      expect(libraryTransformationOf({ enableTransformation: true })).toBe('');
    });
    // F01: the editor writes per-language code under `transformations`, which was ignored.
    it('returns the code the editor saved for the transformation language', () => {
      expect(
        libraryTransformationOf({
          enableTransformation: true,
          transformationLanguage: 'javascript',
          transformations: { javascript: 'return 1' },
        })
      ).toBe('return 1');
      expect(libraryTransformationOf({ enableTransformation: true, transformations: { javascript: 'return 2' } })).toBe(
        'return 2'
      );
    });
  });

  describe('withoutLibraryRequestDetails', () => {
    it('drops the request and query definition, keeps the rest of the metadata', () => {
      const result = {
        status: 'ok',
        data: [1],
        metadata: {
          request: { url: 'http://x/TOPSECRET', method: 'GET' },
          queryDefinition: 'http://x/TOPSECRET',
          response: { status: 200 },
          responseHeaders: { a: 'b' },
        },
      };
      expect(withoutLibraryRequestDetails(result)).toEqual({
        status: 'ok',
        data: [1],
        metadata: { response: { status: 200 }, responseHeaders: { a: 'b' } },
      });
      // The input is left alone.
      expect(result.metadata.request).toBeDefined();
    });

    it('drops data.requestObject from a failed result, keeps the response', () => {
      const data = {
        requestObject: { requestUrl: 'http://x/TOPSECRET', requestParams: { k: 'TOPSECRET' } },
        responseObject: { statusCode: 500, body: 'oops' },
        responseHeaders: { a: 'b' },
      };
      const result = {
        status: 'failed',
        message: 'boom',
        data,
        metadata: { request: { url: 'u' }, response: { statusCode: 500 } },
      };

      expect(withoutLibraryRequestDetails(result)).toEqual({
        status: 'failed',
        message: 'boom',
        data: { responseObject: { statusCode: 500, body: 'oops' }, responseHeaders: { a: 'b' } },
        metadata: { response: { statusCode: 500 } },
      });
      // The input is left alone.
      expect(result.data.requestObject).toBeDefined();
    });

    it('leaves array and non-object data alone', () => {
      expect(withoutLibraryRequestDetails({ status: 'ok', data: [{ requestObject: 1 }] })).toEqual({
        status: 'ok',
        data: [{ requestObject: 1 }],
      });
    });

    it('passes through a result with no metadata', () => {
      expect(withoutLibraryRequestDetails({ status: 'failed', message: 'x' })).toEqual({
        status: 'failed',
        message: 'x',
      });
    });
  });

  describe('assertReleasableLibraryDraft', () => {
    it('allows a SQL draft and a JavaScript transformation', () => {
      expect(() => assertReleasableLibraryDraft('postgresql', { query: 'x' })).not.toThrow();
      expect(() =>
        assertReleasableLibraryDraft('restapi', { enableTransformation: true, transformationLanguage: 'javascript' })
      ).not.toThrow();
    });
    it('refuses runpy, workflows and library kinds', () => {
      expect(() => assertReleasableLibraryDraft('runpy', {})).toThrow(
        new BadRequestException("runpy queries can't be used from a query library")
      );
      expect(() => assertReleasableLibraryDraft('workflows', {})).toThrow(BadRequestException);
      expect(() => assertReleasableLibraryDraft('library', {})).toThrow(BadRequestException);
    });
    it('refuses a Python transformation', () => {
      expect(() =>
        assertReleasableLibraryDraft('restapi', { enableTransformation: true, transformationLanguage: 'python' })
      ).toThrow(new BadRequestException('Library transformations must be JavaScript'));
    });
    it('ignores a Python language left over while the transformation is off', () => {
      expect(() =>
        assertReleasableLibraryDraft('restapi', { enableTransformation: false, transformationLanguage: 'python' })
      ).not.toThrow();
    });
  });

  describe('toLibraryCatalog', () => {
    it('lists independent named snapshots without exposing query content', () => {
      const saved = {
        id: 'saved',
        libraryQueryId: 'q1',
        name: 'Release beta',
        versionNumber: 1,
        kind: 'restapi',
        dataSourceId: 'source',
        options: { url: 'secret', inputs: [{ name: 'id' }] },
        createdAt: new Date(),
      };
      const draft = { ...saved, id: 'draft-id', name: 'Try another URL' };
      const view = toLibraryCatalog(
        [{ id: 'q1', name: 'Customers' }],
        [saved],
        new Map(),
        new Map(),
        new Map(),
        new Map(),
        [draft]
      );
      expect(view.queries[0]).toMatchObject({
        name: 'Customers',
        drafts: [{ id: 'draft-id', name: 'Try another URL', status: 'DRAFT', inputs: [{ name: 'id' }] }],
        versions: [{ id: 'saved', name: 'Release beta', status: 'PUBLISHED' }],
      });
      expect(JSON.stringify(view)).not.toContain('secret');
      expect(view.queries[0]).not.toHaveProperty('draft');
    });
  });
  describe('toLibraryPins', () => {
    it('keeps a saved version named draft distinct from editable drafts and missing pins', () => {
      const base = {
        consumerQueryName: 'consumer',
        libraryQueryName: 'Customers',
        pinnedVersionName: 'draft',
        releasedVersionName: 'draft',
        pinnedVersionId: 'saved',
        releasedVersionId: 'saved',
        draftId: null,
        draftName: null,
        pinnedEnvironmentName: 'production',
        pinnedEnvironmentPriority: 3,
      };
      const [saved, draft, missing] = toLibraryPins([
        base,
        { ...base, pinnedVersionId: null, draftId: 'editable', draftName: 'B' },
        { ...base, pinnedVersionId: null },
      ]);
      expect(libraryReleaseBlock([saved])).toBeNull();
      expect(libraryPromoteBlock([saved], 'production', 3)).toBeNull();
      expect(libraryReleaseBlock([draft])).not.toBeNull();
      expect(libraryPromoteBlock([missing], 'production', 3)).not.toBeNull();
    });
  });

  describe('library usage and delete guards', () => {
    const consumer = (over: Partial<LibraryConsumer> = {}): LibraryConsumer => ({
      appId: 'a1',
      appName: 'Sales CRM',
      appType: 'front-end',
      appVersionName: 'v1',
      queryId: 'c1',
      queryName: 'getCustomerLib',
      libraryQueryId: 'lq1',
      libraryQueryVersionId: 'snapshot-id',
      status: 'PUBLISHED',
      versionName: 'v2',
      pinnedEnvironment: null,
      ...over,
    });
    const moduleConsumer = consumer({
      appId: 'm1',
      appName: 'Address block',
      appType: 'module',
      appVersionName: 'v3',
      queryId: 'c2',
      versionName: 'v1',
    });

    describe('toLibraryUsage', () => {
      it('should list modules separately from apps', () => {
        expect(toLibraryUsage([consumer(), moduleConsumer])).toMatchObject({
          apps: [{ name: 'Sales CRM', queries: [{ versionName: 'v2' }] }],
          modules: [{ name: 'Address block', queries: [{ versionName: 'v1' }] }],
        });
      });

      it('names the app version and the pin on each query, and groups queries by app', () => {
        const usage = toLibraryUsage([
          consumer({ appVersionName: 'v1', versionName: 'draft' }),
          consumer({ queryId: 'c3', queryName: 'other', appVersionName: 'v2', pinnedEnvironment: 'Staging' }),
        ]);
        expect(usage.modules).toEqual([]);
        expect(usage.apps).toHaveLength(1);
        expect(usage.apps[0].queries).toEqual([
          {
            id: 'c1',
            name: 'getCustomerLib',
            appVersionName: 'v1',
            libraryQueryId: 'lq1',
            libraryQueryVersionId: 'snapshot-id',
            status: 'PUBLISHED',
            versionName: 'draft',
            pinnedEnvironment: null,
          },
          {
            id: 'c3',
            name: 'other',
            appVersionName: 'v2',
            libraryQueryId: 'lq1',
            libraryQueryVersionId: 'snapshot-id',
            status: 'PUBLISHED',
            versionName: 'v2',
            pinnedEnvironment: 'Staging',
          },
        ]);
      });
    });

    describe('libraryUsedByMessage', () => {
      it('counts apps only', () => {
        expect(libraryUsedByMessage([consumer()])).toBe(
          'Used by 1 app(s): Sales CRM · v1. Remove it from those first.'
        );
      });

      it('counts modules only', () => {
        expect(libraryUsedByMessage([moduleConsumer])).toBe(
          'Used by 1 module(s): Address block · v3. Remove it from those first.'
        );
      });

      it('counts apps and modules, naming each app version once', () => {
        const message = libraryUsedByMessage([
          consumer(),
          consumer({ queryId: 'c9', queryName: 'second' }),
          consumer({ appVersionName: 'v2' }),
          moduleConsumer,
        ]);
        expect(message).toBe(
          'Used by 1 app(s) and 1 module(s): Sales CRM · v1, Sales CRM · v2, Address block · v3. Remove it from those first.'
        );
      });
    });
  });
});
