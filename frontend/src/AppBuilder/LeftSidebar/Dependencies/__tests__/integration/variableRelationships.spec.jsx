import React from 'react';
import { screen } from '@testing-library/react';
import _useStore from '@/AppBuilder/_stores/store';
import { AppBuilderTestSession, defineAppBuilderScenario } from '@/test/app-builder';
import DependencyViewer from '../../DependencyViewer';

const scenario = defineAppBuilderScenario({
  id: 'variable-dependency-relationships',
  name: 'Variable expressions expose both sides of their dependency relationships',
  primarySeam: 'rtl',
  surface: 'app-editor',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'draft',
  transferPath: 'not-applicable',
  access: 'authenticated',
  capabilities: { observers: true, media: { matches: false } },
});

// Break this catches: the dependency selector ignores declarations and the detail rows cannot drill into variables.
test.each([
  ['app', 'app', false],
  ['page', 'page', false],
  ['page', 'app', false],
  ['app', 'page', false],
  ['app', 'app', true],
])(
  '%s variable using %s variable (legacy fx: %s) shows both directions with the correct scope',
  async (readerScope, sourceScope, fxActive) => {
    const session = new AppBuilderTestSession({ scenario });
    const expression = `${sourceScope === 'page' ? 'page.' : ''}variables.base * 2`;
    await session.store.act((state) => {
      state.initializeDependencySlice('canvas');
      state.setApp({ appId: 'app-1' }, 'canvas');
      state.setCurrentVersionId('version-1');
      const app = { base: { value: '10', fxActive: false } };
      const page = { base: { value: '20', fxActive: false } };
      (readerScope === 'app' ? app : page).derived = { value: fxActive ? expression : `{{${expression}}}`, fxActive };
      app.literal = { value: 'variables.base', fxActive: false };
      state.setGlobalSettings({ ...state.globalSettings, variables: app });
      state.setPages([{ id: 'p1', name: 'Home', handle: 'home', variables: page, components: {} }], 'canvas');
      state.setCurrentPageId('p1', 'canvas');
      state.setComponentNameIdMapping('canvas');
      state.initDependencyGraph('canvas');
      state.initVariableDefinitions('canvas');
    });
    session.render(<DependencyViewer moduleId="canvas" onClose={() => {}} />);
    expect(screen.queryByRole('button', { name: /^literal$/ })).not.toBeInTheDocument();
    await session.user.click(await screen.findByRole('button', { name: /^derived$/ }));
    expect(screen.getByText('Uses (1)')).toBeVisible();
    expect(screen.queryByText('literal')).not.toBeInTheDocument();
    await session.user.click(screen.getByRole('button', { name: /^base / }));
    expect(screen.getByTitle('base')).toBeVisible();
    expect(screen.getByText(sourceScope === 'app' ? '10' : '20')).toBeVisible();
    expect(screen.getByText('Read by (1)')).toBeVisible();
    await session.user.click(screen.getByRole('button', { name: /^derived / }));
    expect(screen.getByTitle('derived')).toBeVisible();
    expect(screen.getByText('Uses (1)')).toBeVisible();
  }
);

// Break this catches: initial-value query/component sources disappear from Uses and reverse Used by.
test.each(
  ['app', 'page'].flatMap((scope) =>
    ['query', 'component'].flatMap((kind) =>
      ['name', 'id', 'bracket', 'optional', 'legacy'].map((notation) => [scope, kind, notation])
    )
  )
)('%s declaration using a %s via %s exposes both directions', async (scope, kind, notation) => {
  const session = new AppBuilderTestSession({ scenario });
  const queryId = 'a1111111-1111-4111-8111-111111111111';
  const sourceId = 'b2222222-2222-4222-8222-222222222222';
  const textId = 'c3333333-3333-4333-8333-333333333333';
  const sourceName = kind === 'query' ? 'restapi1' : 'input1';
  const root = kind === 'query' ? 'queries' : 'components';
  const key = notation === 'id' ? (kind === 'query' ? queryId : sourceId) : sourceName;
  const access = notation === 'bracket' ? `${root}['${key}']` : `${root}${notation === 'optional' ? '?.' : '.'}${key}`;
  const code = `${access}.${kind === 'query' ? 'data.users' : 'text'}`;
  const definition = { value: notation === 'legacy' ? code : `{{${code}}}`, fxActive: notation === 'legacy' };
  const variableName = 'processedUserDetailsObject';
  const map = { [variableName]: definition, staticLiteral: { value: code, fxActive: false } };
  const consumer = {
    component: {
      name: 'text1',
      component: 'Text',
      definition: {
        properties: {
          text: { value: `{{JSON.stringify(${scope === 'page' ? 'page.' : ''}variables.${variableName})}}` },
        },
      },
    },
    layouts: {},
  };
  await session.store.act((state) => {
    state.initializeDependencySlice('canvas');
    state.setApp({ appId: 'app-entity-source' }, 'canvas');
    state.setCurrentVersionId('version-entity-source');
    state.setGlobalSettings({ ...state.globalSettings, variables: scope === 'app' ? map : {} });
    state.setPages(
      [
        {
          id: 'p1',
          name: 'Home',
          handle: 'home',
          variables: scope === 'page' ? map : {},
          components: {
            [textId]: consumer,
            [sourceId]: {
              component: { name: 'input1', component: 'Text', definition: { properties: { text: { value: 'Ada' } } } },
              layouts: {},
            },
          },
        },
      ],
      'canvas'
    );
    state.setCurrentPageId('p1', 'canvas');
    state.dataQuery.setQueries([{ id: queryId, name: 'restapi1', kind: 'restapi', options: {} }], 'canvas');
    state.setQueryMapping('canvas');
    state.setComponentNameIdMapping('canvas');
    state.initDependencyGraph('canvas');
    state.initVariableDefinitions('canvas');
  });
  session.render(<DependencyViewer moduleId="canvas" onClose={() => {}} />);
  await session.store.act((s) => s.setEntityToViewDependencies({ kind: 'variable', id: `${scope}:${variableName}` }));
  expect(await screen.findByText('Read by (1)')).toBeVisible();
  expect(screen.getByRole('button', { name: /^text1 / })).toBeVisible();
  expect(screen.getByText('Uses (1)')).toBeVisible();
  expect(screen.queryByText('staticLiteral')).not.toBeInTheDocument();
  await session.user.click(screen.getByRole('button', { name: new RegExp(`^${sourceName} `) }));
  expect(await screen.findByText('Used by (1)')).toBeVisible();
  await session.user.click(screen.getByRole('button', { name: new RegExp(`^${variableName} `) }));
  expect(screen.getByTitle(variableName)).toBeVisible();
  expect(screen.getByText('Uses (1)')).toBeVisible();
});
