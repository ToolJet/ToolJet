import { EntityManager } from 'typeorm';
import {
  AppSnapshot,
  GIT_PULL_POLICY,
  JSON_IMPORT_POLICY,
  ResourcePolicy,
} from '../../../../src/modules/import-export-resources/app-snapshot/service';
import { App } from '../../../../src/entities/app.entity';
import { AppVersion } from '../../../../src/entities/app_version.entity';
import { DataSource } from '../../../../src/entities/data_source.entity';
import { APP_TYPES } from '../../../../src/modules/apps/constants';
import { FkReferenceMap } from '../../../../src/modules/import-export-resources/app-snapshot/fk-reference-map';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// v4 UUIDs require group-3 to start with '4' and group-4 to start with [89ab].
// The regex sweep filters by exactly that shape, so invalid-variant fixtures
// silently fail to rewrite.
const corAppA = '11111111-aaaa-4aaa-aaaa-111111111111';
const corVersionA = '22222222-aaaa-4aaa-aaaa-222222222222';
const corPageA = '33333333-aaaa-4aaa-aaaa-333333333333';
const corComponentA = '44444444-aaaa-4aaa-aaaa-444444444444';
const corLayoutA = '77777777-aaaa-4aaa-aaaa-777777777777';
const corQueryA = '88888888-aaaa-4aaa-aaaa-888888888888';
const corModuleM = '55555555-bbbb-4bbb-bbbb-555555555555';
const corDataSourceD = '66666666-cccc-4ccc-cccc-666666666666';

// "Source" local ids — what the pushing instance's DB had.
const srcAppA = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
const srcVersionA = 'aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa';
const srcPageA = 'aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa';
const srcComponentA = 'aaaaaaaa-4444-4444-8444-aaaaaaaaaaaa';
const srcLayoutA = 'aaaaaaaa-7777-4777-8777-aaaaaaaaaaaa';
const srcQueryA = 'aaaaaaaa-8888-4888-8888-aaaaaaaaaaaa';
const srcModuleM = 'bbbbbbbb-5555-4555-8555-bbbbbbbbbbbb';
const srcDataSourceD = 'cccccccc-6666-4666-8666-cccccccccccc';

// "Target" local ids — what the receiving instance's DB has (for matchOrCreate).
const tgtAppA = 'dddddddd-1111-4111-9111-dddddddddddd';
const tgtVersionA = 'dddddddd-2222-4222-9222-dddddddddddd';
const tgtModuleM = 'eeeeeeee-5555-4555-9555-eeeeeeeeeeee';
const tgtDataSourceD = 'ffffffff-6666-4666-9666-ffffffffffff';

const ORG = 'org-test-1';

function buildAppData() {
  return {
    apps: {
      id: srcAppA,
      co_relation_id: corAppA,
      name: 'My App',
      slug: srcAppA,
      type: APP_TYPES.FRONT_END,
      organizationId: ORG,
    },
    versions: [
      {
        id: srcVersionA,
        co_relation_id: corVersionA,
        name: 'v1',
        appId: srcAppA,
        homePageId: srcPageA,
        branchId: 'branch-local-only',
        currentEnvironmentId: 'env-local-only',
        pulledAt: '2026-04-01T00:00:00Z',
      },
    ],
    pages: [{ id: srcPageA, co_relation_id: corPageA, appVersionId: srcVersionA, name: 'home' }],
    components: [
      {
        id: srcComponentA,
        co_relation_id: corComponentA,
        appVersionId: srcVersionA,
        pageId: srcPageA,
        type: 'ModuleViewer',
        properties: {
          // Embedded refs already store the cor_id (today's import-export
          // convention), so they pass through the chained rewrite via the
          // cor → target-local step alone.
          moduleAppId: { value: corModuleM },
          moduleVersionId: { value: 'mod-ref-id-not-uuid-on-purpose' },
        },
        layouts: [{ id: srcLayoutA, co_relation_id: corLayoutA, updatedAt: 'drift' }],
      },
    ],
    queries: [
      {
        id: srcQueryA,
        co_relation_id: corQueryA,
        appVersionId: srcVersionA,
        options: { organization_id: ORG, query: `select 1 from t where id = '${srcComponentA}'` },
      },
    ],
    dataSources: [
      {
        id: srcDataSourceD,
        co_relation_id: corDataSourceD,
        name: 'rest1',
        organizationId: ORG,
      },
    ],
    modules: {
      id: srcModuleM,
      co_relation_id: corModuleM,
      name: 'shared-module',
      type: APP_TYPES.MODULE,
      organizationId: ORG,
    },
  };
}

