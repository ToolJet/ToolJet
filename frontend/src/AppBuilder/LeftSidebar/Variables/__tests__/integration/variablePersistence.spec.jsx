import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import toast, { Toaster } from 'react-hot-toast';
import { AppBuilderTestSession, defineAppBuilderScenario } from '@/test/app-builder';
// The session owns all access to this real composed store.
import _useStore from '@/AppBuilder/_stores/store';
import VariablesPanel from '../../VariablesPanel';

const scenario = defineAppBuilderScenario({
  id: 'variables-persistence',
  name: 'Variables respect editor locks and persistence failures',
  primarySeam: 'rtl',
  surface: 'app-editor',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'draft',
  transferPath: 'not-applicable',
  access: 'authenticated',
  capabilities: {
    observers: true,
    geometry: { textRange: true },
    media: { matches: false },
    network: [
      {
        method: 'put',
        url: '*/v2/apps/:appId/versions/:versionId/:resource',
        status: 500,
        json: () => {
          requests += 1;
          return { message: 'Save rejected' };
        },
      },
    ],
  },
});
let requests;
async function setup(scope = 'app') {
  toast.remove();
  requests = 0;
  const session = new AppBuilderTestSession({ scenario });
  await session.store.act((s) => {
    s.initializeDependencySlice('canvas');
    s.setApp({ appId: 'app-1' }, 'canvas');
    s.setCurrentVersionId('version-1');
    s.setGlobalSettings({ ...s.globalSettings, variables: {} });
    s.setPages([{ id: 'page-1', handle: 'home', name: 'Home', components: {}, variables: {} }], 'canvas');
    s.setCurrentPageId('page-1', 'canvas');
    s.setComponentNameIdMapping('canvas');
    s.initDependencyGraph('canvas');
  });
  await session.store.act('setVariableDefinitionMap', scope, {
    'variable-1': { id: 'variable-1', name: 'threshold', value: '5', fxActive: false },
  });
  requests = 0;
  return { session, definition: session.store.read((s) => s.getVariableDefinitions()[0]) };
}
afterEach(() => toast.remove());

// Break this catches: app/page HTTP errors are swallowed and reported as successful mutations.
test.each(['app', 'page'])(
  '%s mutations report failed persistence and preserve the saved definition',
  async (scope) => {
    const { session, definition } = await setup(scope);
    for (const input of [
      { scope, name: 'newVariable', value: '9' },
      { id: definition.id, value: '8' },
      { id: definition.id, name: 'renamed' },
    ]) {
      let result;
      await session.store.act(async (s) => {
        result = await s.saveVariableDefinition(input);
      });
      expect(result.ok).toBe(false);
      expect(session.store.read((s) => s.getVariableDefinitions())).toEqual([
        expect.objectContaining({ name: 'threshold', value: '5' }),
      ]);
    }
    let deleted;
    await session.store.act(async (s) => {
      deleted = await s.deleteVariableDefinition(definition.id);
    });
    expect(deleted.ok).toBe(false);
    expect(session.store.read((s) => s.getVariableDefinitions())).toEqual([
      expect.objectContaining({ name: 'threshold', value: '5' }),
    ]);
    expect(requests).toBe(4);
  }
);

// Break this catches: create shows a success toast and leaves the form after the server rejects it.
test.each(['app', 'page'])('%s failed create stays in the form without a success message', async (scope) => {
  const { session } = await setup(scope);
  session.render(
    <>
      <Toaster />
      <VariablesPanel moduleId="canvas" onClose={() => {}} />
    </>
  );
  await session.user.click(screen.getByRole('button', { name: `New ${scope} variable` }));
  await session.user.type(screen.getByPlaceholderText('e.g. selectedOrderId'), 'unsaved');
  await session.user.click(screen.getByRole('button', { name: 'Create variable' }));
  await waitFor(() => expect(requests).toBe(1));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Create variable' })).toBeEnabled());
  expect(screen.queryByText('Created {{variables.unsaved}}')).not.toBeInTheDocument();
  expect(screen.queryByText('Created {{page.variables.unsaved}}')).not.toBeInTheDocument();
  expect(screen.getByPlaceholderText('e.g. selectedOrderId')).toHaveValue('unsaved');
});

// Break this catches: frozen editors still expose mutations or accept writes from an already-open form.
test.each(['app', 'page'])('%s controls and store mutations respect editor freeze', async (scope) => {
  const { session, definition } = await setup(scope);
  session.render(<VariablesPanel moduleId="canvas" onClose={() => {}} />);
  await session.store.act('setIsEditorFreezed', true);
  expect(screen.getByRole('button', { name: 'New variable', exact: true })).toBeDisabled();
  expect(screen.getByRole('button', { name: `New ${scope} variable` })).toBeDisabled();
  await session.user.click(screen.getByRole('button', { name: /^threshold/ }));
  expect(screen.getByDisplayValue('threshold')).toBeDisabled();
  let saved;
  await session.store.act(async (s) => {
    saved = await s.saveVariableDefinition({ id: definition.id, value: '8' });
  });
  let deleted;
  await session.store.act(async (s) => {
    deleted = await s.deleteVariableDefinition(definition.id);
  });
  expect(saved.ok).toBe(false);
  expect(deleted.ok).toBe(false);
  expect(requests).toBe(0);
  expect(session.store.read((s) => s.getVariableDefinitions())).toEqual([expect.objectContaining({ value: '5' })]);
});

// Break this catches: a form opened on a draft remains writable after switching to a locked version.
test.each(['app', 'page'])('%s open create form becomes read-only when the editor locks', async (scope) => {
  const { session } = await setup(scope);
  session.render(<VariablesPanel moduleId="canvas" onClose={() => {}} />);
  await session.user.click(screen.getByRole('button', { name: `New ${scope} variable` }));
  await session.user.type(screen.getByPlaceholderText('e.g. selectedOrderId'), 'unsaved');
  await session.store.act('setIsEditorFreezed', true);
  expect(screen.getByPlaceholderText('e.g. selectedOrderId')).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Create variable' })).toBeDisabled();
  await session.user.click(screen.getByRole('button', { name: 'Create variable' }));
  expect(requests).toBe(0);
});
