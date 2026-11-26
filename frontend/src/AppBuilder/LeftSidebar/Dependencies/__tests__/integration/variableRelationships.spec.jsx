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