function makeManager(canned: { App?: App[]; AppVersion?: AppVersion[]; DataSource?: DataSource[] }) {
  const find = jest.fn(async (entity: unknown, _options?: unknown) => {
    if (entity === App) return canned.App ?? [];
    if (entity === AppVersion) return canned.AppVersion ?? [];
    if (entity === DataSource) return canned.DataSource ?? [];
    return [];
  });
  return { manager: { find } as unknown as EntityManager, find };
}

function makeService(): AppSnapshot {
  const fkMapStub = {} as unknown as FkReferenceMap;
  return new AppSnapshot(fkMapStub);
}

describe('AppSnapshot.export', () => {
  it('preserves id and co_relation_id on every record (no swap)', () => {
    const service = makeService();
    const snap = service.export(buildAppData()) as ReturnType<typeof buildAppData>;

    expect(snap.apps.id).toBe(srcAppA);
    expect(snap.apps.co_relation_id).toBe(corAppA);
    expect(snap.versions[0].id).toBe(srcVersionA);
    expect(snap.versions[0].co_relation_id).toBe(corVersionA);
    expect(snap.components[0].id).toBe(srcComponentA);
    expect(snap.components[0].co_relation_id).toBe(corComponentA);
  });

  it('preserves FK refs as source-local ids (no UUID rewrite on export)', () => {
    const service = makeService();
    const snap = service.export(buildAppData()) as ReturnType<typeof buildAppData>;

    expect(snap.versions[0].appId).toBe(srcAppA);
    expect(snap.pages[0].appVersionId).toBe(srcVersionA);
    expect(snap.components[0].appVersionId).toBe(srcVersionA);
    expect(snap.components[0].pageId).toBe(srcPageA);
    expect(snap.queries[0].options.query).toContain(srcComponentA);
  });

  it('preserves cor-keyed embedded refs as-is', () => {
    const service = makeService();
    const snap = service.export(buildAppData()) as ReturnType<typeof buildAppData>;
    expect(snap.components[0].properties.moduleAppId.value).toBe(corModuleM);
  });

  it('strips instance-local fields per STRIP_FIELDS', () => {
    const service = makeService();
    const snap = service.export(buildAppData()) as ReturnType<typeof buildAppData>;
    const v = snap.versions[0] as Record<string, unknown>;
    expect(v.branchId).toBeUndefined();
    expect(v.currentEnvironmentId).toBeUndefined();
    expect(v.pulledAt).toBeUndefined();
    expect((snap.components[0].layouts[0] as Record<string, unknown>).updatedAt).toBeUndefined();
    expect((snap.queries[0].options as Record<string, unknown>).organization_id).toBeUndefined();
  });

  it('does not mutate the input', () => {
    const service = makeService();
    const input = buildAppData();
    const inputAppId = input.apps.id;
    service.export(input);
    expect(input.apps.id).toBe(inputAppId);
    expect((input.versions[0] as Record<string, unknown>).branchId).toBe('branch-local-only');
  });
});

