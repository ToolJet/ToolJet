beforeEach(() => {
  useStore.setState((state) => ({
    license: { featureAccess: { ...state.license.featureAccess, queryLibraryEnabled: true } },
  }));
});
import useStore from '@/AppBuilder/_stores/store';
import config from 'config';
import { AppBuilderTestSession } from '@/test/app-builder';
import {
  viewedLibraryVersionId,
  withViewedLibraryVersion,
  libraryRunEnvironment,
  isLibraryQueryLocked,
} from '../../queryLibrarySlice';

const dev = { id: 'env-dev', name: 'development', priority: 1 };
const staging = { id: 'env-stg', name: 'staging', priority: 2 };
const prod = { id: 'env-prod', name: 'production', priority: 3 };
const identity = { id: 'q1', name: 'lookup' };
const snapshot = (id, environment) => ({
  id,
  name: id,
  kind: 'restapi',
  dataSourceId: null,
  options: { url: id },
  ...(environment ? { environment } : {}),
});
let session;
let view;

beforeEach(async () => {
  view = {
    drafts: [snapshot('draft-one')],
    versions: [snapshot('saved-dev', dev), snapshot('saved-stg', staging), snapshot('saved-prod', prod)],
  };
  session = new AppBuilderTestSession({
    scenario: {
      surface: 'app-editor',
      capabilities: {
        network: [{ url: `${config.apiUrl}/query-library/queries/q1/versions`, json: () => view }],
      },
    },
  });
  await session.store.act(async (state) => {
    useStore.setState({ license: { featureAccess: { queryLibraryEnabled: true } } });
    state.queryLibrary.beginLibrarySession('workspace1');
    state.queryLibrary.setLibraryMode(true);
    state.queryLibrary.setLibraryEnvironments([dev, staging, prod]);
    state.dataQuery.setQueries([identity]);
    await state.queryLibrary.loadLibraryVersions('q1');
  });
});

afterEach(async () => session.store.act((state) => state.queryLibrary.endLibrarySession()));

async function select(id, environment) {
  await session.store.act((state) => {
    state.queryLibrary.setLibraryRunEnvironment('q1', environment);
    state.queryLibrary.viewLibraryVersion('q1', id);
  });
}

function expectSelection(id, environment) {
  expect(session.store.read((state) => viewedLibraryVersionId(state, 'q1'))).toBe(id);
  expect(session.store.read((state) => libraryRunEnvironment(state, 'q1'))).toEqual(environment);
  expect(session.store.read((state) => withViewedLibraryVersion(state, identity).options.url)).toBe(id);
  expect(session.store.read((state) => isLibraryQueryLocked(state, 'q1'))).toBe(true);
}

// Break this catches: exact-environment filtering drops a promoted UUID selected in Development.
it('keeps a Staging-promoted version selected in Development', async () => {
  await select('saved-stg', dev);
  expectSelection('saved-stg', dev);
});

// Break this catches: refreshing reverts an earlier-environment selection to a different snapshot.
it.each([dev, staging, prod])(
  'keeps a Production-promoted version selected in $name through refresh',
  async (target) => {
    await select('saved-prod', target);
    expectSelection('saved-prod', target);
    await session.store.act((state) => state.queryLibrary.loadLibraryVersions('q1'));
    expectSelection('saved-prod', target);
    expect(
      session.store.read((state) => state.queryLibrary.versionsByQueryId.q1.versions.find((v) => v.id === 'saved-prod'))
    ).toMatchObject({ environment: prod });
  }
);

// Break this catches: fallback ignores eligible Production rows or leaks a draft into Staging.
it('falls back to an eligible promoted version when the selected UUID disappears', async () => {
  await select('saved-prod', staging);
  view = { drafts: view.drafts, versions: [snapshot('saved-prod-fallback', prod)] };
  await session.store.act((state) => state.queryLibrary.loadLibraryVersions('q1'));
  expectSelection('saved-prod-fallback', staging);
});
