import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import _useStore from '@/AppBuilder/_stores/store';
import { AppBuilderTestSession, defineAppBuilderScenario, componentDefinition } from '@/test/app-builder';
import DependencyViewer from '../../DependencyViewer';

const scenario = defineAppBuilderScenario({
  id: 'empty-entity-dependencies',
  name: 'An isolated entity keeps its selected dependency detail',
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

// Break this catches: relationship filtering drops an explicitly selected isolated entity back to the root.
test.each([
  ['component', 'c1', 'text1'],
  ['query', 'q1', 'query1'],
  ['variable', 'app:appCount', 'appCount'],
  ['variable', 'page:pageCount', 'pageCount'],
])('%s %s keeps its detail and offers a way back when it has no dependencies', async (kind, id, name) => {
  const session = new AppBuilderTestSession({ scenario });
  await session.store.act((state) => {
    state.initializeDependencySlice('canvas');
    state.setApp({ appId: 'app-1' }, 'canvas');
    state.setCurrentVersionId('version-1');
    state.setGlobalSettings({ ...state.globalSettings, variables: { appCount: { value: '1', fxActive: false } } });
    state.setPages(
      [
        {
          id: 'p1',
          name: 'Home',
          handle: 'home',
          variables: { pageCount: { value: '2', fxActive: false } },
          components: { c1: componentDefinition('c1', 'text1', 'Text', { text: { value: 'Hello' } }) },
        },
      ],
      'canvas'
    );
    state.setCurrentPageId('p1', 'canvas');
    state.dataQuery.setQueries([{ id: 'q1', name: 'query1', kind: 'runjs', options: { code: 'return 1;' } }], 'canvas');
    state.setComponentNameIdMapping('canvas');
    state.initDependencyGraph('canvas');
    state.initVariableDefinitions('canvas');
  });
  session.render(<DependencyViewer moduleId="canvas" onClose={() => {}} />);
  await session.store.act((state) => state.setEntityToViewDependencies({ kind, id }));

  await waitFor(() => expect(screen.getByText('No dependencies')).toBeVisible());
  expect(screen.getByTitle(name)).toBeVisible();
  const expression = {
    c1: 'components.text1.text',
    q1: 'queries.query1.data',
    'app:appCount': 'variables.appCount',
    'page:pageCount': 'page.variables.pageCount',
  }[id];
  await session.store.act((state) =>
    state.dataQuery.setQueries(
      [
        { id: 'q1', name: 'query1', kind: 'runjs', options: { code: 'return 1;' } },
        { id: 'q2', name: 'consumer', kind: 'runjs', options: { code: `return ${expression};` } },
      ],
      'canvas'
    )
  );
  await waitFor(() => expect(screen.queryByText('No dependencies')).not.toBeInTheDocument());
  expect(screen.getByText('consumer')).toBeVisible();
  await session.store.act((state) =>
    state.dataQuery.setQueries([{ id: 'q1', name: 'query1', kind: 'runjs', options: { code: 'return 1;' } }], 'canvas')
  );
  await waitFor(() => expect(screen.getByText('No dependencies')).toBeVisible());
  await session.user.click(screen.getByRole('button', { name: 'View all dependencies' }));
  expect(screen.queryByText('No dependencies')).not.toBeInTheDocument();
  expect(screen.getByPlaceholderText('Search dependencies')).toBeVisible();
});