describe('AppSnapshot.import', () => {
  it('alwaysCreate: rewrites source-local ids to fresh target-local ids; co_relation_id rides through unchanged', async () => {
    const service = makeService();
    const portable = service.export(buildAppData());
    const { manager, find } = makeManager({});

    const restored = (await service.import(portable, {
      manager,
      context: { organizationId: ORG },
      policy: { ...JSON_IMPORT_POLICY, modules: 'alwaysCreate', dataSources: 'alwaysCreate' } as ResourcePolicy,
    })) as ReturnType<typeof buildAppData>;

    expect(find).not.toHaveBeenCalled();

    // Each entity got a fresh local id, distinct from source.
    expect(restored.apps.id).toMatch(UUID_RE);
    expect(restored.apps.id).not.toBe(srcAppA);
    expect(restored.apps.co_relation_id).toBe(corAppA);

    expect(restored.versions[0].id).toMatch(UUID_RE);
    expect(restored.versions[0].id).not.toBe(srcVersionA);
    // Parent FK rewritten to the resolved target-local app id (chained
    // through srcAppA → corAppA → tgtAppA).
    expect(restored.versions[0].appId).toBe(restored.apps.id);

    // Children parented to resolved target-local versions.
    expect(restored.pages[0].appVersionId).toBe(restored.versions[0].id);
    expect(restored.components[0].pageId).toBe(restored.pages[0].id);

    // Embedded ref (cor-keyed) rewritten via cor → target-local step.
    expect(restored.components[0].properties.moduleAppId.value).toBe(restored.modules.id);
  });

  it('matchOrCreate: reuses existing local ids when cor_id matches in DB', async () => {
    const service = makeService();
    const portable = service.export(buildAppData());
    const { manager } = makeManager({
      App: [
        { id: tgtAppA, co_relation_id: corAppA, type: APP_TYPES.FRONT_END } as App,
        { id: tgtModuleM, co_relation_id: corModuleM, type: APP_TYPES.MODULE } as App,
      ],
      AppVersion: [{ id: tgtVersionA, co_relation_id: corVersionA, appId: tgtAppA } as AppVersion],
      DataSource: [{ id: tgtDataSourceD, co_relation_id: corDataSourceD } as DataSource],
    });

    const restored = (await service.import(portable, {
      manager,
      context: { organizationId: ORG },
      policy: GIT_PULL_POLICY,
    })) as ReturnType<typeof buildAppData>;

    expect(restored.apps.id).toBe(tgtAppA);
    expect(restored.versions[0].id).toBe(tgtVersionA);
    expect(restored.modules.id).toBe(tgtModuleM);
    expect(restored.dataSources[0].id).toBe(tgtDataSourceD);

    expect(restored.versions[0].appId).toBe(tgtAppA);
    expect(restored.components[0].properties.moduleAppId.value).toBe(tgtModuleM);

    // Children get fresh ids (V1 — parent-scoped child matching deferred).
    expect(restored.components[0].id).toMatch(UUID_RE);
    expect(restored.components[0].id).not.toBe(srcComponentA);
    expect(restored.components[0].id).not.toBe(tgtAppA);
  });

  it('matchOrCreate: type-filters apps vs modules so they cannot collide', async () => {
    const service = makeService();
    const portable = service.export(buildAppData());
    const { manager, find } = makeManager({});

    await service.import(portable, {
      manager,
      context: { organizationId: ORG },
      policy: GIT_PULL_POLICY,
    });

    const appCalls = find.mock.calls.filter((c) => c[0] === App);
    expect(appCalls.length).toBe(2);
    const wheres = appCalls.map((c) => (c[1] as { where: Record<string, unknown> }).where);
    const types = wheres.map((w) => w.type).sort();
    expect(types).toEqual([APP_TYPES.FRONT_END, APP_TYPES.MODULE]);
    for (const w of wheres) {
      expect(w.organizationId).toBe(ORG);
    }
  });

  it('matchOrCreate falls through to fresh uuid when no row matches', async () => {
    const service = makeService();
    const portable = service.export(buildAppData());
    const { manager } = makeManager({});

    const restored = (await service.import(portable, {
      manager,
      context: { organizationId: ORG },
      policy: GIT_PULL_POLICY,
    })) as ReturnType<typeof buildAppData>;

    expect(restored.apps.id).toMatch(UUID_RE);
    expect(restored.apps.id).not.toBe(srcAppA);
    expect(restored.apps.id).not.toBe(tgtAppA);
    expect(restored.apps.co_relation_id).toBe(corAppA);
  });

  it('does not rewrite the slug field even though it looks like a UUID', async () => {
    const service = makeService();
    const portable = service.export(buildAppData());
    const { manager } = makeManager({
      App: [{ id: tgtAppA, co_relation_id: corAppA, type: APP_TYPES.FRONT_END } as App],
    });

    const restored = (await service.import(portable, {
      manager,
      context: { organizationId: ORG },
      policy: GIT_PULL_POLICY,
    })) as ReturnType<typeof buildAppData>;

    expect(restored.apps.slug).toBe(srcAppA);
  });

  it('versions: scopes lookup by resolved parent app target-local id', async () => {
    const service = makeService();
    const portable = service.export(buildAppData());
    const { manager, find } = makeManager({
      App: [{ id: tgtAppA, co_relation_id: corAppA, type: APP_TYPES.FRONT_END } as App],
      AppVersion: [],
    });

    await service.import(portable, {
      manager,
      context: { organizationId: ORG },
      policy: GIT_PULL_POLICY,
    });

    const versionCalls = find.mock.calls.filter((c) => c[0] === AppVersion);
    expect(versionCalls.length).toBe(1);
    const where = (versionCalls[0][1] as { where: Record<string, { _value?: unknown } | unknown> }).where;
    const appIdOp = where.appId as { _value?: string[] };
    expect(appIdOp._value).toEqual([tgtAppA]);
  });

  it('round-trip: export → import on a fully-matching DB returns the source ids', async () => {
    const service = makeService();
    const portable = service.export(buildAppData());
    const { manager } = makeManager({
      App: [
        { id: srcAppA, co_relation_id: corAppA, type: APP_TYPES.FRONT_END } as App,
        { id: srcModuleM, co_relation_id: corModuleM, type: APP_TYPES.MODULE } as App,
      ],
      AppVersion: [{ id: srcVersionA, co_relation_id: corVersionA, appId: srcAppA } as AppVersion],
      DataSource: [{ id: srcDataSourceD, co_relation_id: corDataSourceD } as DataSource],
    });

    const restored = (await service.import(portable, {
      manager,
      context: { organizationId: ORG },
      policy: GIT_PULL_POLICY,
    })) as ReturnType<typeof buildAppData>;

    // Same instance pushing and pulling: target ids equal source ids.
    expect(restored.apps.id).toBe(srcAppA);
    expect(restored.versions[0].id).toBe(srcVersionA);
    expect(restored.versions[0].appId).toBe(srcAppA);
    expect(restored.modules.id).toBe(srcModuleM);
    expect(restored.dataSources[0].id).toBe(srcDataSourceD);
    expect(restored.components[0].properties.moduleAppId.value).toBe(srcModuleM);
  });

  it('embedded ref already-cor passes through cor → target-local step alone', async () => {
    // Build a snapshot whose component property is a cor (the convention),
    // not a source-local id. The chained rewrite has nothing to do at
    // step 1 (localToCor lookup misses), then translates at step 2.
    const service = makeService();
    const portable = service.export(buildAppData());
    const { manager } = makeManager({
      App: [{ id: tgtModuleM, co_relation_id: corModuleM, type: APP_TYPES.MODULE } as App],
    });

    const restored = (await service.import(portable, {
      manager,
      context: { organizationId: ORG },
      policy: GIT_PULL_POLICY,
    })) as ReturnType<typeof buildAppData>;

    expect(restored.components[0].properties.moduleAppId.value).toBe(tgtModuleM);
  });
});
